const https = require('https');

/**
 * Netlify Function: 短链接代理
 * 解决浏览器 CORS 限制，服务端调用短链接 API
 * GET /.netlify/functions/shorten?url=长链接
 */
exports.handler = async function(event) {
  const longUrl = event.queryStringParameters.url;
  if (!longUrl) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing url parameter' })
    };
  }

  const encodedUrl = encodeURIComponent(longUrl);

  // 尝试多个短链接服务
  // 方案1: is.gd
  try {
    const result = await httpGet(`https://is.gd/create.php?format=simple&url=${encodedUrl}`);
    if (result && result.length > 0 && result.length < 100 && result.startsWith('http')) {
      return success({ short_url: result, service: 'is.gd' });
    }
  } catch(e) { console.log('is.gd failed:', e.message); }

  // 方案2: v.gd
  try {
    const result = await httpGet(`https://v.gd/create.php?format=simple&url=${encodedUrl}`);
    if (result && result.length > 0 && result.length < 100 && result.startsWith('http')) {
      return success({ short_url: result, service: 'v.gd' });
    }
  } catch(e) { console.log('v.gd failed:', e.message); }

  // 方案3: tinyurl
  try {
    const result = await httpGet(`https://tinyurl.com/api-create.php?url=${encodedUrl}`);
    if (result && result.length > 0 && result.length < 100 && result.startsWith('http')) {
      return success({ short_url: result, service: 'tinyurl' });
    }
  } catch(e) { console.log('tinyurl failed:', e.message); }

  // 全部失败，返回原始URL
  return success({ short_url: longUrl, service: 'none', note: 'all services failed' });
};

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function success(body) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(body)
  };
}
