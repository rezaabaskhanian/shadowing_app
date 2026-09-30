# REGISTRY اجازه می‌دهد ایمیج‌های پایه روی سرور aramina از آینه‌ی Docker Hub
# آروان (DOCKER_REGISTRY=docker.arvancloud.ir در .env) کشیده شوند — دانلود
# مستقیم از Docker Hub از سرور ایران خیلی کند است (مثل MathMotion).
ARG REGISTRY=docker.io
FROM ${REGISTRY}/library/python:3.11-slim

# ffmpeg برای خواندن فرمت‌هایی مثل webm/opus لازم است؛ faster-whisper خودش از
# طریق av/ffmpeg فایل را دیکد می‌کند.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# ایندکس پیش‌فرض PyPI از سرورهای ایران قابل‌دسترس نیست (شبیه مشکل دانلود مدل
# از HuggingFace در download-model.sh)؛ به‌جایش از آینه‌ی ایرانی استفاده
# می‌شود. آینه‌ی رانفلر قبلاً شکست خورده بود؛ پیش‌فرض لیاراست (مثل MathMotion)
# و با PIP_INDEX_URL در .env قابل تغییر است.
ARG PIP_INDEX_URL=https://package-mirror.liara.ir/repository/pypi/simple
RUN pip install --no-cache-dir --index-url ${PIP_INDEX_URL} -r requirements.txt

COPY main.py .

# مدل موقع اولین اجرا از HuggingFace دانلود و در این مسیر کش می‌شود؛ در
# docker-compose روی یک volume نگه داشته می‌شود تا هر بار دوباره دانلود نشود.
ENV HF_HOME=/models
ENV WHISPER_MODEL=base.en
ENV WHISPER_DEVICE=cpu
ENV WHISPER_COMPUTE_TYPE=int8

EXPOSE 9000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
