-- +migrate Up

-- کدهای تایید پیامکی (OTP) برای فراموشی رمز و ثبت‌نام. هر رکورد یک کد
-- کوتاه‌عمر است؛ بعد از verify شدن یک توکن یک‌بارمصرف صادر می‌شود که
-- register/reset-pass با آن اثبات می‌کنند شماره واقعاً تایید شده.
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'register' | 'reset'
  code TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  token TEXT,
  token_expires_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_purpose ON otp_codes(phone, purpose);
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_codes_token ON otp_codes(token) WHERE token IS NOT NULL;

-- +migrate Down
DROP TABLE IF EXISTS otp_codes;
