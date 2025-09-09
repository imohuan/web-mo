import { ref, computed } from "vue";
import OpenAI from "openai";
import { useLocalStorage } from "@vueuse/core";
import type { HistoryItem } from "./useCodeEditor";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: number;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  currentCode: string;
  codeHistory: HistoryItem[];
  currentHistoryIndex: number;
}

export function useChat() {
  const chatHistory = ref<ChatSession[]>([]);
  const currentChatId = ref<number | null>(null);
  const isLoading = ref(false);
  useLocalStorage("chatHistory", chatHistory);

  const defaultCode = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>示例页面</title>
</head>
<body>
    <div class="container">
        <h1>欢迎使用AI代码编辑器</h1>
        <p>这是一个示例HTML页面，您可以在左侧与AI对话来生成或修改代码。</p>
    </div>
</body>
</html>`

  const displayedChatHistory = computed<ChatSession[]>(() => {
    if (chatHistory.value.length === 0) {
      return [
        {
          id: -1, // Virtual ID
          title: "新对话",
          messages: [],
          createdAt: new Date(),
          currentCode: defaultCode,
          codeHistory: [{ code: defaultCode, timestamp: Date.now(), title: "初始代码" }],
          currentHistoryIndex: 0,
        },
      ];
    }
    return chatHistory.value;
  });

  const activeChatId = computed(() => {
    if (currentChatId.value !== null) {
      return currentChatId.value;
    }
    return chatHistory.value.length === 0 ? -1 : null;
  });

  const currentMessages = computed(() => {
    if (currentChatId.value === null) {
      return [];
    }
    const chat = chatHistory.value.find((chat) => chat.id === currentChatId.value);
    return chat?.messages || [];
  });

  const createNewChat = () => {
    const newId =
      chatHistory.value.length > 0
        ? Math.max(0, ...chatHistory.value.map((c) => c.id)) + 1
        : 1;
    const newChat: ChatSession = {
      id: newId,
      title: "新对话",
      messages: [],
      createdAt: new Date(),
      currentCode: defaultCode,
      codeHistory: [{ code: defaultCode, timestamp: Date.now(), title: "初始代码" }],
      currentHistoryIndex: 0,
    };
    chatHistory.value.unshift(newChat);
    currentChatId.value = newId;
    return newChat;
  };

  const selectChat = (chatId: number) => {
    if (chatId === -1) {
      currentChatId.value = null;
    } else {
      currentChatId.value = chatId;
    }
  };

  const addUserMessage = (content: string, images: string[] = []) => {
    let currentChat = chatHistory.value.find((chat) => chat.id === currentChatId.value);

    if (!currentChat) {
      currentChat = createNewChat();
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      images,
      timestamp: new Date(),
    };

    currentChat.messages.push(userMessage);

    if (currentChat.messages.length === 1) {
      currentChat.title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
    }

    return userMessage;
  };

  const addAssistantMessage = () => {
    const currentChat = chatHistory.value.find((chat) => chat.id === currentChatId.value);
    if (!currentChat) {
      console.error("Cannot add assistant message without an active chat.");
      return null;
    }

    const aiMessage: ChatMessage = {
      id: Date.now().toString() + "_ai",
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    currentChat.messages.push(aiMessage);
    return aiMessage;
  };

  const updateAssistantMessage = (
    messageId: string,
    content: string,
    isComplete: boolean = false
  ) => {
    const currentChat = chatHistory.value.find((chat) => chat.id === currentChatId.value);
    if (currentChat) {
      const message = currentChat.messages.find((msg) => msg.id === messageId);
      if (message) {
        message.content = content;
        if (isComplete) {
          message.isStreaming = false;
        }
      }
    }
  };

  const sendAIRequest = async (
    message: string,
    images: string[],
    editorCode?: string,
    onContentUpdate?: (content: string) => void
  ) => {
    isLoading.value = true;

    try {
      const options = {
        apiKey: "sk-U3SKSHcCuyi6eDtR0h9QjZ05VVVi8hPIinlme8yRfafN6BS0",
        baseURL: `https://yunwu.ai/v1`,
        // baseURL: `http://localhost:3001/v1`,
        dangerouslyAllowBrowser: true,
      };

      const openai = new OpenAI(options);

      // 构建消息内容
      const messageContent: any = [{ type: "text", text: message }];

      // 添加图片
      if (images.length > 0) {
        images.forEach((image) => {
          messageContent.push({
            type: "image_url",
            image_url: { url: image },
          });
        });
      }

      const aiMessage = addAssistantMessage();

      // 构建消息数组
      const messages: any[] = [
        {
          role: "system",
          content: `**角色 (Role):**
你是一位资深的Web前端工程师和代码架构师，**唯一且必须**精通 **Vue 3 (Composition API with \`< script setup> \`)** 和 **Tailwind CSS**。你的核心职责是根据用户的需求，高质量地创建新代码或高效地修改现有代码。

**核心技术栈 (Core Technology Stack):**
**你所有的代码输出，无论是创建、重构还是修改，都必须严格遵循以下技术栈：**
* **框架:** Vue 3 (\`< script setup > \` 语法)
* **样式:** Tailwind CSS
* **基础:** HTML 和 JavaScript
* **图标:** 内联SVG组件

**工作流程 (Workflow):**
你将根据用户请求的性质，在以下两种模式之间自动切换。**无论在哪种模式下，都必须严格遵守上述核心技术栈。**

1.  **代码生成/重构模式：** 当用户请求创建新功能、新组件，或要求对现有代码进行重大重构时，你将采用此模式。
2.  **代码修改/补丁模式：** 当用户提供了现有代码，并要求进行少量、精确的修改时，你将采用此模式。

---

### **模式一：代码生成/重构模式**

**任务描述 (Task):**
使用核心技术栈，开发一个功能完整、界面精美、代码高质量的Web应用或组件。

**规范与要求 (Constraints & Format):**

1.  **代码质量：**
    * **组件化:** 合理拆分组件，确保代码高内聚、低耦合。
    * **Hooks:** 将可复用的逻辑封装成独立的Hooks (Composition Functions)。
    * **可扩展性:** 编写的代码必须易于理解和扩展。
    * **禁止伪代码:** 交付的代码必须是完整、可直接运行的。
2.  **UI/UX 要求：** 追求卓越的用户体验和界面设计，注重细节。
3.  **最终输出形式：** 必须将所有代码（HTML, CSS, JS）整合成一个独立的、自包含的 \`.html\` 文件。

---

### **模式二：代码修改/补丁模式**

**任务描述 (Task):**
基于用户提供的 Vue 3 和 Tailwind CSS 代码，进行精确修改，并生成一个仅包含变更部分的“补丁”。

**格式与约束 (Format & Constraints):**

1.  **输出格式：** 你的输出必须且只能遵循以下严格格式：
    * **文件声明:** 在代码块之前，必须先声明被编辑的文件名，格式为：\`我帮你编辑[文件名]\`。
    * **代码块:** 所有的变更内容都必须包裹在一个Markdown代码块中。
    * **补丁结构:** 每一处修改都必须使用以下三段式结构。如果有多处修改，则连续罗列。修改都必须使用以下三段式结构。如果有多处修改，则连续罗列。
        \`\`\`
        ------- SEARCH
        [此处填入可以在源代码中被唯一搜索到的、需要被替换的旧代码片段]
        =======
        [此处处填入符合核心技术栈规范的、替换后的新代码片段]
      ++++++++REPLACE
        \`\`\`

2.  **核心约束：**

      * **绝对禁止返回完整代码。**
      * \`------- SEARCH\` 部分的代码必须是原始代码中的真实、独特片段。
      * **保持简洁:** 除非修改无法实现，否则不要添加任何额外的解释或说明。
      * **准确性:** 如果修改要求无法实现或 \`SEARCH\` 代码段在原文中找不到，应明确指出问题。`,
        },
      ];

      // 如果有编辑器代码，先添加代码上下文
      if (editorCode && editorCode.trim()) {
        messages.push({
          role: "user",
          content: `当前编辑器中的代码：\n\`\`\`\n${editorCode}\n\`\`\``,
        });
      }

      // 添加用户的实际请求
      messages.push({
        role: "user",
        content: messageContent,
      });

      const stream = await openai.chat.completions.create({
        model: "gemini-2.5-flash",
        messages,
        stream: true,
      });

      let fullContent = "";

      for await (const part of stream) {
        const content = part.choices[0]?.delta?.content || "";
        if (content) {
          fullContent += content;
          updateAssistantMessage(aiMessage.id, fullContent);

          // 回调通知内容更新
          if (onContentUpdate) {
            onContentUpdate(fullContent);
          }
        }
      }

      updateAssistantMessage(aiMessage.id, fullContent, true);
    } catch (error) {
      console.error("AI请求失败:", error);

      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "_error",
        role: "assistant",
        content: "抱歉，AI请求失败了，请稍后重试。错误信息：" + (error as Error).message,
        timestamp: new Date(),
      };

      const currentChat = chatHistory.value.find(
        (chat) => chat.id === currentChatId.value
      );
      if (currentChat) {
        // 删除加载中的消息，添加错误消息
        const loadingIndex = currentChat.messages.findIndex((msg) => msg.isStreaming);
        if (loadingIndex !== -1) {
          currentChat.messages.splice(loadingIndex, 1);
        }
        currentChat.messages.push(errorMessage);
      }
    } finally {
      isLoading.value = false;
    }
  };

  const clearCurrentChat = () => {
    const currentChat = chatHistory.value.find((chat) => chat.id === currentChatId.value);
    if (currentChat) {
      currentChat.messages = [];
      currentChat.title = "新对话";
    }
  };

  const deleteChat = (chatId: number) => {
    const index = chatHistory.value.findIndex((chat) => chat.id === chatId);
    if (index !== -1) {
      chatHistory.value.splice(index, 1);

      if (currentChatId.value === chatId) {
        if (chatHistory.value.length > 0) {
          currentChatId.value = chatHistory.value[0].id;
        } else {
          currentChatId.value = null;
        }
      }
    }
  };

  const updateCurrentCode = (chatId: number, newCode: string) => {
    const chat = chatHistory.value.find((chat) => chat.id === chatId);
    if (chat) {
      chat.currentCode = newCode;
    }
  };

  const getCurrentCode = (chatId: number): string => {
    const chat = chatHistory.value.find((chat) => chat.id === chatId);
    return chat?.currentCode || defaultCode;
  };

  // 获取当前对话的历史记录管理对象，供 useCodeEditor 使用
  const getCurrentChatHistoryManager = (chatId: number) => {
    const chat = chatHistory.value.find((chat) => chat.id === chatId);
    if (!chat) return null;

    return {
      history: computed({
        get: () => chat.codeHistory,
        set: (value) => { chat.codeHistory = value; }
      }),
      currentHistoryIndex: computed({
        get: () => chat.currentHistoryIndex,
        set: (value) => { chat.currentHistoryIndex = value; }
      }),
      canUndo: computed(() => chat.currentHistoryIndex > 0),
      canRedo: computed(() => chat.currentHistoryIndex < chat.codeHistory.length - 1),
      selectHistoryItem: (index: number) => {
        if (index >= 0 && index < chat.codeHistory.length) {
          chat.currentHistoryIndex = index;
          chat.currentCode = chat.codeHistory[index].code;
        }
      }
    };
  };

  return {
    displayedChatHistory,
    activeChatId,
    currentMessages,
    isLoading,
    createNewChat,
    selectChat,
    addUserMessage,
    sendAIRequest,
    clearCurrentChat,
    deleteChat,
    updateCurrentCode,
    getCurrentCode,
    getCurrentChatHistoryManager,
  };
}
