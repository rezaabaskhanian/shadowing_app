"""
سرویس تشخیص گفتار (STT) برای نمره‌دهی تلفظ.

این سرویس یک سایدکار کوچک کنار بک‌اند Go است: فایل صوتی می‌گیرد و متن
تشخیص‌داده‌شده را به همراه زمان‌بندی و «احتمال» هر کلمه برمی‌گرداند.

چرا faster-whisper؟ چون علاوه بر متن، برای هر کلمه یک `probability` می‌دهد که
معیار خوبی برای «چقدر واضح ادا شده» است — همان چیزی که برای قرمز کردن
کلمه‌های ضعیف در مرحله‌ی Compare لازم داریم، بدون نیاز به سرویس ابری.
"""

import os
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from faster_whisper import WhisperModel

MODEL_SIZE = os.getenv("WHISPER_MODEL", "base.en")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

app = FastAPI(title="Shadowing STT")

# مدل یک بار موقع بالا آمدن لود می‌شود؛ لود کردن به‌ازای هر درخواست چند ثانیه
# طول می‌کشد و کل مزیت سرعت را از بین می‌برد.
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_SIZE}


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    # متن مرجع پذیرفته می‌شود ولی عمداً به مدل داده نمی‌شود.
    #
    # امتحانش کردیم: دادن متن هدف به‌عنوان initial_prompt باعث می‌شود مدل
    # کلمه‌هایی را که کاربر اصلاً نگفته «بازسازی» کند. روی نمونه‌ای که کلمه‌ی
    # cup در آن حذف شده بود، با prompt خروجی «...a cup of coffee...» می‌شد و
    # با prompt خالی «...a coffee...» — یعنی prompt دقیقاً همان خطایی را
    # پنهان می‌کرد که قرار بود پیدایش کنیم.
    #
    # فیلد نگه داشته شده تا کلاینت Go تغییر نکند و اگر روزی برای واژگان خاص
    # (اسم مکان/برند) لازم شد، جای امنی برای اضافه کردنش باشد.
    target_text: str = Form(""),
    language: str = Form("en"),
):
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty audio")

    suffix = os.path.splitext(audio.filename or "")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            language=language or None,
            word_timestamps=True,
            vad_filter=True,
            beam_size=5,
        )

        words = []
        text_parts = []
        for segment in segments:
            text_parts.append(segment.text)
            for word in segment.words or []:
                words.append(
                    {
                        "word": word.word.strip(),
                        "start": round(word.start, 3),
                        "end": round(word.end, 3),
                        "probability": round(word.probability, 4),
                    }
                )

        return {
            "text": "".join(text_parts).strip(),
            "words": words,
            "language": info.language,
            "duration": round(info.duration, 3),
        }
    finally:
        os.unlink(tmp_path)
