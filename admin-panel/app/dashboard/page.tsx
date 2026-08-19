"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getName, getRole, getToken } from "@/lib/api";
import type { SceneResp } from "@/lib/types";
import SceneCreator from "./SceneCreator";
import SceneList from "./SceneList";
import SettingsPanel from "./SettingsPanel";
import NotificationsPanel from "./NotificationsPanel";
import SceneReviewQueue from "./SceneReviewQueue";
import TopicSuggestionQueue from "./TopicSuggestionQueue";
import SubscriptionPlansPanel from "./SubscriptionPlansPanel";
import UserList from "./UserList";
import LandingSectionsPanel from "./LandingSectionsPanel";
import type { SceneSubmission, TopicSuggestion } from "@/lib/types";

type Tab =
  | "create"
  | "list"
  | "settings"
  | "notifications"
  | "review"
  | "topics"
  | "subscriptions"
  | "users"
  | "landing";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  // صحنه‌ای که در حال ویرایش است (اگر null باشد، فرم در حالت ساخت جدید است)
  const [editScene, setEditScene] = useState<SceneResp | null>(null);
  // پیشنهادی که در حال بررسی است (فرم را از روی آن پر می‌کند)
  const [reviewSubmission, setReviewSubmission] = useState<SceneSubmission | null>(null);
  const [submissionReloadKey, setSubmissionReloadKey] = useState(0);
  // پیشنهاد موضوعی که در حال بررسی است
  const [reviewTopicSuggestion, setReviewTopicSuggestion] = useState<TopicSuggestion | null>(
    null
  );
  const [topicReloadKey, setTopicReloadKey] = useState(0);

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
            {reviewSubmission
              ? "📩 بررسی پیشنهاد"
              : reviewTopicSuggestion
              ? "💡 بررسی موضوع"
              : editScene
              ? "✏️ ویرایش صحنه"
              : "➕ ساخت صحنه"}
          </button>
          <button
            className={`tab-btn ${tab === "list" ? "active" : ""}`}
            onClick={() => setTab("list")}
          >
            📋 لیست صحنه‌ها
          </button>
          <button
            className={`tab-btn ${tab === "settings" ? "active" : ""}`}
            onClick={() => setTab("settings")}
          >
            ⚙️ تنظیمات
          </button>
          <button
            className={`tab-btn ${tab === "notifications" ? "active" : ""}`}
            onClick={() => setTab("notifications")}
          >
            🔔 نوتیفیکیشن‌ها
          </button>
          <button
            className={`tab-btn ${tab === "review" ? "active" : ""}`}
            onClick={() => setTab("review")}
          >
            📩 پیشنهادهای کاربران
          </button>
          <button
            className={`tab-btn ${tab === "topics" ? "active" : ""}`}
            onClick={() => setTab("topics")}
          >
            💡 پیشنهادهای موضوع
          </button>
          <button
            className={`tab-btn ${tab === "subscriptions" ? "active" : ""}`}
            onClick={() => setTab("subscriptions")}
          >
            💳 اشتراک‌ها
          </button>
          <button
            className={`tab-btn ${tab === "users" ? "active" : ""}`}
            onClick={() => setTab("users")}
          >
            👤 کاربران
          </button>
          <button
            className={`tab-btn ${tab === "landing" ? "active" : ""}`}
            onClick={() => setTab("landing")}
          >
            🌐 صفحه معرفی
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
        {tab === "create" && (
          <SceneCreator
            notify={notify}
            onSaved={() => setReloadKey((k) => k + 1)}
            editScene={editScene}
            onCancelEdit={() => setEditScene(null)}
            fromSubmission={reviewSubmission}
            onApproved={() => {
              setReviewSubmission(null);
              setReloadKey((k) => k + 1);
              setSubmissionReloadKey((k) => k + 1);
              setTab("review");
            }}
            onCancelReview={() => setReviewSubmission(null)}
            fromTopicSuggestion={reviewTopicSuggestion}
            onTopicApproved={() => {
              setReviewTopicSuggestion(null);
              setReloadKey((k) => k + 1);
              setTopicReloadKey((k) => k + 1);
              setTab("topics");
            }}
            onCancelTopicReview={() => setReviewTopicSuggestion(null)}
          />
        )}
        {tab === "list" && (
          <SceneList
            notify={notify}
            reloadKey={reloadKey}
            onEdit={(scene) => {
              setEditScene(scene);
              setTab("create");
            }}
          />
        )}
        {tab === "settings" && <SettingsPanel notify={notify} />}
        {tab === "notifications" && <NotificationsPanel notify={notify} />}
        {tab === "review" && (
          <SceneReviewQueue
            notify={notify}
            reloadKey={submissionReloadKey}
            onReview={(submission) => {
              setReviewSubmission(submission);
              setEditScene(null);
              setTab("create");
            }}
          />
        )}
        {tab === "topics" && (
          <TopicSuggestionQueue
            notify={notify}
            reloadKey={topicReloadKey}
            onReview={(suggestion) => {
              setReviewTopicSuggestion(suggestion);
              setReviewSubmission(null);
              setEditScene(null);
              setTab("create");
            }}
          />
        )}
        {tab === "subscriptions" && <SubscriptionPlansPanel notify={notify} />}
        {tab === "users" && <UserList notify={notify} />}
        {tab === "landing" && <LandingSectionsPanel notify={notify} />}
      </main>

      {toast && <div className={`toast show ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
