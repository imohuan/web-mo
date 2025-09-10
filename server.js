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
  //   `                 # 大标题
  //     ## 中标题
  //     ### 小标题
  // \`\`\`html
  //   <!DOCTYPE html>
  //   <html lang="en">

  //   <head>
  //     <meta charset="UTF-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <title>Document</title>
  //   </head>

  //   <body>
  //     <h1>Hello World</h1>
  //   </body>

  //   </html>
  //   \`\`\`
  //     `,
  `\`\`\`
------- SEARCH
    <div id="app" class="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
=======
    <div id="app" class="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
++++++++REPLACE
------- SEARCH
                        class="flex-grow w-full px-5 py-3 pr-24 text-gray-800 bg-white border border-gray-300 rounded-full shadow-sm
                               focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500
                               transition-all duration-300 ease-in-out placeholder-gray-400
                               hover:border-blue-300"
=======
                        class="flex-grow w-full px-6 py-3.5 pr-24 text-gray-800 bg-white border border-gray-300 rounded-full shadow-md
                               focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:border-blue-500
                               transition-all duration-300 ease-in-out placeholder-gray-400
                               hover:border-blue-300"
++++++++REPLACE
------- SEARCH
            <div class="space-y-7">
                <h2 class="text-3xl font-extrabold text-gray-900 text-center tracking-tight mb-8">
                    智能搜索
                </h2>

                <div class="relative flex items-center group">
                    <input
                        type="text"
                        v-model="searchQuery"
                        @keyup.enter="performSearch"
                        placeholder="输入关键词搜索..."
                        class="flex-grow w-full px-5 py-3 pr-24 text-gray-800 bg-white border border-gray-300 rounded-full shadow-sm
                               focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500
                               transition-all duration-300 ease-in-out placeholder-gray-400
                               hover:border-blue-300"
                        :class="{ 'opacity-80 cursor-not-allowed bg-gray-100': isLoading }"
                        :disabled="isLoading"
                    />
                    <transition name="fade">
                        <button
                            v-if="searchQuery.length > 0 && !isLoading"
                            @click="clearSearch"
                            class="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700
                                   focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full transition-all duration-200 ease-in-out"
                            title="清空搜索"
=======
            <div class="space-y-7">
                <h2 class="text-3xl font-extrabold text-gray-900 text-center tracking-tight mb-8">
                    智能搜索
                </h2>

                <div class="relative flex items-center group">
                    <input
                        type="text"
                        v-model="searchQuery"
                        @keyup.enter="performSearch"
                        placeholder="输入关键词搜索..."
                        class="flex-grow w-full px-6 py-3.5 pr-24 text-gray-800 bg-white border border-gray-300 rounded-full shadow-md
                               focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:border-blue-500
                               transition-all duration-300 ease-in-out placeholder-gray-400
                               hover:border-blue-300"
                        :class="{ 'opacity-80 cursor-not-allowed bg-gray-100': isLoading }"
                        :disabled="isLoading"
                    />
                    <transition name="fade">
                        <button
                            v-if="searchQuery.length > 0 && !isLoading"
                            @click="clearSearch"
                            class="absolute right-12 top-1/2 -translate-y-1/2 p-2.5 text-gray-500 hover:text-gray-700
                                   focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full transition-all duration-200 ease-in-out"
                            title="清空搜索"
++++++++REPLACE
------- SEARCH
                        class="p-4 bg-white border border-gray-200 rounded-xl text-gray-800
                               hover:bg-blue-50 hover:border-blue-300 hover:shadow-md
                               transition-all duration-200 ease-in-out cursor-pointer text-base">
=======
                        class="p-4 bg-white border border-gray-200 rounded-xl text-gray-800
                               hover:bg-blue-100 hover:border-blue-400 hover:shadow-lg
                               transition-all duration-200 ease-in-out cursor-pointer text-base">
++++++++REPLACE
------- SEARCH
                <div v-else-if="showNoResults" class="flex flex-col items-center justify-center p-6 text-gray-500 bg-gray-50 rounded-lg">
=======
                <div v-else-if="showNoResults" class="flex flex-col items-center justify-center p-6 text-gray-600 bg-blue-50 border border-blue-200 rounded-lg">
++++++++REPLACE
------- SEARCH
                <div v-else-if="showInitialMessage" class="flex flex-col items-center justify-center p-6 text-gray-500 bg-gray-50 rounded-lg">
=======
                <div v-else-if="showInitialMessage" class="flex flex-col items-center justify-center p-6 text-gray-600 bg-blue-50 border border-blue-200 rounded-lg">
++++++++REPLACE
  \`\`\``
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
  // console.log('收到请求:', req.body);
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

    // 模拟随机块数输出
    const words = mockResponse.split('');
    let i = 0;

    while (i < words.length) {
      // 随机生成5-10个字符的块大小
      const chunkSize = Math.floor(Math.random() * 10) + 10; // 5-10
      const endIndex = Math.min(i + chunkSize, words.length);

      const currentContent = words.slice(i, endIndex).join('');
      const chunk = createStreamChunk(currentContent);
      res.write(chunk);

      i = endIndex;

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(Math.random(), currentContent);
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
