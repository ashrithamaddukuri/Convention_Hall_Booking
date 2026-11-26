-- Replace foodMenu enum + decoration boolean with free-text descriptive columns
ALTER TABLE bookings
    DROP COLUMN food_menu,
    DROP COLUMN decoration,
    ADD COLUMN menu_summary       VARCHAR(1000),
    ADD COLUMN decoration_package VARCHAR(100);
