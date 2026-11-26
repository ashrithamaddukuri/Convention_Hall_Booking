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
 * Loads .env.local (then .env) from the working directory and converts
 * Neon-style postgresql:// DATABASE_URL values into JDBC form so
 * Spring Boot datasource properties resolve correctly.
 */
public class NeonEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        Map<String, Object> props = new HashMap<>();

        // Load .env.local first, fall back to .env
        loadDotenv(".env.local", props);
        loadDotenv(".env",       props);

        // Convert DATABASE_URL → jdbc properties
        String dbUrl = resolve("DATABASE_URL", props, environment);
        if (dbUrl != null) {
            Map<String, String> jdbc = toJdbc(dbUrl);
            if (jdbc != null) {
                props.put("DB_JDBC_URL",  jdbc.get("url"));
                if (!props.containsKey("DB_USERNAME") && jdbc.get("username") != null)
                    props.put("DB_USERNAME", jdbc.get("username"));
                if (!props.containsKey("DB_PASSWORD") && jdbc.get("password") != null)
                    props.put("DB_PASSWORD", jdbc.get("password"));
            }
        }

        // Convert DATABASE_URL_UNPOOLED → Flyway direct URL
        String dbUrlUnpooled = resolve("DATABASE_URL_UNPOOLED", props, environment);
        if (dbUrlUnpooled != null) {
            Map<String, String> jdbc = toJdbc(dbUrlUnpooled);
            if (jdbc != null) {
                props.put("DB_JDBC_URL_UNPOOLED", jdbc.get("url"));
            }
        }

        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(
                new MapPropertySource("neonEnv", props));
        }
    }

    // ---- helpers ----

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
        } catch (Exception ignored) {
            // file not present — that's fine
        }
    }

    private String resolve(String key, Map<String, Object> props,
                           ConfigurableEnvironment env) {
        Object v = props.get(key);
        if (v != null) return v.toString();
        return env.getProperty(key);
    }

    /**
     * Converts postgresql://user:pass@host/db?params
     * to { url: "jdbc:postgresql://host/db?params", username, password }
     */
    private Map<String, String> toJdbc(String url) {
        if (url == null || url.isBlank()) return null;
        // Already JDBC format — nothing to do
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
            String query = uri.getRawQuery();
            String jdbcUrl = "jdbc:postgresql://" + uri.getHost()
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
