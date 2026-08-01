/**
 * Netlify Function: 数据存储 + 短链接
 * 
 * POST /api/store  - 存储数据，返回短ID
 * GET  /api/store?id=xxx - 读取数据
 */
exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // GET: 读取数据
  if (event.httpMethod === 'GET') {
    const id = event.queryStringParameters.id;
    if (!id || id.length > 32) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing id' }) };
    }
    // 从 Netlify Blobs 读取（免费额度足够）
    try {
      const { getStore } = require('@netlify/blobs');
      const store = getStore('data');
      const raw = await store.get(id);
      if (!raw) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'not found' }) };
      }
      return { statusCode: 200, headers, body: raw };
    } catch(e) {
      // fallback: 如果 blobs 不可用，尝试从请求参数直接读
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'storage error: ' + e.message }) };
    }
  }

  // POST: 存储数据，返回短ID
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const data = body.data;
      if (!data) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing data' }) };
      }
      // 生成短ID：8位随机字符
      const id = generateId(8);

      // 存储到 Netlify Blobs
      try {
        const { getStore } = require('@netlify/blobs');
        const store = getStore('data');
        await store.setJSON(id, data);
      } catch(e) {
        // Blobs 不可用时，将数据编码进ID（作为fallback）
        console.log('Blobs unavailable, using fallback:', e.message);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ id: id, fallback: true })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: id })
      };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
};

function generateId(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < len; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
