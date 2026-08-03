// Cloudflare Worker 脚本 — 数据存取 + 自动推送独立页面到 GitHub
// KV 命名空间绑定名: EDU_KV
// Secret: GITHUB_TOKEN (Personal Access Token, 需 repo 权限)

// ========== 页面模板 (CSS + 结构) ==========
function buildPageHTML(data) {
  const name = esc(data.name);
  const row = (label, val, span) =>
    val ? `<tr><td class="fl">${esc(label)}</td><td class="fv"${span ? ' colspan="' + span + '"' : ''}>${esc(val)}</td></tr>` : '';
  
  const photoHTML = data.image_a
    ? `<div class="photo-wrap"><img src="${esc(data.image_a)}" class="photo-img" alt="录取照片"></div>`
    : '';
  
  const badge = data.academic_qualification || data.xltype || '';
  const statusBadge = data.zhuangtai ? `<span class="tag tag-yellow">${esc(data.zhuangtai)}</span>` : '';

  let rows = '';
  rows += row('姓名', data.name);
  rows += row('性别', data.gender);
  rows += row('民族', data.nation);
  rows += row('身份证号', data.id_number);
  if (data.nian) rows += row('出生日期', data.nian + '-' + (data.yue||'') + '-' + (data.ri||''));
  rows += row('院校', data.school);
  rows += row('专业', data.major);
  rows += row('层次', data.academic_qualification);
  rows += row('学历类别', data.xllb);
  rows += row('学习形式', data.xltype);
  rows += row('学制', data.educational_system);
  rows += row('院系', data.fenyuan);
  rows += row('系(所)', data.xisuo);
  rows += row('班级', data.banji);
  rows += row('学号', data.xuehao);
  rows += row('入学日期', data.ru_nian ? (data.ru_nian + '-' + (data.ru_yue||'') + '-' + (data.ru_ri||'')) : '');
  rows += row('预计毕业日期', data.li_nian ? (data.li_nian + '-' + (data.li_yue||'') + '-' + (data.li_ri||'')) : '');
  rows += row('学籍状态', data.zhuangtai);

  // 研究生信息
  let gradRows = '';
  if (data.has_grad) {
    gradRows += row('研究生层次', data.grad_level);
    gradRows += row('研究生院校', data.grad_school);
    gradRows += row('研究生专业', data.grad_major);
    gradRows += row('学位类型', data.grad_degree_type);
    gradRows += row('研究生学制', data.grad_educational_system);
    gradRows += row('入学方式', data.grad_enroll_type);
    gradRows += row('培养模式', data.grad_train_mode);
    gradRows += row('研究方向', data.grad_research);
    gradRows += row('导师', data.grad_supervisor);
    gradRows += row('研究生院系', data.grad_fenyuan);
    gradRows += row('研究生学号', data.grad_xuehao);
    gradRows += row('研究生状态', data.grad_zhuangtai);
    gradRows += row('研究生入学', data.grad_ru_nian ? (data.grad_ru_nian + '-' + (data.grad_ru_yue||'') + '-' + (data.grad_ru_ri||'')) : '');
    gradRows += row('研究生毕业', data.grad_li_nian ? (data.grad_li_nian + '-' + (data.grad_li_yue||'') + '-' + (data.grad_li_ri||'')) : '');
    if (data.grad_image_a) {
      gradRows += `<tr><td class="fl">研究生照片</td><td class="fv"><img src="${esc(data.grad_image_a)}" class="photo-img-small"></td></tr>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover,shrink-to-fit=no">
<meta name="format-detection" content="telephone=no,email=no,address=no">
<meta name="x5-orientation" content="portrait">
<meta name="x5-fullscreen" content="true">
<meta name="x5-page-mode" content="app">
<meta property="og:title" content="${esc(name)} · 学信档案">
<meta property="og:description" content="${esc(data.school||'')} ${esc(data.major||'')} ${esc(badge)}">
<title>${esc(name)} · 学信档案</title>
<style>${CSS}</style>
</head>
<body>
<div class="pf">
  <div class="ph"><div class="ph-t">学信档案</div><div class="ph-st">CHSI Archive</div></div>
  
  <div class="card-top">
    <div class="rec-title"><span>${esc(name)}</span> · 学信档案</div>
    <div class="rec-badges">
      <span>${esc(data.school)}</span>${badge ? '<span>'+esc(badge)+'</span>' : ''}${statusBadge}
    </div>
    ${photoHTML}
  </div>
  
  <div class="card">
    <div class="card-tt"><span class="card-tt-icon">🎓</span> 学籍信息</div>
    <table>${rows}</table>
  </div>
  
  ${data.has_grad ? `<div class="card"><div class="card-tt"><span class="card-tt-icon">📚</span> 研究生信息</div><table>${gradRows}</table></div>` : ''}
  
  <div class="ft">© 学信档案 · CHSI Archive</div>
</div>
</body>
</html>`;
}

const CSS = `
:root{--primary:#09b37d;--primary-bg:#e8f5e9;--bg:#f5f5f5;--white:#fff;--text:#333;--text-gray:#999;--text-light:#bbb;--red:#f44336;--orange:#f7c044;--blue:#5985ff;--gray:#aaa;--shadow:0 2px 10px rgba(0,0,0,0.08)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:var(--bg);-webkit-user-select:none;user-select:none;display:flex;justify-content:center;padding:10px 0 30px}
.pf{width:100%;max-width:420px}
.ph{background:linear-gradient(135deg,#09b37d,#3fc991);color:#fff;text-align:center;padding:16px 0 12px;border-radius:0 0 20px 20px;margin-bottom:10px}
.ph-t{font-size:18px;font-weight:700;letter-spacing:2px}
.ph-st{font-size:10px;opacity:0.8;margin-top:2px}
.card-top{background:var(--white);border-radius:16px;padding:20px 16px 16px;margin:0 12px 10px;box-shadow:var(--shadow);text-align:center;position:relative;border-top:4px solid var(--primary)}
.rec-title{font-size:17px;font-weight:700;color:var(--text);margin-bottom:8px}
.rec-title span{color:var(--primary)}
.rec-badges{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.rec-badges span{background:var(--primary-bg);color:var(--primary);padding:3px 10px;border-radius:12px;font-size:11px}
.tag-yellow{background:#fff3e0!important;color:#e65100!important}
.photo-wrap{margin:8px auto 0;width:100px;height:130px;border-radius:6px;overflow:hidden;border:1px solid #ddd}
.photo-img{width:100%;height:100%;object-fit:cover}
.photo-img-small{max-width:80px;border-radius:4px}
.card{background:var(--white);border-radius:16px;padding:16px;margin:0 12px 10px;box-shadow:var(--shadow)}
.card-tt{font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0}
.card-tt-icon{font-size:16px;margin-right:4px}
table{width:100%;border-collapse:collapse}
td{padding:8px 4px;font-size:13px;border-bottom:1px solid #f5f5f5;vertical-align:middle}
td:last-child{border-bottom:none}
.fl{color:var(--text-gray);width:80px;white-space:nowrap;font-size:11px}
.fv{color:var(--text);word-break:break-all}
.ft{text-align:center;font-size:10px;color:var(--text-light);padding:16px 0}
`;

// ========== 辅助函数 ==========
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function genId(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// UTF-8 safe base64 (for GitHub API)
function toBase64(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ========== 主入口 ==========
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ========== POST /api/save ==========
      if (request.method === 'POST' && url.pathname === '/api/save') {
        const body = await request.json();
        let valueToStore;
        if (body.compressed && typeof body.compressed === 'string') {
          valueToStore = body.compressed;
        } else if (body.data) {
          valueToStore = JSON.stringify(body.data);
        } else {
          return json({ error: '数据不完整' }, 400, corsHeaders);
        }
        try {
          const parsed = JSON.parse(valueToStore);
          if (!parsed.name || !parsed.school) {
            return json({ error: '数据不完整,缺少姓名或院校' }, 400, corsHeaders);
          }
        } catch(e) {}
        const id = genId(8);
        await env.EDU_KV.put(id, valueToStore);
        return json({ id: id }, 200, corsHeaders);
      }

      // ========== GET /api/get/:id ==========
      if (request.method === 'GET' && url.pathname.startsWith('/api/get/')) {
        const id = url.pathname.replace('/api/get/', '');
        if (!id) return json({ error: '缺少 id' }, 400, corsHeaders);
        const raw = await env.EDU_KV.get(id);
        if (!raw) return json({ error: '链接已失效或不存在' }, 404, corsHeaders);
        return new Response(raw, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ========== GET /s/:id ==========
      if (request.method === 'GET' && url.pathname.startsWith('/s/')) {
        const id = url.pathname.replace('/s/', '');
        return Response.redirect(
          'https://wang-tong.github.io/edu-profile/?q=' + encodeURIComponent(id),
          302
        );
      }

      // ========== POST /api/push — 生成 HTML 并推送到 GitHub ==========
      if (request.method === 'POST' && url.pathname === '/api/push') {
        const body = await request.json();
        const data = body.data;
        if (!data || !data.name || !data.school) {
          return json({ error: '数据不完整,缺少姓名或院校' }, 400, corsHeaders);
        }

        if (!env.GITHUB_TOKEN) {
          return json({ error: 'Worker 未配置 GITHUB_TOKEN Secret' }, 500, corsHeaders);
        }

        const html = buildPageHTML(data);
        const id = genId(6);
        const filePath = id + '.html';
        const content = toBase64(html);

        const ghRes = await fetch(
          'https://api.github.com/repos/wang-tong/edu-profile/contents/' + filePath,
          {
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
              'Content-Type': 'application/json',
              'User-Agent': 'edu-profile-worker',
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
              message: '添加 ' + data.name + ' 展示页',
              content: content,
              branch: 'main'
            })
          }
        );

        if (!ghRes.ok) {
          const errText = await ghRes.text();
          return json({ error: 'GitHub API 失败: ' + errText }, 500, corsHeaders);
        }

        const pageUrl = 'https://wang-tong.github.io/edu-profile/' + id;
        return json({ url: pageUrl, id: id }, 200, corsHeaders);
      }

      return new Response('Not Found', { status: 404 });
    } catch (e) {
      return json({ error: '服务器错误: ' + e.message }, 500, corsHeaders);
    }
  }
};
