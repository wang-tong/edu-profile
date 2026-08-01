#!/bin/bash
# 学信档案 - 自动启动服务
# 开机自动运行，提供永久公网链接

DIR="/home/wangt/wt/myselef"
LOG="$DIR/tunnel.log"
URL_FILE="$DIR/current_url.txt"

# 杀掉旧进程
pkill -f "python3.*http.server.*8082" 2>/dev/null
pkill -f "cloudflared.*tunnel" 2>/dev/null
sleep 2

# 启动 HTTP 服务
cd "$DIR"
nohup python3 -m http.server 8082 > /dev/null 2>&1 &
sleep 1

# 启动 Cloudflare 隧道
echo "🚀 启动隧道..." > "$LOG"
nohup "$DIR/cloudflared" tunnel --url http://localhost:8082 >> "$LOG" 2>&1 &
sleep 8

# 提取公网 URL
URL=$(grep -o 'https://[^ ]*trycloudflare\.com' "$LOG" | tail -1)
if [ -n "$URL" ]; then
    echo "$URL" > "$URL_FILE"
    echo "✅ 服务已启动" >> "$LOG"
    echo "🔗 $URL" >> "$LOG"
else
    echo "⚠️ URL 未获取到，等待重试..." >> "$LOG"
fi
