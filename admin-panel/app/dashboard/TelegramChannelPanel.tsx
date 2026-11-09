"use client";

import { useEffect, useState } from "react";
import {
  getTelegramChannelConfig,
  testTelegramChannel,
  sendTelegramChannelNow,
  previewTelegramChannel,
  updateSetting,
} from "@/lib/api";
import type { TelegramChannelConfig } from "@/lib/types";

export default function TelegramChannelPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [config, setConfig] = useState<TelegramChannelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [postTime, setPostTime] = useState("08:30");
  const [postMode, setPostMode] = useState<"auto_daily" | "custom">("auto_daily");
  const [customText, setCustomText] = useState("");
  const [botToken, setBotToken] = useState("");
  const [preview, setPreview] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await getTelegramChannelConfig();
      setConfig(data);
      setEnabled(data.enabled);
      setChannelId(data.channel_id || "");
      setPostTime(data.post_time || "08:30");
      setPostMode((data.post_mode as any) === "custom" ? "custom" : "auto_daily");
      setCustomText(data.custom_text || "");
      setPreview(data.preview || "");
    } catch (err: any) {
      notify(err.message || "خطا در دریافت اطلاعات کانال تلگرام", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveSettings() {
    setSaving(true);
    try {
      await updateSetting("TELEGRAM_CHANNEL_ENABLED", enabled ? "true" : "false");
      await updateSetting("TELEGRAM_CHANNEL_ID", channelId.trim());
      await updateSetting("TELEGRAM_CHANNEL_POST_TIME", postTime.trim());
      await updateSetting("TELEGRAM_CHANNEL_POST_MODE", postMode);
      await updateSetting("TELEGRAM_CHANNEL_CUSTOM_TEXT", customText.trim());
      if (botToken.trim()) {
        await updateSetting("TELEGRAM_CHANNEL_BOT_TOKEN", botToken.trim());
        setBotToken("");
      }

      notify("تنظیمات کانال تلگرام با موفقیت ذخیره شد ✅", "ok");
      await loadData();
    } catch (err: any) {
      notify(err.message || "خطا در ذخیره تنظیمات", "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSend() {
    if (!channelId.trim()) {
      notify("لطفاً ابتدا آیدی کانال را وارد کنید", "err");
      return;
    }
    setTesting(true);
    try {
      const res = await testTelegramChannel();
      notify(res.message || "پیام تستی به کانال ارسال شد ✅", "ok");
      await loadData();
    } catch (err: any) {
      notify(err.message || "خطا در ارسال پیام تستی", "err");
    } finally {
      setTesting(false);
    }
  }

  async function handleSendNow() {
    if (!channelId.trim()) {
      notify("لطفاً ابتدا آیدی کانال را وارد کنید", "err");
      return;
    }
    if (!window.confirm("آیا مطمئن هستید که می‌خواهید پست امروز همین حالا در کانال تلگرام منتشر شود؟")) {
      return;
    }
    setSendingNow(true);
    try {
      const res = await sendTelegramChannelNow(postMode === "custom" ? customText : "");
      notify(res.message || "پست امروز با موفقیت در کانال منتشر شد 🚀", "ok");
      await loadData();
    } catch (err: any) {
      notify(err.message || "خطا در ارسال فوری پست", "err");
    } finally {
      setSendingNow(false);
    }
  }

  async function handleRefreshPreview() {
    try {
      const res = await previewTelegramChannel();
      setPreview(res.preview);
      notify("پیش‌نمایش به‌روزرسانی شد 🔄", "ok");
    } catch (err: any) {
      notify(err.message || "خطا در بازخوانی پیش‌نمایش", "err");
    }
  }

  if (loading) {
    return <p className="hint">در حال بارگذاری تنظیمات کانال تلگرام...</p>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* هدر و کارت خلاصه وضعیت */}
      <div
        className="card"
        style={{
          borderTop: "4px solid var(--primary, #0284c7)",
          background: "linear-gradient(180deg, rgba(2, 132, 199, 0.05) 0%, rgba(2, 132, 199, 0.01) 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: 22, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📢</span>
              <span>ارسال خودکار صبحگاهی به کانال تلگرام</span>
            </h1>
            <p style={{ margin: 0, opacity: 0.8, fontSize: 13, lineHeight: 1.7 }}>
              سیستم انتشار خودکار روزانه مباحث آموزشی، اصطلاحات کاربردی روزمره، مینی‌دیالوگ‌ها، نکات گرامری و دعوت به
              تمرین سایه‌زنی (Shadowing) در اپلیکیشن لینگوفلو راس ساعت مشخص هر صبح.
            </p>
          </div>

          {/* بج وضعیت فعال/غیرفعال */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: enabled ? "rgba(34, 197, 94, 0.15)" : "rgba(156, 163, 175, 0.15)",
                color: enabled ? "#16a34a" : "#6b7280",
                border: `1px solid ${enabled ? "rgba(34, 197, 94, 0.3)" : "rgba(156, 163, 175, 0.3)"}`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: enabled ? "#22c55e" : "#9ca3af",
                }}
              />
              {enabled ? `ارسال خودکار فعال (راس ساعت ${postTime})` : "ارسال خودکار غیرفعال"}
            </span>
          </div>
        </div>

        {/* وضعیت آخرین ارسال */}
        {config?.last_status && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              backgroundColor: "rgba(0, 0, 0, 0.03)",
              border: "1px dashed rgba(0, 0, 0, 0.1)",
              fontSize: 12.5,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>📌</span>
            <span>
              <strong>آخرین وضعیت ارسال:</strong> {config.last_status}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* ستون اول: تنظیمات زمان‌بندی و اتصال */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* کارت تنظیمات */}
          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: 16 }}>⚙️ تنظیمات کانال و زمان‌بندی</h2>

            {/* سوئیچ فعال‌سازی */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 8,
                backgroundColor: enabled ? "rgba(34, 197, 94, 0.08)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${enabled ? "rgba(34, 197, 94, 0.25)" : "rgba(0,0,0,0.06)"}`,
                marginBottom: 16,
              }}
            >
              <div>
                <strong style={{ fontSize: 14 }}>روشن بودن ارسال روزانه</strong>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                  هر روز صبح پست آموزشی به کانال فرستاده شود
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ width: 20, height: 20, cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{enabled ? "فعال" : "خاموش"}</span>
              </label>
            </div>

            {/* آیدی کانال */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                آیدی یا شناسه کانال تلگرام:
              </label>
              <input
                dir="ltr"
                type="text"
                placeholder="مثلاً @lingoflow_app یا -1001234567890"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", fontFamily: "monospace" }}
              />
              <span style={{ fontSize: 11.5, opacity: 0.7, marginTop: 4, display: "block" }}>
                اگر کانال عمومی است یوزرنیم با @ را وارد کنید. اگر خصوصی است شناسه‌ی عددی را بنویسید.
              </span>
            </div>

            {/* ساعت ارسال */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                ساعت ارسال صبحگاهی (به وقت تهران):
              </label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  dir="ltr"
                  type="time"
                  value={postTime}
                  onChange={(e) => setPostTime(e.target.value)}
                  style={{ padding: "8px 14px", fontSize: 15, fontWeight: 600, borderRadius: 6, width: 130 }}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["07:30", "08:00", "08:30", "09:00"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setPostTime(t)}
                      style={{
                        padding: "4px 8px",
                        fontSize: 12,
                        backgroundColor: postTime === t ? "var(--primary, #0284c7)" : undefined,
                        color: postTime === t ? "#fff" : undefined,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* توکن ربات */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                توکن ربات تلگرام:
                {config?.bot_token.set ? (
                  <span style={{ color: "#16a34a", fontSize: 12, marginRight: 8 }}>
                    ✓ ست‌شده ({config.bot_token.masked})
                  </span>
                ) : (
                  <span style={{ color: "#ef4444", fontSize: 12, marginRight: 8 }}>ست نشده</span>
                )}
              </label>
              <input
                dir="ltr"
                type="password"
                placeholder={config?.bot_token.set ? "برای تغییر، توکن جدید را بنویسید" : "123456:ABC-DEF..."}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                style={{ width: "100%", padding: "9px 12px" }}
              />
              <span style={{ fontSize: 11.5, opacity: 0.7, marginTop: 4, display: "block" }}>
                اگر خالی بگذارید، از توکن ربات تلگرام ثبت‌شده در تب تنظیمات استفاده می‌شود.
              </span>
            </div>

            {/* انتخاب منبع محتوا */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                نوع محتوای ارسالی:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    backgroundColor: postMode === "auto_daily" ? "rgba(2, 132, 199, 0.06)" : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="post_mode"
                    value="auto_daily"
                    checked={postMode === "auto_daily"}
                    onChange={() => setPostMode("auto_daily")}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>مجموعه هوشمند و روزانه لینگوفلو (پیشنهادی)</div>
                    <div style={{ fontSize: 11.5, opacity: 0.7 }}>
                      انتخاب روزانه اصطلاحات کاربردی، مینی‌دیالوگ دو نفره، راهنمای تلفظ و دعوت به تمرین سایه‌زنی در اپ
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    backgroundColor: postMode === "custom" ? "rgba(2, 132, 199, 0.06)" : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="post_mode"
                    value="custom"
                    checked={postMode === "custom"}
                    onChange={() => setPostMode("custom")}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>متن دلخواه ادمین (Custom Message)</div>
                    <div style={{ fontSize: 11.5, opacity: 0.7 }}>
                      قالب یا پیام ثابتی که خودتان در کادر زیر می‌نویسید
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* کادر متن دلخواه اگر custom بود */}
            {postMode === "custom" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  متن اختصاصی پست تلگرام:
                </label>
                <textarea
                  rows={8}
                  dir="auto"
                  placeholder="متن پیام تلگرام خود را با فرمت Markdown بنویسید..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", fontSize: 13, lineHeight: 1.6 }}
                />
              </div>
            )}

            {/* دکمه ذخیره تنظیمات */}
            <button
              className="btn btn-primary"
              onClick={handleSaveSettings}
              disabled={saving}
              style={{ width: "100%", padding: "10px", fontWeight: 600 }}
            >
              {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره تنظیمات کانال"}
            </button>
          </div>

          {/* کارت راهنمای سریع راه‌اندازی */}
          <div className="card" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
            <h3 style={{ marginTop: 0, fontSize: 14 }}>💡 راهنمای ۳ مرحله‌ای راه‌اندازی:</h3>
            <ol style={{ paddingRight: 20, margin: 0, fontSize: 12.5, lineHeight: 1.9, opacity: 0.85 }}>
              <li>کانال تلگرامی خود را بسازید (عمومی یا خصوصی).</li>
              <li>
                ربات تلگرام خود را به عنوان <strong>مدیر (Administrator)</strong> به کانال اضافه کنید و تیک{" "}
                <strong>Post Messages</strong> را فعال بگذارید.
              </li>
              <li>
                آیدی کانال (مثلاً <code>@lingoflow_english</code>) را در کادر بالا وارد کرده و دکمه{" "}
                <strong>«ارسال پیام تستی»</strong> را بزنید.
              </li>
            </ol>
          </div>
        </div>

        {/* ستون دوم: پیش‌نمایش زنده و دکمه‌های عملیاتی */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* کارت عملیات فوری و تست */}
          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: 16 }}>⚡️ عملیات و تست فوری</h2>
            <p style={{ marginTop: 0, opacity: 0.75, fontSize: 12.5, lineHeight: 1.6 }}>
              برای اطمینان از عملکرد بات یا ارسال فوری پست امروز، از دکمه‌های زیر استفاده کنید:
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleTestSend}
                disabled={testing}
                style={{ flex: 1, minWidth: 150, padding: "9px 12px" }}
              >
                {testing ? "در حال ارسال تست..." : "🧪 ارسال پیام تستی به کانال"}
              </button>

              <button
                className="btn btn-sm"
                onClick={handleSendNow}
                disabled={sendingNow}
                style={{
                  flex: 1,
                  minWidth: 150,
                  padding: "9px 12px",
                  backgroundColor: "var(--primary, #0284c7)",
                  color: "#fff",
                }}
              >
                {sendingNow ? "در حال ارسال..." : "🚀 ارسال فوری پست امروز"}
              </button>
            </div>
          </div>

          {/* کارت پیش‌نمایش پست */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <span>👁</span>
                <span>پیش‌نمایش پست امروز تلگرام</span>
              </h2>
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleRefreshPreview}
                style={{ fontSize: 12, padding: "4px 8px" }}
              >
                🔄 تازه‌سازی
              </button>
            </div>

            {/* شبیه‌ساز حباب پیام تلگرام */}
            <div
              style={{
                backgroundColor: "#f1f5f9",
                borderRadius: 12,
                padding: 16,
                border: "1px solid #cbd5e1",
                fontFamily: "system-ui, -apple-system, sans-serif",
                color: "#1e293b",
                fontSize: 13,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 520,
                overflowY: "auto",
              }}
              dangerouslySetInnerHTML={{
                __html: preview ? preview.replace(/\n/g, "<br/>") : "در حال آماده‌سازی پیش‌نمایش...",
              }}
            />

            <p style={{ fontSize: 11.5, opacity: 0.65, marginTop: 10, marginBottom: 0 }}>
              * پست بالا دقیقا با همین قالب به همراه لینک و منشن کانال، هر روز صبح در ساعت مقرر به صورت خودکار ارسال
              می‌شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

