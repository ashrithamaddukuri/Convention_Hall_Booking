package com.conventionhall.booking.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvBuilder;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Handles database URL conversion for both local dev (.env.local) and
 * production (Render env vars). Converts postgresql:// → jdbc:postgresql://
 * and extracts username/password from the URL if not set separately.
 */
public class NeonEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        Map<String, Object> props = new HashMap<>();

        // 1. Load dotenv files (local dev only — ignored if missing)
        loadDotenv(".env.local", props);
        loadDotenv(".env",       props);

        // 2. For each key, prefer dotenv value, then fall back to system env
        //    This means Render env vars work automatically when no dotenv file exists

        // Convert DATABASE_URL (Neon postgresql:// format) → DB_JDBC_URL
        String dbUrl = firstNonNull(props.get("DATABASE_URL"),
                                    environment.getProperty("DATABASE_URL"));
        if (dbUrl != null && !dbUrl.startsWith("jdbc:")) {
            Map<String, String> jdbc = toJdbc(dbUrl);
            if (jdbc != null) {
                // Only set if not already explicitly provided
                if (!hasValue(props, environment, "DB_JDBC_URL"))
                    props.put("DB_JDBC_URL", jdbc.get("url"));
                if (!hasValue(props, environment, "DB_USERNAME") && jdbc.get("username") != null)
                    props.put("DB_USERNAME", jdbc.get("username"));
                if (!hasValue(props, environment, "DB_PASSWORD") && jdbc.get("password") != null)
                    props.put("DB_PASSWORD", jdbc.get("password"));
            }
        }

        // Convert DATABASE_URL_UNPOOLED → DB_JDBC_URL_UNPOOLED
        String dbUrlUnpooled = firstNonNull(props.get("DATABASE_URL_UNPOOLED"),
                                            environment.getProperty("DATABASE_URL_UNPOOLED"));
        if (dbUrlUnpooled != null && !dbUrlUnpooled.startsWith("jdbc:")) {
            Map<String, String> jdbc = toJdbc(dbUrlUnpooled);
            if (jdbc != null && !hasValue(props, environment, "DB_JDBC_URL_UNPOOLED"))
                props.put("DB_JDBC_URL_UNPOOLED", jdbc.get("url"));
        }

        // Also handle DB_JDBC_URL if it was set directly in postgresql:// format
        String directJdbcUrl = firstNonNull(props.get("DB_JDBC_URL"),
                                            environment.getProperty("DB_JDBC_URL"));
        if (directJdbcUrl != null && !directJdbcUrl.startsWith("jdbc:")) {
            Map<String, String> jdbc = toJdbc(directJdbcUrl);
            if (jdbc != null) props.put("DB_JDBC_URL", jdbc.get("url"));
        }

        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(
                new MapPropertySource("neonEnv", props));
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private boolean hasValue(Map<String, Object> props, ConfigurableEnvironment env, String key) {
        return props.containsKey(key) || env.getProperty(key) != null;
    }

    private String firstNonNull(Object... values) {
        for (Object v : values) if (v != null) return v.toString();
        return null;
    }

    private void loadDotenv(String filename, Map<String, Object> target) {
        try {
            DotenvBuilder builder = Dotenv.configure()
                .filename(filename)
                .ignoreIfMalformed()
                .ignoreIfMissing();
            Dotenv dotenv = builder.load();
            dotenv.entries().forEach(e -> {
                if (!target.containsKey(e.getKey()))
                    target.put(e.getKey(), e.getValue());
            });
        } catch (Exception ignored) {}
    }

    private Map<String, String> toJdbc(String url) {
        if (url == null || url.isBlank()) return null;
        if (url.startsWith("jdbc:")) return Map.of("url", url);
        try {
            URI uri = URI.create(url);
            String userInfo = uri.getUserInfo();
            String username = null, password = null;
            if (userInfo != null) {
                String[] parts = userInfo.split(":", 2);
                username = parts[0];
                password = parts.length > 1 ? parts[1] : null;
            }
            String query    = uri.getRawQuery();
            String jdbcUrl  = "jdbc:postgresql://" + uri.getHost()
                + (uri.getPort() > 0 ? ":" + uri.getPort() : "")
                + uri.getPath()
                + (query != null ? "?" + query : "");
            Map<String, String> result = new HashMap<>();
            result.put("url",      jdbcUrl);
            result.put("username", username);
            result.put("password", password);
            return result;
        } catch (Exception e) {
            return null;
        }
    }
}
