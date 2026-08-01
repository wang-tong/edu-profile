const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  try {
    const store = getStore("edu-data");

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const payload = body.data;
      if (!payload || !payload.name || !payload.school) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "数据不完整，缺少姓名或院校" }),
        };
      }

      const id = genId(8);
      await store.set(id, JSON.stringify(payload));
      // 有效期90天
      await store.set(id + "_ts", String(Date.now()));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id }),
      };
    }

    if (event.httpMethod === "GET") {
      const id = event.queryStringParameters?.id;
      if (!id || id.length < 4) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "缺少id参数" }),
        };
      }

      const raw = await store.get(id);
      if (!raw) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "链接已失效或不存在" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: raw,
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "方法不允许" }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "服务器错误: " + e.message }),
    };
  }
};

function genId(len) {
  const s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < len; i++) id += s[Math.floor(Math.random() * s.length)];
  return id;
}
