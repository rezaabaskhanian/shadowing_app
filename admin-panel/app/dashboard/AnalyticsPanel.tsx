"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "@/lib/api";
import type { AnalyticsCohort, AnalyticsSummary } from "@/lib/types";

const RANGES = [7, 30, 90];

// نام‌های فارسی route های اپ (app/src/navigation/AppNavigator.tsx).
const SCREEN_LABELS: Record<string, string> = {
  Home: "خانه",
  Scenes: "صحنه‌ها",
  Shadowing: "صحنه (تمرین)",
  SceneQuiz: "آزمون صحنه",
  Progress: "پیشرفت",
  Profile: "پروفایل",
  Leitner: "جعبه لایتنر",
  CurriculumMap: "نقشه‌ی مسیر",
  AIConversation: "گفتگو با AI",
  FreeSpeech: "صحبت آزاد",
  TopicList: "موضوع‌های صحبت",
  TopicSpeaking: "صحبت درباره‌ی موضوع",
  VideoClipList: "کلیپ‌های ویدیویی",
  VideoClip: "تمرین با کلیپ",
  WritingList: "موضوع‌های نوشتن",
  Writing: "نوشتن داستان",
  CourseHome: "دوره‌ی مبتدی",
  CourseLesson: "درس دوره‌ی مبتدی",
  PodcastList: "پادکست‌ها",
  Podcast: "پخش پادکست",
  LanguageHabit: "عادت زبانی",
  HabitMissionPractice: "تمرین مأموریت",
  HabitMissionResult: "نتیجه‌ی مأموریت",
  Paywall: "خرید اشتراک",
  TokenTopup: "خرید توکن",
  VerbDetail: "فعل چندمعنایی",
  VerbQuiz: "آزمون فعل",
  VerbSpeak: "تمرین گفتاری فعل",
  MyRecordings: "ضبط‌های من",
  MySubmissions: "پیشنهادهای من",
  SubmitScene: "پیشنهاد صحنه",
  TopicSuggestion: "پیشنهاد موضوع",
  HelpFaq: "راهنما",
  ContactUs: "تماس با ما",
};

const EVENT_LABELS: Record<string, string> = {
  app_open: "باز کردن اپ (نصب جدید)",
  onboarding_completed: "تمام کردن معرفی",
  signed_in: "ورود / ثبت‌نام",
  placement_completed: "تمام کردن تست تعیین سطح",
  scene_opened: "ورود به صحنه",
  shadow_recorded: "ضبط صدا در صحنه",
  scene_completed: "تمام کردن صحنه",
  paywall_viewed: "دیدن صفحه‌ی خرید",
  purchase_completed: "خرید اشتراک",
  ai_conversation_started: "شروع گفتگو با AI",
  free_speech_submitted: "ارسال صحبت آزاد",
  topic_speaking_submitted: "صحبت درباره‌ی موضوع",
  video_clip_opened: "باز کردن کلیپ ویدیویی",
  video_clip_quiz_done: "جواب دادن سؤال‌های فهم کلیپ",
  video_clip_performed: "اجرای نقش در کلیپ",
  writing_submitted: "ارسال متن برای تصحیح",
  course_lesson_completed: "تمام کردن درس دوره‌ی مبتدی",
  podcast_played: "پخش پادکست",
  token_topup_viewed: "دیدن صفحه‌ی خرید توکن",
  token_topup_purchased: "خرید توکن",
};

