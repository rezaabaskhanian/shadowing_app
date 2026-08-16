#!/usr/bin/env bash
#
# مدل تشخیص گفتار را روی خودِ سیستم دانلود می‌کند تا کانتینر لازم نباشد به
# HuggingFace وصل شود.
#
# چرا؟ چون دانلود از داخل کانتینر روی شبکه‌ی ایران گیر می‌کند (روی ۳ مگابایت
# متوقف می‌شود)، در حالی که همان دانلود از خود سیستم کار می‌کند. مدل فقط یک
# بار لازم است؛ بعد از آن سرویس کاملاً آفلاین کار می‌کند.
#
#   ./whisper-service/download-model.sh            # پیش‌فرض: base.en
#   ./whisper-service/download-model.sh small.en   # دقیق‌تر، کندتر
#   ./whisper-service/download-model.sh tiny.en    # سریع‌تر، کم‌دقت‌تر
#
# بعدش در docker-compose.yaml مقدار WHISPER_MODEL را روی /models/<اسم> بگذار.

set -euo pipefail

MODEL="${1:-base.en}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/models/$MODEL"
BASE="https://huggingface.co/Systran/faster-whisper-$MODEL/resolve/main"

# اگر HuggingFace مستقیم جواب نداد، آینه را امتحان کن:
#   BASE="https://hf-mirror.com/Systran/faster-whisper-$MODEL/resolve/main"

mkdir -p "$DIR"

# vocabulary بسته به مدل ممکن است txt یا json باشد، برای همین هر دو امتحان
# می‌شوند و نبودن یکی‌شان خطا حساب نمی‌شود.
for file in config.json tokenizer.json vocabulary.txt vocabulary.json model.bin; do
    echo "→ $file"
    if ! curl -fsSL --max-time 1800 -o "$DIR/$file" "$BASE/$file"; then
        rm -f "$DIR/$file"
        echo "   (موجود نیست، رد شد)"
    fi
done

if [ ! -s "$DIR/model.bin" ]; then
    echo "خطا: model.bin دانلود نشد." >&2
    exit 1
fi

echo
echo "مدل آماده است: $DIR"
du -sh "$DIR"
