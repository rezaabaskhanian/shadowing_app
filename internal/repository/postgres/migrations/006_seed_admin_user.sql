-- +migrate Up
-- کاربر ادمین پیش‌فرض برای ورود به پنل ادمین
--   شماره تلفن: 09000000000
--   رمز عبور:   admin123
-- (هش bcrypt رمز بالا؛ در محیط واقعی حتماً رمز را تغییر دهید)
INSERT INTO users (nickname, password_hash, phone, role)
VALUES (
    'admin',
    '$2a$10$hPfDB6eeWjHO4N5Pn.gw8ejfnOSuWD04JM4hN3WCg87sasBEY7IIa',
    '09000000000',
    'admin'
)
ON CONFLICT (phone) DO NOTHING;

-- +migrate Down
DELETE FROM users WHERE phone = '09000000000';
