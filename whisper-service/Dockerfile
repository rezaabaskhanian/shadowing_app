FROM python:3.11-slim

# ffmpeg برای خواندن فرمت‌هایی مثل webm/opus لازم است؛ faster-whisper خودش از
# طریق av/ffmpeg فایل را دیکد می‌کند.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# مدل موقع اولین اجرا از HuggingFace دانلود و در این مسیر کش می‌شود؛ در
# docker-compose روی یک volume نگه داشته می‌شود تا هر بار دوباره دانلود نشود.
ENV HF_HOME=/models
ENV WHISPER_MODEL=base.en
ENV WHISPER_DEVICE=cpu
ENV WHISPER_COMPUTE_TYPE=int8

EXPOSE 9000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
