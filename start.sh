#!/bin/bash
# 一键启动：生成微信可打开的学信档案链接
# 无需注册、无需 GitHub、无需安装任何东西

cd "$(dirname "$0")"

# 使用本地 cloudflared 或自动下载
CF="./cloudflared"
if [ ! -f "$CF" ]; then
  echo "📥 首次使用，正在下载隧道工具 (约15MB)..."
  curl -sL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64" -o "$CF"
  chmod +x "$CF"
  echo "✅ 下载完成"
fi

PORT=8082

# 启动 HTTP 服务器
python3 -m http.server $PORT > /dev/null 2>&1 &
SERVER_PID=$!

# 启动隧道
echo "⏳ 正在创建公网隧道..."
"$CF" tunnel --url http://localhost:$PORT > /tmp/cf_tunnel.log 2>&1 &
TUNNEL_PID=$!

# 等待并提取 URL
for i in {1..15}; do
  URL=$(grep -oP 'https://[a-z0-9\-]+\.trycloudflare\.com' /tmp/cf_tunnel.log | head -1)
  [ -n "$URL" ] && break
  sleep 1
done

if [ -n "$URL" ]; then
  echo ""
  echo "============================================"
  echo "  ✅ 公网链接已生成！"
  echo ""
  echo "  🔗 $URL"
  echo ""
  echo "  复制此链接到微信聊天框发送，"
  echo "  对方直接点击即可在微信内打开！"
  echo "============================================"
  echo ""
  echo "  💡 按 Ctrl+C 停止服务"
  wait $TUNNEL_PID
else
  echo "❌ 隧道创建失败，请检查网络"
  cat /tmp/cf_tunnel.log
  kill $SERVER_PID $TUNNEL_PID 2>/dev/null
fi
