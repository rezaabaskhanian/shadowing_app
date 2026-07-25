"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, saveSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(phone.trim(), password);
      if (res.user.role !== "admin") {
        setError("این حساب دسترسی ادمین ندارد.");
        setLoading(false);
        return;
      }
      saveSession(res);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "خطا در ورود");
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1>🎬 پنل ادمین</h1>
        <p>برای مدیریت صحنه‌ها وارد شوید</p>

        <label>شماره تلفن</label>
        <input
          type="tel"
          placeholder="09000000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          dir="ltr"
        />

        <label>رمز عبور</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          dir="ltr"
        />

        <button
          className="btn"
          style={{ width: "100%", marginTop: 18 }}
          disabled={loading}
        >
          {loading ? "در حال ورود..." : "ورود"}
        </button>

        {error && <div className="error-msg">{error}</div>}

        <div className="hint-box">
          کاربر ادمین پیش‌فرض (از seed دیتابیس):
          <br />
          شماره: <b dir="ltr">09000000000</b> — رمز: <b dir="ltr">admin123</b>
        </div>
      </form>
    </div>
  );
}
