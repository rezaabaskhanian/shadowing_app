# REGISTRY اجازه می‌دهد ایمیج‌های پایه روی سرور aramina از آینه‌ی Docker Hub
# آروان (DOCKER_REGISTRY=docker.arvancloud.ir در .env) کشیده شوند — دانلود
# مستقیم از Docker Hub از سرور ایران خیلی کند است (مثل MathMotion).
ARG REGISTRY=docker.io
FROM ${REGISTRY}/teddysun/xray:latest

COPY watch.sh /usr/local/bin/watch.sh
RUN chmod +x /usr/local/bin/watch.sh

ENTRYPOINT ["/usr/local/bin/watch.sh"]
