-- +migrate Up
-- نقشه‌ی هر هدف: یک عکس بزرگ شهر (مثلاً شهر سفر) که کاربر در «برنامه‌ی من» با انگشت
-- جابه‌جا و زوم می‌کند. هر نقطه با شماره‌ی موقعیتِ بسته‌ی هدف وصل است، نه شناسه‌اش،
-- چون ذخیره‌ی دوباره‌ی بسته شناسه‌ی موقعیت‌ها را از نو می‌سازد.
CREATE TABLE IF NOT EXISTS goal_maps (
    goal       TEXT PRIMARY KEY CHECK (goal IN ('travel', 'migration', 'study', 'work')),
    image_url  TEXT NOT NULL,
    width      INT  NOT NULL CHECK (width > 0),
    height     INT  NOT NULL CHECK (height > 0),
    -- نسخه‌ی پرجزئیات نقشه به‌صورت کاشی (مثل گوگل‌مپس): اپ فقط کاشی‌های روی صفحه را
    -- بار می‌کند تا عکس چندهزار پیکسلی روی گوشی‌های کم‌رم کرش نکند. null = فقط image_url.
    tiles      JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_map_spots (
    goal     TEXT NOT NULL REFERENCES goal_maps (goal) ON DELETE CASCADE,
    position INT  NOT NULL CHECK (position > 0),
    x        REAL NOT NULL CHECK (x >= 0 AND x <= 100),
    y        REAL NOT NULL CHECK (y >= 0 AND y <= 100),
    PRIMARY KEY (goal, position)
);

-- +migrate Down
DROP TABLE IF EXISTS goal_map_spots;
DROP TABLE IF EXISTS goal_maps;
