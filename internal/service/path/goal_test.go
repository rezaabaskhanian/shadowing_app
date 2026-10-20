package pathservice

import "testing"

func TestComputeForecast(t *testing.T) {
	// مثال طراحی: A2، ۹۰ روز، ۳۰ دقیقه → حدود ۳۸.۶ ساعت، سهم هدف ۴۰٪، ۲۰ موقعیت (کل بسته)
	f := ComputeForecast("beginner", 90, 30, 20)
	if f.HoursAvailable < 38 || f.HoursAvailable > 39 {
		t.Fatalf("hours = %v", f.HoursAvailable)
	}
	if f.GoalShare != 0.4 || f.SituationsTarget != 20 {
		t.Fatalf("share/target = %v/%d", f.GoalShare, f.SituationsTarget)
	}
	if f.LevelReachable || f.NextLevel != "intermediate" {
		t.Fatalf("level promise must not be made: %+v", f)
	}
	if f.LevelProgressPct < 10 || f.LevelProgressPct > 20 {
		t.Fatalf("progress = %d", f.LevelProgressPct)
	}
}

func TestComputeForecastShortDeadline(t *testing.T) {
	// ۲۱ روز، ۱۵ دقیقه: ≈ ۴.۵ ساعت، ۷۰٪ هدف → ۴ موقعیت
	f := ComputeForecast("starter", 21, 15, 16)
	if f.SituationsTarget != 4 {
		t.Fatalf("target = %d", f.SituationsTarget)
	}
}

func TestComputeForecastLongRunReachesLevel(t *testing.T) {
	f := ComputeForecast("starter", 400, 60, 16)
	if !f.LevelReachable || f.LevelProgressPct != 100 {
		t.Fatalf("expected reachable: %+v", f)
	}
}

func TestComputeForecastTopLevelHasNoNext(t *testing.T) {
	f := ComputeForecast("proficient", 100, 30, 10)
	if f.NextLevel != "" || f.LevelReachable {
		t.Fatalf("%+v", f)
	}
}
