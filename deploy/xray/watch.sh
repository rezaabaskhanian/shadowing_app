#!/bin/sh
# هر ۳ ثانیه چک‌سام فایل کانفیگ را بررسی می‌کند؛ اگر عوض شده باشد (یعنی بک‌اند
# لینک vless جدیدی نوشته)، پروسه‌ی xray را ری‌استارت می‌کند تا کانفیگ جدید را
# بارگذاری کند. این جایگزین ساده‌ای است برای inotify که نیاز به پکیج اضافه ندارد.
set -eu

CONFIG="${XRAY_CONFIG_PATH:-/etc/xray/config.json}"
PID=""
LAST_HASH=""

cleanup() {
  [ -n "$PID" ] && kill "$PID" 2>/dev/null || true
  exit 0
}
trap cleanup TERM INT

while true; do
  if [ -f "$CONFIG" ]; then
    HASH="$(md5sum "$CONFIG" | awk '{print $1}')"
    if [ "$HASH" != "$LAST_HASH" ]; then
      if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null || true
        wait "$PID" 2>/dev/null || true
      fi
      echo "config changed, (re)starting xray..."
      xray run -c "$CONFIG" &
      PID=$!
      LAST_HASH="$HASH"
    fi
  fi
  sleep 3
done
