// 腾讯云 SCF 函数 — 接收数据并推送到 GitHub 创建独立页面
// 环境变量: GITHUB_TOKEN (Personal Access Token, 需 repo 权限)
const https = require('https');

const GITHUB_OWNER = 'wang-tong';
const GITHUB_REPO = 'edu-profile';
const GITHUB_BRANCH = 'main';

// ====== 页面模板 ======
function buildPageHTML(data) {
  const name = esc(data.name);
  const row = (label, val, span) =>
    val ? `<tr><td class="fl">${esc(label)}</td><td class="fv"${span ? ' colspan="' + span + '"' : ''}>${esc(val)}</td></tr>` : '';

  const photoHTML = data.image_a
    ? `<div class="photo-wrap"><img src="${esc(data.image_a)}" class="photo-img" alt="录取照片"></div>` : '';

  const badge = data.academic_qualification || data.xltype || '';
  const statusBadge = data.zhuangtai ? `<span class="tag tag-yellow">${esc(data.zhuangtai)}</span>` : '';

  let rows = '';
  rows += row('姓名', data.name);
  rows += row('性别', data.gender);
  rows += row('民族', data.nation);
  rows += row('身份证号', data.id_number);
  if (data.nian) rows += row('出生日期', data.nian + '-' + (data.yue || '') + '-' + (data.ri || ''));
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
  rows += row('入学日期', data.ru_nian ? (data.ru_nian + '-' + (data.ru_yue || '') + '-' + (data.ru_ri || '')) : '');
  rows += row('预计毕业日期', data.li_nian ? (data.li_nian + '-' + (data.li_yue || '') + '-' + (data.li_ri || '')) : '');
  rows += row('学籍状态', data.zhuangtai);

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
    gradRows += row('研究生入学', data.grad_ru_nian ? (data.grad_ru_nian + '-' + (data.grad_ru_yue || '') + '-' + (data.grad_ru_ri || '')) : '');
    gradRows += row('研究生毕业', data.grad_li_nian ? (data.grad_li_nian + '-' + (data.grad_li_yue || '') + '-' + (data.grad_li_ri || '')) : '');
    if (data.grad_image_a) {
      gradRows += `<tr><td class="fl">研究生照片</td><td class="fv"><img src="${esc(data.grad_image_a)}" class="photo-img-small"></td></tr>`;
    }
  }

  // 博士研究生信息 (与研究生区块同结构, 紫色卡片区域区分)
  let grad2Rows = '';
  if (data.has_grad2) {
    grad2Rows += row('博士层次', data.grad2_level);
    grad2Rows += row('博士院校', data.grad2_school);
    grad2Rows += row('博士专业', data.grad2_major);
    grad2Rows += row('学位类型', data.grad2_degree_type);
    grad2Rows += row('学位证书编号', data.grad2_degree_cert);
    grad2Rows += row('学位授予日期', data.grad2_degree_date);
    grad2Rows += row('博士学制', data.grad2_educational_system);
    grad2Rows += row('入学方式', data.grad2_enroll_type);
    grad2Rows += row('培养模式', data.grad2_train_mode);
    grad2Rows += row('研究方向', data.grad2_research);
    grad2Rows += row('导师', data.grad2_supervisor);
    grad2Rows += row('博士院系', data.grad2_fenyuan);
    grad2Rows += row('博士学号', data.grad2_xuehao);
    grad2Rows += row('博士状态', data.grad2_zhuangtai);
    grad2Rows += row('博士入学', data.grad2_ru_nian ? (data.grad2_ru_nian + '-' + (data.grad2_ru_yue || '') + '-' + (data.grad2_ru_ri || '')) : '');
    grad2Rows += row('博士毕业', data.grad2_li_nian ? (data.grad2_li_nian + '-' + (data.grad2_li_yue || '') + '-' + (data.grad2_li_ri || '')) : '');
    if (data.grad2_image_a) {
      grad2Rows += `<tr><td class="fl">博士照片</td><td class="fv"><img src="${esc(data.grad2_image_a)}" class="photo-img-small"></td></tr>`;
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
<meta property="og:description" content="${esc(data.school || '')} ${esc(data.major || '')} ${esc(badge)}">
<title>${esc(name)} · 学信档案</title>
<style>${CSS}</style>
</head>
<body>
<div class="pf">
  <div class="ph"><div class="ph-t">学信档案</div><div class="ph-st">CHSI Archive</div></div>
  <div class="card-top">
    <div class="rec-title"><span>${esc(name)}</span> · 学信档案</div>
    <div class="rec-badges">
      <span>${esc(data.school)}</span>${badge ? '<span>' + esc(badge) + '</span>' : ''}${statusBadge}
    </div>
    ${photoHTML}
  </div>
  <div class="card">
    <div class="card-tt"><span class="card-tt-icon">🎓</span> 学籍信息</div>
    <table>${rows}</table>
  </div>
  ${data.has_grad ? '<div class="card"><div class="card-tt"><span class="card-tt-icon">📚</span> 研究生信息</div><table>' + gradRows + '</table></div>' : ''}
  ${data.has_grad2 ? '<div class="card card-doctor"><div class="card-tt"><span class="card-tt-icon">🎓</span> 博士研究生信息</div><table>' + grad2Rows + '</table></div>' : ''}
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
.card-doctor{background:linear-gradient(180deg,#f3e5f5 0%,#fff 45%);border-top:4px solid #9c27b0}
.card-doctor .card-tt{color:#7b1fa2}
table{width:100%;border-collapse:collapse}
td{padding:8px 4px;font-size:13px;border-bottom:1px solid #f5f5f5;vertical-align:middle}
td:last-child{border-bottom:none}
.fl{color:var(--text-gray);width:80px;white-space:nowrap;font-size:11px}
.fv{color:var(--text);word-break:break-all}
.ft{text-align:center;font-size:10px;color:var(--text-light);padding:16px 0}`;

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function genId(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function request(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

exports.main_handler = async (event) => {
  let reqBody;
  try {
    reqBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON 解析失败' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: '服务未配置 GITHUB_TOKEN' }) };
  }

  const data = reqBody.data;
  if (!data || !data.name || !data.school) {
    return { statusCode: 400, body: JSON.stringify({ error: '数据不完整,缺少姓名或院校' }) };
  }

  try {
    const html = buildPageHTML(data);
    const fileId = genId(6);
    const filePath = fileId + '.html';

    const encoded = Buffer.from(html, 'utf-8').toString('base64');

    const ghRes = await request(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'User-Agent': 'edu-profile-scf',
          'Accept': 'application/vnd.github.v3+json'
        }
      },
      JSON.stringify({
        message: '添加 ' + data.name + ' 展示页',
        content: encoded,
        branch: GITHUB_BRANCH
      })
    );

    if (ghRes.status === 201 || ghRes.status === 200) {
      const pageUrl = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/${fileId}`;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pageUrl, id: fileId })
      };
    } else {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'GitHub API 失败: ' + ghRes.status + ' ' + ghRes.body.slice(0, 200) })
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '服务器错误: ' + e.message })
    };
  }
};
