#!/bin/bash
# جلوی کامیت شدن app/android/gradle.properties را می‌گیرد (تنظیمات محلی اندروید
# است و نباید در git برود). روی هر دستور Bash که Claude اجرا می‌کند صدا زده می‌شود.
FILE="app/android/gradle.properties"
cmd=$(jq -r '.tool_input.command // ""')

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

case "$cmd" in
  *git*) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
modified=$(git status --porcelain -- "$FILE" 2>/dev/null)

# هر تکه‌ی دستور (جداشده با && ; | و خط جدید) جدا بررسی می‌شود و فقط تکه‌هایی
# که خودشان با git add / git commit شروع می‌شوند؛ تا متن پیام کامیت، heredoc
# یا دستورهای دیگرِ همان خط اشتباهی مسدود نشوند. متن داخل کوتیشن هم حذف می‌شود.
segs=$(printf '%s\n' "$cmd" \
  | sed -E "s/\"[^\"]*\"//g; s/'[^']*'//g" \
  | sed -E 's/(&&|\|\||;|\|)/\n/g' \
  | sed -E 's/^[[:space:]]+//' \
  | grep -E '^git[[:space:]]+(add|commit)([[:space:]]|$)')
seg_match() { [ -n "$segs" ] && printf '%s\n' "$segs" | grep -Eq "$1"; }

# git add که مستقیم این فایل را نام ببرد
if seg_match '^git[[:space:]]+add([[:space:]].*)?gradle\.properties'; then
  deny "⛔ $FILE نباید کامیت شود (قانون پروژه). فایل‌ها را جدا و بدون این فایل add کن."
fi

# add یا commit کلی در حالی که این فایل تغییر کرده
if [ -n "$modified" ]; then
  if seg_match '^git[[:space:]]+add([[:space:]].*)?[[:space:]](-A|--all|-u|--update|\.)([[:space:]]|$)' \
    || seg_match '^git[[:space:]]+commit([[:space:]].*)?[[:space:]](-a|--all|-[a-zA-Z]*a[a-zA-Z]*)([[:space:]]|$)'; then
    deny "⛔ $FILE تغییر کرده و add/commit کلی آن را هم شامل می‌شود. فقط فایل‌های مشخص را add کن."
  fi
fi

# commit در حالی که این فایل stage شده
if seg_match '^git[[:space:]]+commit'; then
  if git diff --cached --name-only 2>/dev/null | grep -qx "$FILE"; then
    deny "⛔ $FILE در stage است. اول اجرا کن: git restore --staged $FILE"
  fi
fi
exit 0
