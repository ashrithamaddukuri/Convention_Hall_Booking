-- Add extra service columns to bookings
ALTER TABLE bookings
    ADD COLUMN guest_count     INT            NOT NULL DEFAULT 1,
    ADD COLUMN food_menu       VARCHAR(20)    NOT NULL DEFAULT 'NONE',
    ADD COLUMN catering        BOOLEAN        NOT NULL DEFAULT FALSE,
    ADD COLUMN decoration      BOOLEAN        NOT NULL DEFAULT FALSE;

-- Add extra cost breakdown columns to bills
ALTER TABLE bills
    ADD COLUMN hall_charge     NUMERIC(12,2)  NOT NULL DEFAULT 0,
    ADD COLUMN food_charge     NUMERIC(12,2)  NOT NULL DEFAULT 0,
    ADD COLUMN catering_charge NUMERIC(12,2)  NOT NULL DEFAULT 0,
    ADD COLUMN decoration_charge NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Back-fill hall_charge = amount for existing bills
UPDATE bills SET hall_charge = amount;
