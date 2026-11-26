-- Enable extension required for EXCLUDE USING gist overlap constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Users
CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100)        NOT NULL,
    email      VARCHAR(150)        NOT NULL UNIQUE,
    password   VARCHAR(255)        NOT NULL,
    role       VARCHAR(20)         NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- Convention Halls
CREATE TABLE halls (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150)        NOT NULL,
    location    VARCHAR(255)        NOT NULL,
    capacity    INT                 NOT NULL,
    price_per_hour NUMERIC(10,2)   NOT NULL,
    description TEXT,
    image_url   VARCHAR(500),
    active      BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT              NOT NULL REFERENCES users(id),
    hall_id     BIGINT              NOT NULL REFERENCES halls(id),
    event_name  VARCHAR(200)        NOT NULL,
    start_time  TIMESTAMP           NOT NULL,
    end_time    TIMESTAMP           NOT NULL,
    status      VARCHAR(30)         NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP           NOT NULL DEFAULT NOW(),
    CONSTRAINT no_overlap EXCLUDE USING gist (
        hall_id WITH =,
        tsrange(start_time, end_time) WITH &&
    )
);

-- Bills
CREATE TABLE bills (
    id          BIGSERIAL PRIMARY KEY,
    booking_id  BIGINT              NOT NULL UNIQUE REFERENCES bookings(id),
    amount      NUMERIC(12,2)       NOT NULL,
    tax         NUMERIC(12,2)       NOT NULL DEFAULT 0,
    total       NUMERIC(12,2)       NOT NULL,
    paid        BOOLEAN             NOT NULL DEFAULT FALSE,
    issued_at   TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_hall_time ON bookings(hall_id, start_time, end_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