/** «۴۲٪ (۲۱ از ۵۰)» — یا خط تیره وقتی هنوز کسی به آن روز نرسیده. */
function pct(part: number, whole: number) {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}٪ (${part} از ${whole})`;
}

const th: React.CSSProperties = { padding: "6px 8px", textAlign: "right", opacity: 0.7, fontWeight: 600 };
const td: React.CSSProperties = { padding: "6px 8px", borderTop: "1px solid var(--border, #333)" };

function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div className="card" style={{ flex: "1 1 160px", margin: 0 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{value ?? "—"}</div>
    </div>
  );
}

function CohortTable({ rows }: { rows: AnalyticsCohort[] }) {
  return (
    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={th}>نسخه</th>
          <th style={th}>نصب جدید</th>
          <th style={th}>برگشت روز ۱</th>
          <th style={th}>برگشت روز ۷</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td style={td} colSpan={4}>هنوز داده‌ای نیست</td>
          </tr>
        ) : (
          rows.map((c) => (
            <tr key={c.app_version}>
              <td style={td}>{c.app_version || "نامشخص"}</td>
              <td style={td}>{c.new_devices}</td>
              <td style={td}>{pct(c.d1_retained, c.d1_eligible)}</td>
              <td style={td}>{pct(c.d7_retained, c.d7_eligible)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default function AnalyticsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAnalyticsSummary(days)
      .then((res) => active && setData(res))
      .catch((err: any) => notify(err.message, "err"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const today = data?.daily[0];
  const funnelTop = data?.funnel[0]?.devices ?? 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>📊 آمار اپ</h2>
          <p className="hint" style={{ margin: "4px 0 0" }}>
            نصب‌ها، کاربران فعال، ماندگاری، صفحه‌ها و قیف خرید (روزها به وقت تهران). هر «دستگاه» یعنی یک نصب اپ.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {RANGES.map((r) => (
            <button
              key={r}
              className={`btn btn-sm ${r === days ? "" : "btn-ghost"}`}
              onClick={() => setDays(r)}
            >
              {r} روز
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? <p className="hint">در حال بارگذاری...</p> : null}

      {data ? (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
            <Stat label="دستگاه فعال امروز" value={today?.active_devices} />
            <Stat label="نصب جدید امروز" value={today?.new_devices} />
            <Stat label="کاربر واردشده‌ی فعال امروز" value={today?.active_users} />
            <Stat label={`نصب جدید در ${days} روز`} value={data.daily.reduce((n, d) => n + d.new_devices, 0)} />
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>قیف اصلی</h3>
            <p className="hint" style={{ marginTop: 0 }}>
              از نصب‌های جدید این بازه، چند تا به هر قدم رسیدند. درصدها نسبت به همه‌ی نصب‌های جدید است.
            </p>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>قدم</th>
                  <th style={th}>دستگاه</th>
                  <th style={th}>درصد</th>
                </tr>
              </thead>
              <tbody>
                {data.funnel.map((f) => (
                  <tr key={f.event}>
                    <td style={td}>{EVENT_LABELS[f.event] ?? f.event}</td>
                    <td style={td}>{f.devices}</td>
                    <td style={td}>{funnelTop ? `${Math.round((f.devices / funnelTop) * 100)}٪` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>ماندگاری به تفکیک نسخه</h3>
            <p className="hint" style={{ marginTop: 0 }}>
              نصب‌های جدید این بازه بر اساس نسخه‌ی اولین اجرا. «برگشت روز ۱» یعنی فردای نصب دوباره اپ را باز کرد.
            </p>
            <CohortTable rows={data.versions} />
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div className="card" style={{ flex: "1 1 360px" }}>
              <h3 style={{ marginTop: 0 }}>پربازدیدترین صفحه‌ها</h3>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>صفحه</th>
                    <th style={th}>بازدید</th>
                    <th style={th}>دستگاه</th>
                  </tr>
                </thead>
                <tbody>
                  {data.screens.length === 0 ? (
                    <tr>
                      <td style={td} colSpan={3}>هنوز داده‌ای نیست</td>
                    </tr>
                  ) : (
                    data.screens.map((s) => (
                      <tr key={s.screen}>
                        <td style={td}>{SCREEN_LABELS[s.screen] ?? s.screen}</td>
                        <td style={td}>{s.views}</td>
                        <td style={td}>{s.devices}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ flex: "1 1 360px" }}>
              <h3 style={{ marginTop: 0 }}>استفاده از قابلیت‌ها</h3>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>کار</th>
                    <th style={th}>دفعات</th>
                    <th style={th}>دستگاه</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.length === 0 ? (
                    <tr>
                      <td style={td} colSpan={3}>هنوز داده‌ای نیست</td>
                    </tr>
                  ) : (
                    data.events.map((e) => (
                      <tr key={e.event}>
                        <td style={td}>{EVENT_LABELS[e.event] ?? e.event}</td>
                        <td style={td}>{e.count}</td>
                        <td style={td}>{e.devices}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>روزانه</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>تاریخ</th>
                    <th style={th}>باز شدن اپ</th>
                    <th style={th}>دستگاه فعال</th>
                    <th style={th}>نصب جدید</th>
                    <th style={th}>کاربر واردشده</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((d) => (
                    <tr key={d.date}>
                      <td style={td}>{new Date(`${d.date}T12:00:00`).toLocaleDateString("fa-IR")}</td>
                      <td style={td}>{d.opens}</td>
                      <td style={td}>{d.active_devices}</td>
                      <td style={td}>{d.new_devices}</td>
                      <td style={td}>{d.active_users}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
