// Cloudflare Worker 脚本
// 部署步骤见 README，KV 命名空间绑定名：EDU_KV

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ==========================================
      // POST /api/save   — 保存数据到 KV，返回短 ID
      // ==========================================
      if (request.method === 'POST' && url.pathname === '/api/save') {
        const body = await request.json();
        const data = body.data;
        if (!data || !data.name || !data.school) {
          return json({ error: '数据不完整，缺少姓名或院校' }, 400, corsHeaders);
        }
        const id = genId(8);
        await env.EDU_KV.put(id, JSON.stringify(data));
        return json({ id: id }, 200, corsHeaders);
      }

      // ==========================================
      // GET /api/get/:id   — 读取数据（前端 Ajax 调用）
      // ==========================================
      if (request.method === 'GET' && url.pathname.startsWith('/api/get/')) {
        const id = url.pathname.replace('/api/get/', '');
        if (!id) return json({ error: '缺少 id' }, 400, corsHeaders);

        const raw = await env.EDU_KV.get(id);
        if (!raw) return json({ error: '链接已失效或不存在' }, 404, corsHeaders);

        return new Response(raw, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ==========================================
      // GET /s/:id   — 短链接，302 跳转到页面
      // ==========================================
      if (request.method === 'GET' && url.pathname.startsWith('/s/')) {
        const id = url.pathname.replace('/s/', '');
        // 跳转到 GitHub Pages 页面并带上 q 参数
        return Response.redirect(
          'https://wang-tong.github.io/edu-profile/?q=' + encodeURIComponent(id),
          302
        );
      }

      return new Response('Not Found', { status: 404 });
    } catch (e) {
      return json({ error: '服务器错误: ' + e.message }, 500, corsHeaders);
    }
  }
};

// ------ 辅助函数 ------

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function genId(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
