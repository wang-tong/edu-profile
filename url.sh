#!/bin/bash
URL=$(cat /home/wangt/wt/myselef/current_url.txt 2>/dev/null)
if [ -n "$URL" ]; then
    # Auto-update index.html WX_DOMAIN with current tunnel URL
    BASE="${URL%/}"
    sed -i "s|var WX_DOMAIN = '[^']*'|var WX_DOMAIN = '$BASE'|g" /home/wangt/wt/myselef/index.html
    sed -i "s|var WX_DOMAIN = '[^']*'|var WX_DOMAIN = '$BASE'|g" /home/wangt/wt/myselef/app.html
    echo ""
    echo "  🔗 你的学信档案链接(微信可直接打开)："
    echo "  $URL"
    echo ""
    echo "  复制此链接到微信发送，对方直接点击即可打开！"
    echo ""
else
    echo "⚠️  服务未运行，请执行: bash /home/wangt/wt/myselef/serve.sh"
fi
