package phone

import "testing"

func TestNormalize(t *testing.T) {
	cases := map[string]string{
		"09121234567":      "09121234567",
		"۰۹۱۲۱۲۳۴۵۶۷":      "09121234567",
		"٠٩١٢١٢٣٤٥٦٧":      "09121234567",
		"9121234567":       "09121234567",
		"+989121234567":    "09121234567",
		"00989121234567":   "09121234567",
		"989121234567":     "09121234567",
		" 0912 123 45 67 ": "09121234567",
		"0912-123-4567":    "09121234567",
	}
	for in, want := range cases {
		if got := Normalize(in); got != want {
			t.Errorf("Normalize(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestVariantsFindLegacyForms(t *testing.T) {
	v := Variants("09121234567")
	want := []string{"09121234567", "9121234567", "+989121234567", "989121234567", "۰۹۱۲۱۲۳۴۵۶۷"}
	for _, w := range want {
		found := false
		for _, x := range v {
			if x == w {
				found = true
			}
		}
		if !found {
			t.Errorf("Variants missing %q: %v", w, v)
		}
	}
}
