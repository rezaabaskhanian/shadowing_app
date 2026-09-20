package aiaccessservice

import (
	"encoding/json"
	"strings"

	settingsservice "shadowing-backend/internal/service/settings"
)

// ProviderPricing قیمتِ یک provider را نگه می‌دارد — دلار به‌ازای هر ۱ میلیون
// توکنِ ورودی/خروجی، چون این واحدی است که provider ها معمولاً قیمت می‌دهند.
type ProviderPricing struct {
	InputPer1M  float64 `json:"input_per_1m"`
	OutputPer1M float64 `json:"output_per_1m"`
}

// PricingTable قیمتِ هر provider را کلیدگذاری می‌کند — دقیقاً با همان مقادیرِ
// AI_PROVIDER (anthropic/gemini/deepseek/openrouter).
type PricingTable map[string]ProviderPricing

// defaultPricingTable وقتی از پنل ادمین (AI_TOKEN_PRICING) چیزی تنظیم نشده
// استفاده می‌شود — تخمینِ تقریبیِ رده‌ی flash/economy این providerها، فقط تا
// گزارشِ هزینه قبل از تنظیمِ دستی کاملاً صفر نشان ندهد. برای هزینه‌ی واقعی،
// این مقادیر باید از قیمتِ اعلام‌شده‌ی خودِ provider/مدلِ فعال به‌روزرسانی شوند
// (قیمت‌ها مدام تغییر می‌کنند، مخصوصاً وقتی مدل عوض می‌شود).
var defaultPricingTable = PricingTable{
	"gemini":     {InputPer1M: 0.10, OutputPer1M: 0.40},
	"deepseek":   {InputPer1M: 0.14, OutputPer1M: 0.28},
	"openrouter": {InputPer1M: 0.10, OutputPer1M: 0.40},
	"anthropic":  {InputPer1M: 3.00, OutputPer1M: 15.00},
}

// pricingTable جدولِ قیمتِ فعال را می‌خواند: از AI_TOKEN_PRICING (JSON، مثلاً
// {"gemini":{"input_per_1m":0.1,"output_per_1m":0.4}}) اگر تنظیم شده باشد،
// وگرنه defaultPricingTable. یک provider که در JSON نیامده از پیش‌فرض خودش
// می‌گیرد (merge، نه replace کامل) تا تنظیم‌کردن فقط یکی بقیه را صفر نکند.
func (s *Service) pricingTable() PricingTable {
	table := make(PricingTable, len(defaultPricingTable))
	for k, v := range defaultPricingTable {
		table[k] = v
	}

	raw := strings.TrimSpace(s.settings.Get(settingsservice.KeyAITokenPricing))
	if raw == "" {
		return table
	}
	var configured PricingTable
	if err := json.Unmarshal([]byte(raw), &configured); err != nil {
		return table
	}
	for k, v := range configured {
		table[strings.ToLower(strings.TrimSpace(k))] = v
	}
	return table
}

// activeProvider همان چیزی است که AI_PROVIDER تعیین می‌کند — پیش‌فرضش هم عیناً
// aiservice.Service.activeProvider است (anthropic).
func (s *Service) activeProvider() string {
	p := strings.ToLower(strings.TrimSpace(s.settings.Get(settingsservice.KeyAIProvider)))
	if p == "" {
		return "anthropic"
	}
	return p
}

// costUSD هزینه‌ی دلاریِ یک مقدار توکن را با قیمتِ providerِ فعال حساب می‌کند.
// این یک تخمین است، نه حسابداریِ دقیق: اگر ادمین provider/مدل را وسطِ یک روز
// عوض کند، مصرفِ همان روز با قیمتِ providerِ *فعلی* حساب می‌شود، نه قیمتِ
// واقعیِ هر تماس در لحظه‌ی اجرا — برای هدفِ این گزارش (قیمت‌گذاریِ SKU، نه
// صورتحسابِ دقیق) کافی است.
func (s *Service) costUSD(inputTokens, outputTokens int) float64 {
	pricing := s.pricingTable()[s.activeProvider()]
	return float64(inputTokens)/1_000_000*pricing.InputPer1M + float64(outputTokens)/1_000_000*pricing.OutputPer1M
}
