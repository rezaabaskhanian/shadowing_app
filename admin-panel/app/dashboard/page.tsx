"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getName, getRole, getToken } from "@/lib/api";
import type { SceneResp } from "@/lib/types";
import SceneCreator from "./SceneCreator";
import SceneList from "./SceneList";

type Tab = "create" | "list";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  // صحنه‌ای که در حال ویرایش است (اگر null باشد، فرم در حالت ساخت جدید است)
  const [editScene, setEditScene] = useState<SceneResp | null>(null);

  // توست ساده
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  function notify(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  // نگهبان احراز هویت
  useEffect(() => {
    const token = getToken();
    const role = getRole();
    if (!token || role !== "admin") {
      router.replace("/login");
      return;
    }
    setName(getName() || "ادمین");
    setReady(true);
  }, [router]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!ready) {
    return <div className="center-screen">در حال بررسی دسترسی...</div>;
  }

  return (
    <>
      <div className="topbar">
        <h1>🎬 پنل ادمین شادوئینگ</h1>
        <div className="tabs">
          <button
            className={`tab-btn ${tab === "create" ? "active" : ""}`}
            onClick={() => setTab("create")}
          >
            {editScene ? "✏️ ویرایش صحنه" : "➕ ساخت صحنه"}
          </button>
          <button
            className={`tab-btn ${tab === "list" ? "active" : ""}`}
            onClick={() => setTab("list")}
          >
            📋 لیست صحنه‌ها
          </button>
        </div>
        <div className="userbox">
          <span>👤 {name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            خروج
          </button>
        </div>
      </div>

      <main className="container">
        {tab === "create" ? (
          <SceneCreator
            notify={notify}
            onSaved={() => setReloadKey((k) => k + 1)}
            editScene={editScene}
            onCancelEdit={() => setEditScene(null)}
          />
        ) : (
          <SceneList
            notify={notify}
            reloadKey={reloadKey}
            onEdit={(scene) => {
              setEditScene(scene);
              setTab("create");
            }}
          />
        )}
      </main>

      {toast && <div className={`toast show ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
