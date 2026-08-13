package postgressettings

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"
)

// GetAll همه‌ی تنظیمات ذخیره‌شده در دیتابیس را به‌صورت map برمی‌گرداند.
func (r DB) GetAll(ctx context.Context) (map[string]string, error) {
	const op = "postgressettings.GetAll"

	rows, err := r.conn.Query(ctx, `SELECT key, value FROM app_settings`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن تنظیمات")
	}
	defer rows.Close()

	result := map[string]string{}
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن تنظیمات")
		}
		result[k] = v
	}
	return result, nil
}

// Set مقدار یک کلید را درج/به‌روزرسانی می‌کند (upsert).
func (r DB) Set(ctx context.Context, key, value string) error {
	const op = "postgressettings.Set"

	const query = `
		INSERT INTO app_settings (key, value, updated_at)
		VALUES ($1, $2, now())
		ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
	`
	if _, err := r.conn.Exec(ctx, query, key, value); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره تنظیمات")
	}
	return nil
}
