#!/bin/bash
URL=$(cat /home/wangt/wt/myselef/current_url.txt 2>/dev/null)
if [ -n "$URL" ]; then
    echo ""
    echo "  🔗 你的永久学信档案链接:"
    echo "  $URL"
    echo ""
    echo "  复制此链接到微信发送,对方直接点击即可打开!"
    echo ""
else
    echo "⚠️  服务未运行,请执行: bash /home/wangt/wt/myselef/serve.sh"
fi
