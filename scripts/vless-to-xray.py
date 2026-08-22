#!/usr/bin/env python3
"""
یک لینک vless:// (مثل چیزی که از github.com/barry-far/V2ray-Config می‌گیری) را
به کانفیگ Xray-core تبدیل می‌کند و یک اینباند SOCKS5 لوکال برای استفاده‌ی بک‌اند
شادوئینگ (AI_OUTBOUND_PROXY) اضافه می‌کند.

استفاده:
    python3 vless-to-xray.py 'vless://uuid@host:port?...#name' > /usr/local/etc/xray/config.json
    systemctl restart xray

فقط vless (با یا بدون security=reality) پشتیبانی می‌شود، چون اکثر لینک‌های
آن ریپو از همین نوعند.
"""
import json
import sys
from urllib.parse import urlparse, parse_qs, unquote


def build_config(link: str, socks_port: int) -> dict:
    if not link.startswith("vless://"):
        raise ValueError("فقط لینک‌های vless:// پشتیبانی می‌شوند")

    parsed = urlparse(link)
    uuid = parsed.username
    host = parsed.hostname
    port = parsed.port
    q = {k: v[0] for k, v in parse_qs(parsed.query).items()}

    if not uuid or not host or not port:
        raise ValueError("لینک ناقص است (uuid/host/port پیدا نشد)")

    user = {"id": uuid, "encryption": q.get("encryption", "none")}
    if q.get("flow"):
        user["flow"] = q["flow"]

    stream_settings = {
        "network": q.get("type", "tcp"),
        "security": q.get("security", "none"),
    }

    if stream_settings["security"] == "reality":
        stream_settings["realitySettings"] = {
            "serverName": q.get("sni", host),
            "fingerprint": q.get("fp", "chrome"),
            "publicKey": q.get("pbk", ""),
            "shortId": q.get("sid", ""),
        }
    elif stream_settings["security"] == "tls":
        stream_settings["tlsSettings"] = {
            "serverName": q.get("sni", host),
            "allowInsecure": q.get("allowInsecure", "0") == "1" or q.get("insecure", "0") == "1",
        }

    if stream_settings["network"] == "ws":
        stream_settings["wsSettings"] = {
            "path": unquote(q.get("path", "/")),
            "headers": {"Host": q.get("host", host)},
        }

    config = {
        "log": {"loglevel": "warning"},
        "inbounds": [
            {
                "listen": "0.0.0.0",
                "port": socks_port,
                "protocol": "socks",
                "settings": {"auth": "noauth", "udp": True},
            }
        ],
        "outbounds": [
            {
                "tag": "proxy",
                "protocol": "vless",
                "settings": {
                    "vnext": [
                        {
                            "address": host,
                            "port": port,
                            "users": [user],
                        }
                    ]
                },
                "streamSettings": stream_settings,
            },
            {"tag": "direct", "protocol": "freedom", "settings": {}},
            {"tag": "block", "protocol": "blackhole", "settings": {}},
        ],
    }
    return config


def main():
    if len(sys.argv) < 2:
        print("استفاده: vless-to-xray.py '<vless://...>' [socks_port=1080]", file=sys.stderr)
        sys.exit(1)

    link = sys.argv[1].strip()
    socks_port = int(sys.argv[2]) if len(sys.argv) > 2 else 1080

    try:
        config = build_config(link, socks_port)
    except ValueError as e:
        print(f"خطا: {e}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(config, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
