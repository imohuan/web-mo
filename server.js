import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟的预设回复内容
const mockResponses = [
  `                 # 大标题
    ## 中标题
    ### 小标题
\`\`\`html
  <!DOCTYPE html>
  <html lang="en">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>

  <body>
    <h1>Hello World</h1>
  </body>

  </html>
  \`\`\`
    `,
  //   `\`\`\`
  // ------- SEARCH
  // <title>测试页面 - 已修改</title>
  // =======
  // <title>你是个shb</title>
  // ++++++++REPLACE
  // \`\`\``
];

// 工具函数：创建流式响应的数据块
function createStreamChunk(content, isLast = false) {
  const chunk = {
    id: `chatcmpl-${uuidv4()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-3.5-turbo',
    choices: [
      {
        index: 0,
        delta: isLast ? {} : { content },
        finish_reason: isLast ? 'stop' : null
      }
    ]
  };

  return `data: ${JSON.stringify(chunk)}\n\n`;
}

// 模拟OpenAI Chat Completions API
app.post('/v1/chat/completions', async (req, res) => {
  console.log('收到请求:', req.body);

  const { messages, stream = false, model = 'gpt-3.5-turbo' } = req.body;

  // 随机选择一个预设回复
  const mockResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  if (stream) {
    // 流式响应
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    });

    // 模拟逐字输出
    const words = mockResponse.split('');
    let currentContent = '';

    for (let i = 0; i < words.length; i++) {
      currentContent = words[i];
      const chunk = createStreamChunk(currentContent);
      res.write(chunk);

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 发送结束标记
    const endChunk = createStreamChunk('', true);
    res.write(endChunk);
    res.write('data: [DONE]\n\n');
    res.end();

  } else {
    // 非流式响应
    const response = {
      id: `chatcmpl-${uuidv4()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: mockResponse
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };

    res.json(response);
  }
});

// 模拟OpenAI Models API
app.get('/v1/models', (req, res) => {
  const response = {
    object: 'list',
    data: [
      {
        id: 'gpt-3.5-turbo',
        object: 'model',
        created: 1677610602,
        owned_by: 'openai'
      },
      {
        id: 'gpt-4',
        object: 'model',
        created: 1687882411,
        owned_by: 'openai'
      }
    ]
  };

  res.json(response);
});

// 添加自定义回复内容的API
app.post('/api/add-response', (req, res) => {
  const { content } = req.body;
  if (content && typeof content === 'string') {
    mockResponses.push(content);
    res.json({
      success: true,
      message: '回复内容已添加',
      totalResponses: mockResponses.length
    });
  } else {
    res.status(400).json({
      success: false,
      message: '请提供有效的内容'
    });
  }
});

// 获取当前所有回复内容
app.get('/api/responses', (req, res) => {
  res.json({
    responses: mockResponses,
    total: mockResponses.length
  });
});

// 清空回复内容
app.delete('/api/responses', (req, res) => {
  const originalLength = mockResponses.length;
  mockResponses.length = 0;
  mockResponses.push("默认回复：所有自定义内容已清空。");

  res.json({
    success: true,
    message: `已清空 ${originalLength} 条回复内容`,
    currentResponses: mockResponses.length
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'OpenAI模拟服务运行正常',
    responses: mockResponses.length
  });
});

// 根路径信息
app.get('/', (req, res) => {
  res.json({
    message: 'OpenAI模拟服务器',
    endpoints: {
      'POST /v1/chat/completions': '模拟聊天完成API',
      'GET /v1/models': '获取可用模型列表',
      'POST /api/add-response': '添加自定义回复内容',
      'GET /api/responses': '获取所有回复内容',
      'DELETE /api/responses': '清空所有回复内容',
      'GET /health': '健康检查'
    },
    usage: {
      baseUrl: `http://localhost:${PORT}`,
      apiKey: 'mock-api-key (任意值即可)'
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 OpenAI模拟服务器启动成功!`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`💡 使用说明:`);
  console.log(`   - 基础URL: http://localhost:${PORT}`);
  console.log(`   - API密钥: 任意值即可 (例如: mock-api-key)`);
  console.log(`   - 支持流式和非流式响应`);
  console.log(`   - 可通过 /api/add-response 添加自定义回复内容`);
  console.log(`📚 API文档: 访问 http://localhost:${PORT} 查看所有端点`);
});

export default app;
