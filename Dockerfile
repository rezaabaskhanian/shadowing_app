# -----------------------------
# مرحله اول: Build کردن برنامه
# -----------------------------
    FROM golang:1.25-alpine AS builder

    ENV GO111MODULE=on
    
    WORKDIR /app
    
    COPY go.mod go.sum ./
    RUN go mod download
    
    COPY . .
    
    RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o main ./cmd/main.go
    
    # -----------------------------
    # مرحله دوم: ساخت ایمیج سبک نهایی
    # -----------------------------
    FROM alpine:latest

    # ffmpeg برای تبدیل ضبط کاربر (webm/opus) به WAV 16k mono، پیش‌نیاز
    # نمره‌دهی تلفظ. بدون آن نمره‌ها به حالت تخمینی برمی‌گردند.
    RUN apk add --no-cache ffmpeg

    WORKDIR /root/

    COPY --from=builder /app/main .
    
    # کپی migrations (با مسیر کامل - کد migrator.go این مسیر نسبی رو هاردکد داره)
    COPY --from=builder /app/internal/repository/postgres/migrations ./internal/repository/postgres/migrations

    EXPOSE 8086
    
    CMD ["./main"]