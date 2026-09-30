# REGISTRY اجازه می‌دهد ایمیج‌های پایه روی سرور aramina از آینه‌ی Docker Hub
# آروان (DOCKER_REGISTRY=docker.arvancloud.ir در .env) کشیده شوند — دانلود
# مستقیم از Docker Hub از سرور ایران خیلی کند است (مثل MathMotion).
ARG REGISTRY=docker.io
FROM ${REGISTRY}/library/node:20-alpine AS builder

WORKDIR /app

# NPM_REGISTRY: registry.npmjs.org از ایران خیلی کند است (npm ci ادمین تا
# ~۳۲ دقیقه طول کشیده)؛ روی سرور از آینه‌ی npm لیارا استفاده می‌شود.
ARG NPM_REGISTRY=https://registry.npmjs.org/
RUN npm config set registry ${NPM_REGISTRY}

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM ${REGISTRY}/library/node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
