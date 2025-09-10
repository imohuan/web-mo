import { ref, computed } from "vue";
import OpenAI from "openai";
import { useSettings } from "./useSettings";
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
  const isLoading = useLocalStorage("isLoading", false);
  const abortController = ref<AbortController | null>(null);
  useLocalStorage("chatHistory", chatHistory);

  // 获取设置
  const { aiSettings, enabledPrompts } = useSettings();

  // 检查是否有正在流式处理的消息
  const hasStreamingMessage = computed(() => {
    return chatHistory.value.some(chat =>
      chat.messages.some(msg => msg.isStreaming)
    );
  });

  // 页面加载时检查是否有流式消息，如果有则重置状态
  const checkAndCleanupStreamingMessages = () => {
    let hasStreaming = false;
    chatHistory.value.forEach(chat => {
      chat.messages.forEach(msg => {
        if (msg.isStreaming) {
          hasStreaming = true;
          // 将流式消息标记为完成，但内容可能不完整
          msg.isStreaming = false;
          if (!msg.content.trim()) {
            msg.content = "请求被中断";
          }
        }
      });
    });

    // 如果发现有流式消息，重置加载状态
    if (hasStreaming) {
      isLoading.value = false;
    }
  };

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
</html>`;

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

    const oldChat = chatHistory.value.find(chat => chat.title === "新对话")
    if (oldChat) {
      chatHistory.value.splice(chatHistory.value.indexOf(oldChat), 1);
    }
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
    abortController.value = new AbortController();

    try {
      const options = {
        apiKey: aiSettings.value.apiKey,
        baseURL: aiSettings.value.baseUrl,
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

      // 构建消息数组，使用设置中的系统提示词
      const messages: any[] = [];

      // 添加启用的系统提示词
      enabledPrompts.value.forEach((prompt) => {
        messages.push({
          role: prompt.role,
          content: prompt.content,
        });
      });

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

      const stream = await openai.chat.completions.create(
        {
          model: "gemini-2.5-flash",
          messages,
          stream: true,
        },
        {
          signal: abortController.value.signal,
        }
      );

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
      if (error.name === "AbortError") {
        console.log("AI请求被用户取消");
        // 删除流式中的消息
        const currentChat = chatHistory.value.find(
          (chat) => chat.id === currentChatId.value
        );
        if (currentChat) {
          const loadingIndex = currentChat.messages.findIndex((msg) => msg.isStreaming);
          if (loadingIndex !== -1) {
            currentChat.messages.splice(loadingIndex, 1);
          }
        }
        return;
      }

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
      abortController.value = null;
    }
  };

  const stopStreaming = () => {
    // 如果有 abortController，尝试终止请求
    if (abortController.value) {
      abortController.value.abort();
    }

    // 无论是否有 abortController，都清理所有流式消息状态
    // 这处理了页面刷新后 abortController 丢失的情况
    chatHistory.value.forEach(chat => {
      chat.messages.forEach(msg => {
        if (msg.isStreaming) {
          msg.isStreaming = false;
          if (!msg.content.trim()) {
            msg.content = "请求被用户终止";
          }
        }
      });
    });

    // 重置加载状态
    isLoading.value = false;
    abortController.value = null;
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

  const deleteMessage = (messageId: string) => {
    const currentChat = chatHistory.value.find((chat) => chat.id === currentChatId.value);
    if (currentChat) {
      const index = currentChat.messages.findIndex((msg) => msg.id === messageId);
      if (index !== -1) {
        currentChat.messages.splice(index, 1);
      }
    }
  };

  const retryMessage = (
    messageId: string,
    originalMessage: string,
    images: string[] = []
  ) => {
    const currentChat = chatHistory.value.find((chat) => chat.id === currentChatId.value);
    if (currentChat) {
      // 找到要重试的消息及其之后的所有消息并删除
      const messageIndex = currentChat.messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex !== -1) {
        currentChat.messages.splice(messageIndex);
        // 重新发送消息
        return { shouldResend: true, message: originalMessage, images };
      }
    }
    return { shouldResend: false };
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
        set: (value) => {
          chat.codeHistory = value;
        },
      }),
      currentHistoryIndex: computed({
        get: () => chat.currentHistoryIndex,
        set: (value) => {
          chat.currentHistoryIndex = value;
        },
      }),
      canUndo: computed(() => chat.currentHistoryIndex > 0),
      canRedo: computed(() => chat.currentHistoryIndex < chat.codeHistory.length - 1),
      selectHistoryItem: (index: number) => {
        if (index >= 0 && index < chat.codeHistory.length) {
          chat.currentHistoryIndex = index;
          chat.currentCode = chat.codeHistory[index].code;
        }
      },
    };
  };

  return {
    displayedChatHistory,
    activeChatId,
    currentMessages,
    isLoading,
    hasStreamingMessage,
    createNewChat,
    selectChat,
    addUserMessage,
    sendAIRequest,
    stopStreaming,
    clearCurrentChat,
    deleteChat,
    deleteMessage,
    retryMessage,
    updateCurrentCode,
    getCurrentCode,
    getCurrentChatHistoryManager,
    checkAndCleanupStreamingMessages,
  };
}
