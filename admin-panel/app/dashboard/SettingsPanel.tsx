"use client";

import { useEffect, useState } from "react";
import { changePassword, getName, getSettings, updateSetting } from "@/lib/api";
import type { SettingsResp } from "@/lib/types";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "ANTHROPIC_API_KEY", label: "کلید Anthropic (Claude)" },
  { key: "CLAUDE_MODEL", label: "مدل Claude", hint: "مثلاً claude-sonnet-4-6 — خالی بگذار برای پیش‌فرض" },
  { key: "GEMINI_API_KEY", label: "کلید Gemini" },
  { key: "GEMINI_MODEL", label: "مدل Gemini", hint: "مثلاً gemini-flash-latest — خالی بگذار برای پیش‌فرض" },
  { key: "ELEVENLABS_API_KEY", label: "کلید ElevenLabs (تولید صدا)" },
  { key: "ELEVENLABS_VOICE_ID", label: "شناسه صدای ElevenLabs", hint: "خالی بگذار برای صدای پیش‌فرض" },
  {
    key: "FCM_SERVICE_ACCOUNT_JSON",
    label: "کلید سرویس Firebase (FCM، برای نوتیفیکیشن Push)",
    hint: "کل محتوای فایل JSON کلید سرویس Firebase را اینجا جای‌گذاری کن",
  },
];

export default function SettingsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [settings, setSettings] = useState<SettingsResp | null>(null);
  const [provider, setProvider] = useState<"anthropic" | "gemini">("anthropic");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const s = await getSettings();
      setSettings(s);
      setProvider((s.ai_provider as "anthropic" | "gemini") || "anthropic");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProvider(next: "anthropic" | "gemini") {
    setProvider(next);
    setSaving("AI_PROVIDER");
    try {
      await updateSetting("AI_PROVIDER", next);
      notify(`ارائه‌دهنده‌ی فعال روی ${next} تنظیم شد ✅ (بدون نیاز به ری‌استارت)`, "ok");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(null);
    }
  }

  async function saveField(key: string) {
    const value = inputs[key];
    if (value === undefined || value.trim() === "") {
      notify("یک مقدار وارد کن", "err");
      return;
    }
    setSaving(key);
    try {
      await updateSetting(key, value.trim());
      notify("ذخیره شد ✅ همین الان فعال شد", "ok");
      setInputs((s) => ({ ...s, [key]: "" }));
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(null);
    }
  }

  const itemFor = (key: string) => {
    if (!settings) return undefined;
    const map: Record<string, { set: boolean; masked: string }> = {
      ANTHROPIC_API_KEY: settings.anthropic_api_key,
      GEMINI_API_KEY: settings.gemini_api_key,
      ELEVENLABS_API_KEY: settings.elevenlabs_api_key,
      ELEVENLABS_VOICE_ID: settings.elevenlabs_voice_id,
      FCM_SERVICE_ACCOUNT_JSON: settings.fcm_service_account_json,
    };
    return map[key];
  };

  async function submitChangePassword() {
    if (newPass.length < 8) {
      notify("رمز عبور باید حداقل ۸ کاراکتر باشد", "err");
      return;
    }
    if (newPass !== confirmPass) {
      notify("رمز عبور و تکرار آن مطابقت ندارند", "err");
      return;
    }
    setChangingPass(true);
    try {
      await changePassword(newPass, confirmPass);
      notify("رمز عبور با موفقیت تغییر کرد ✅", "ok");
      setNewPass("");
      setConfirmPass("");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setChangingPass(false);
    }
  }

  if (loading) return <p className="hint">در حال بارگذاری تنظیمات...</p>;

  return (
    <div>
      <div className="card" style={{ borderColor: "var(--primary)" }}>
        <h2 style={{ marginTop: 0 }}>🔒 تغییر رمز عبور ادمین</h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
          رمز عبور جدید حساب فعلی ({getName() || "..."}) را اینجا تنظیم کن.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
          <input
            type="password"
            dir="ltr"
            placeholder="رمز عبور جدید"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
          <input
            type="password"
            dir="ltr"
            placeholder="تکرار رمز عبور جدید"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitChangePassword();
            }}
          />
          <button
            className="btn btn-sm"
            onClick={submitChangePassword}
            disabled={changingPass}
            style={{ alignSelf: "flex-start" }}
          >
            {changingPass ? "..." : "تغییر رمز عبور"}
          </button>
        </div>
      </div>

      <div className="card" style={{ borderColor: "var(--primary)" }}>
        <h2 style={{ marginTop: 0 }}>🔀 ارائه‌دهنده‌ی فعال هوش مصنوعی (تولید صحنه)</h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
          تغییر این گزینه بدون ری‌استارت سرور، همان لحظه اعمال می‌شود.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn ${provider === "anthropic" ? "" : "btn-ghost"}`}
            onClick={() => saveProvider("anthropic")}
            disabled={saving === "AI_PROVIDER"}
          >
            Claude (Anthropic)
          </button>
          <button
            className={`btn ${provider === "gemini" ? "" : "btn-ghost"}`}
            onClick={() => saveProvider("gemini")}
            disabled={saving === "AI_PROVIDER"}
          >
            Gemini
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>🔑 کلیدهای API</h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
          هر وقت اعتبار یکی از کلیدها تمام شد، کلید جدید را همین‌جا جایگزین کن —
          نیازی به هماهنگی با دیگری یا ری‌استارت سرور نیست.
        </p>

        {FIELDS.map((f) => {
          const item = itemFor(f.key);
          return (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label>
                {f.label}{" "}
                {item &&
                  (item.set ? (
                    <span style={{ color: "var(--success)", fontSize: 12 }}>
                      ✓ ست‌شده ({item.masked})
                    </span>
                  ) : (
                    <span style={{ color: "var(--danger, #ef4444)", fontSize: 12 }}>
                      ست نشده
                    </span>
                  ))}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {f.key === "FCM_SERVICE_ACCOUNT_JSON" ? (
                  <textarea
                    dir="ltr"
                    rows={4}
                    placeholder={f.hint || "مقدار جدید را وارد کن"}
                    value={inputs[f.key] ?? ""}
                    onChange={(e) =>
                      setInputs((s) => ({ ...s, [f.key]: e.target.value }))
                    }
                    style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}
                  />
                ) : (
                  <input
                    dir="ltr"
                    placeholder={f.hint || "مقدار جدید را وارد کن"}
                    value={inputs[f.key] ?? ""}
                    onChange={(e) =>
                      setInputs((s) => ({ ...s, [f.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveField(f.key);
                    }}
                    style={{ flex: 1 }}
                  />
                )}
                <button
                  className="btn btn-sm"
                  onClick={() => saveField(f.key)}
                  disabled={saving === f.key}
                >
                  {saving === f.key ? "..." : "ذخیره"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
