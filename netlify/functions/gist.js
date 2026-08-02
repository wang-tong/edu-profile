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

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "服务器未配置 GITHUB_TOKEN" }),
    };
  }

  try {
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const payload = body.data;
      if (!payload || !payload.name || !payload.school) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "数据不完整,缺少姓名或院校" }),
        };
      }

      const res = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          public: true,
          description: "学信档案分享数据",
          files: {
            "data.json": {
              content: JSON.stringify(payload),
            },
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: "GitHub API 错误: " + errText }),
        };
      }

      const gist = await res.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: gist.id }),
      };
    }

    if (event.httpMethod === "GET") {
      const id = event.queryStringParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "缺少 id 参数" }),
        };
      }

      const res = await fetch(`https://api.github.com/gists/${id}`, {
        headers: { "Accept": "application/vnd.github.v3+json" },
      });

      if (!res.ok) {
        return {
          statusCode: res.status === 404 ? 404 : 502,
          headers,
          body: JSON.stringify({ error: "Gist 不存在或无法访问" }),
        };
      }

      const gist = await res.json();
      const content = gist.files?.["data.json"]?.content;
      if (!content) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Gist 中未找到数据文件" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: content,
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
