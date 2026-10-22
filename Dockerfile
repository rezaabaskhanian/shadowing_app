# REGISTRY اجازه می‌دهد ایمیج‌های پایه روی سرور aramina از آینه‌ی Docker Hub
# آروان (DOCKER_REGISTRY=docker.arvancloud.ir در .env) کشیده شوند — دانلود
# مستقیم از Docker Hub از سرور ایران خیلی کند است (مثل MathMotion).
ARG REGISTRY=docker.io

# -----------------------------
# مرحله اول: Build کردن برنامه
# -----------------------------
    FROM ${REGISTRY}/library/golang:1.25-alpine AS builder

    ENV GO111MODULE=on

    # proxy.golang.org/sum.golang.org برای IP سرور (ایران) اغلب 403 می‌دهند —
    # همان بلاکِ جغرافیایی که Gemini/Anthropic/ElevenLabs هم دارند، ولی چون
    # این مرحله‌ی build داخلِ Docker است، از xray (که فقط runtime بک‌اند را
    # پوشش می‌دهد) رد نمی‌شود؛ به‌جایش از آینه‌ی goproxy.cn که از ایران در
    # دسترس است استفاده می‌کنیم.
    ENV GOPROXY=https://goproxy.cn,direct
    ENV GOSUMDB=sum.golang.google.cn

    WORKDIR /app

    # پکیج‌ها داخلِ خودِ لایه دانلود می‌شوند (نه در cache mount): تا وقتی go.mod و
    # go.sum عوض نشده‌اند این لایه «CACHED» است و هیچ پکیجی دوباره دانلود نمی‌شود.
    # قبلاً /go/pkg/mod یک cache mount بود؛ آن mount روی مسیر لایه سوار می‌شد و
    # پکیج‌های لایه را می‌پوشاند، برای همین مرحله‌ی build هر بار دوباره دانلود می‌کرد.
    COPY go.mod go.sum ./
    RUN go mod download
    
    COPY . .
    
    # کشِ build خودِ Go (پکیج‌های کامپایل‌شده) بینِ buildها نگه داشته می‌شود؛
    # با تغییرِ چند فایل، فقط همان‌ها دوباره کامپایل می‌شوند نه کلِ پروژه و
    # وابستگی‌هایش. نیاز به BuildKit دارد (پیش‌فرضِ Docker 23 به بعد).
    RUN --mount=type=cache,target=/root/.cache/go-build \
        CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o main ./cmd/main.go
    
    # -----------------------------
    # مرحله دوم: ساخت ایمیج سبک نهایی
    # -----------------------------
    # نسخه‌ی ثابت (نه latest): با latest هر بار که ایمیج پایه به‌روز می‌شد،
    # کشِ نصبِ ffmpeg هم از دست می‌رفت. برای به‌روزرسانی، فقط همین عدد را عوض کن.
    FROM ${REGISTRY}/library/alpine:3.22

    # ffmpeg برای تبدیل ضبط کاربر (webm/opus) به WAV 16k mono، پیش‌نیاز
    # نمره‌دهی تلفظ. بدون آن نمره‌ها به حالت تخمینی برمی‌گردند.
    RUN apk add --no-cache ffmpeg

    WORKDIR /root/

    COPY --from=builder /app/main .
    
    # کپی migrations (با مسیر کامل - کد migrator.go این مسیر نسبی رو هاردکد داره)
    COPY --from=builder /app/internal/repository/postgres/migrations ./internal/repository/postgres/migrations

    EXPOSE 8086
    
    CMD ["./main"]