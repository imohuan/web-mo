<template>
  <div class="w-full h-screen flex bg-gray-50">
    <!-- 左侧可折叠历史记录 -->
    <ChatSidebar
      :collapsed="sidebarCollapsed"
      :chat-history="chatHistory"
      :current-chat-id="currentChatId"
      @toggle="toggleSidebar"
      @new-chat="createNewChat"
      @select-chat="selectChat"
      @delete-chat="handleDeleteChat"
    />

    <!-- 主体内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 全局头部 -->
      <AppHeader title="AI Chat & Code Editor" />

      <!-- 主内容区域（固定宽度，不受侧边栏影响） -->
      <div class="flex flex-1 min-w-0 overflow-hidden">
        <!-- 对话区域 -->
        <ChatWindow
          ref="chatWindowRef"
          :messages="currentMessages"
          :is-loading="isLoading"
          :selected-model="selectedModel"
          :render-markdown="renderMarkdown"
          :format-time="formatTime"
          @send-message="handleSendMessage"
          @model-change="selectModel"
          @clear-chat="clearCurrentChat"
        />

        <!-- 代码编辑器区域 -->
        <CodeEditor
          ref="codeEditorRef"
          :title="editorTitle"
          v-model:current-code="currentCode"
          :is-preview-mode="isPreviewMode"
          :can-undo="canUndo"
          :can-redo="canRedo"
          :history="codeHistory"
          :current-history-index="currentHistoryIndex"
          @toggle-preview="isPreviewMode = !isPreviewMode"
          @undo="handleUndo"
          @redo="handleRedo"
          @history="console.log('显示历史')"
          @history-select="selectHistoryItem"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import AppHeader from "./components/layout/AppHeader.vue";
import ChatSidebar from "./components/chat/ChatSidebar.vue";
import ChatWindow from "./components/chat/ChatWindow.vue";
import CodeEditor from "./components/editor/CodeEditor.vue";
import { useChat } from "./composables/useChat";
import { useCodeEditor } from "./composables/useCodeEditor";
import { useMarkdown } from "./composables/useMarkdown";
import { useLayout } from "./composables/useLayout";
import { useModelSelection } from "./composables/useModelSelection";

// 使用组合式函数
const {
  displayedChatHistory: chatHistory,
  activeChatId: currentChatId,
  currentMessages,
  isLoading,
  createNewChat,
  selectChat,
  addUserMessage,
  sendAIRequest,
  clearCurrentChat,
  deleteChat,
  updateCurrentCode,
  addToCodeHistory,
  getCurrentCode,
  getCodeHistory,
  selectCodeHistoryItem,
  canUndoCode,
  canRedoCode,
  handleUndoCode,
  handleRedoCode,
} = useChat();

const {
  isPreviewMode,
  editorTitle,
  extractHtmlFromMarkdown,
  updateCssInHtml,
  updateJsInHtml,
  resetStreamMonitor,
} = useCodeEditor();

const {
  renderMarkdown,
  formatTime,
  setupCopyCodeFunction,
  setCodePreviewHandler,
} = useMarkdown();

const { sidebarCollapsed, toggleSidebar } = useLayout();

const { selectedModel, selectModel } = useModelSelection();

// 组件状态
const chatWindowRef = ref();
const codeEditorRef = ref();

// 编辑器相关响应式状态
const currentCode = ref('');
const codeHistory = ref<Array<{code: string, timestamp: number, title?: string}>>([]);
const currentHistoryIndex = ref(0);

// 方法
const handleDeleteChat = (chatId: number) => {
  if (window.confirm("确定要删除这个对话吗？")) {
    deleteChat(chatId);
  }
};

// Debounce函数
const debounce = (func: Function, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 保存代码到当前对话（带debounce）
const saveCodeToCurrentChat = debounce((newCode: string) => {
  if (currentChatId.value !== null) {
    updateCurrentCode(currentChatId.value, newCode);
  }
}, 500);

// 添加代码到历史记录（带debounce）
const addHistoryToCurrentChat = debounce((code: string, title?: string) => {
  if (currentChatId.value !== null) {
    addToCodeHistory(currentChatId.value, code, title);
  }
}, 1000);

const handleSendMessage = async (data: { message: string; images: string[] }) => {
  if (!data.message.trim() && data.images.length === 0) return;

  // 重置流式监听器状态
  resetStreamMonitor();

  // 添加用户消息
  addUserMessage(data.message, data.images);

  // 滚动到底部
  chatWindowRef.value?.scrollToBottom();

  // 调用AI API
  await sendAIRequest(data.message, data.images, currentCode.value, (content: string) => {
    // 实时更新代码编辑器
    extractHtmlFromMarkdown(content);

    // 检测CSS代码
    const cssMatch = content.match(/```css\s*([\s\S]*?)```/i);
    if (cssMatch && cssMatch[1]) {
      updateCssInHtml(cssMatch[1].trim());
    }

    // 检测JavaScript代码
    const jsMatch = content.match(/```javascript\s*([\s\S]*?)```/i);
    if (jsMatch && jsMatch[1]) {
      updateJsInHtml(jsMatch[1].trim());
    }

    // 节流滚动
    chatWindowRef.value?.scrollToBottom();
  });
};

// 监听代码变化，保存到当前对话
const handleCodeUpdate = (newCode: string) => {
  currentCode.value = newCode;
  saveCodeToCurrentChat(newCode);
};

// 添加代码到历史记录
const handleAddToHistory = (code: string, title?: string) => {
  addHistoryToCurrentChat(code, title);
};

// 处理代码差异应用事件
const handleCodeDiffEvent = (event: CustomEvent) => {
  const { diffContent } = event.detail;
  console.log("收到差异应用事件:", diffContent);
  // 获取编辑器实例并调用 applyDiff 方法
  if (codeEditorRef.value) {
    try {
      // 通过 CodeEditor 暴露的 editorRef 访问 MonacoEditor 的 applyDiff 方法
      const monacoEditorRef = codeEditorRef.value.editorRef;
      if (monacoEditorRef && monacoEditorRef.applyDiff) {
        monacoEditorRef.applyDiff(diffContent);
        console.log("差异应用成功");
      } else {
        console.warn("无法访问编辑器的 applyDiff 方法");
      }
    } catch (error) {
      console.error("应用差异时出错:", error);
    }
  }
};

// 监听差异模式结束，保存代码到历史记录
window.addEventListener('diffModeEnded', (event: any) => {
  const { finalCode } = event.detail;
  console.log("差异模式结束，保存代码到历史记录:", finalCode);
  if (currentChatId.value !== null) {
    addHistoryToCurrentChat(finalCode, "差异对比完成");
  }
});

// 初始化
onMounted(() => {
  setupCopyCodeFunction();

  // 设置代码预览处理器
  setCodePreviewHandler((code: string, lang: string) => {
    if (lang.toLowerCase() === "html") {
      currentCode.value = code;
      // 如果代码是HTML，切换到预览模式
      if (!isPreviewMode.value) {
        isPreviewMode.value = !isPreviewMode.value;
      }
    }
  });

  // 监听代码差异应用事件
  window.addEventListener("applyCodeDiff", handleCodeDiffEvent as EventListener);
});

// 监听当前对话变化，更新编辑器状态
watch(currentChatId, (newChatId) => {
  if (newChatId !== null) {
    currentCode.value = getCurrentCode(newChatId);
    codeHistory.value = getCodeHistory(newChatId);
    currentHistoryIndex.value = chatHistory.value.find(chat => chat.id === newChatId)?.currentHistoryIndex || 0;
  } else {
    // 如果没有选中对话，使用空代码
    currentCode.value = '';
    codeHistory.value = [];
    currentHistoryIndex.value = 0;
  }
}, { immediate: true });

// 监听代码变化，同步到当前对话
watch(currentCode, (newCode) => {
  if (newCode && currentChatId.value !== null) {
    // 更新当前对话的代码
    updateCurrentCode(currentChatId.value, newCode);
  }
});

// 计算属性：判断是否可以撤销/重做代码
const canUndo = computed(() => currentChatId.value !== null ? canUndoCode(currentChatId.value) : false);
const canRedo = computed(() => currentChatId.value !== null ? canRedoCode(currentChatId.value) : false);

// 处理撤销代码
const handleUndo = () => {
  if (currentChatId.value !== null) {
    handleUndoCode(currentChatId.value);
    currentCode.value = getCurrentCode(currentChatId.value);
    codeHistory.value = getCodeHistory(currentChatId.value);
    currentHistoryIndex.value = chatHistory.value.find(chat => chat.id === currentChatId.value)?.currentHistoryIndex || 0;
  }
};

// 处理重做代码
const handleRedo = () => {
  if (currentChatId.value !== null) {
    handleRedoCode(currentChatId.value);
    currentCode.value = getCurrentCode(currentChatId.value);
    codeHistory.value = getCodeHistory(currentChatId.value);
    currentHistoryIndex.value = chatHistory.value.find(chat => chat.id === currentChatId.value)?.currentHistoryIndex || 0;
  }
};

// 处理历史记录选择
const selectHistoryItem = (index: number) => {
  if (currentChatId.value !== null) {
    selectCodeHistoryItem(currentChatId.value, index);
    currentCode.value = getCurrentCode(currentChatId.value);
    currentHistoryIndex.value = index;
  }
};

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener("applyCodeDiff", handleCodeDiffEvent as EventListener);
  window.removeEventListener('diffModeEnded', (event: any) => {
    const { finalCode } = event.detail;
    console.log("清理监听器 - 差异模式结束:", finalCode);
  });
});
</script>

<style scoped>
/* 确保滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Markdown渲染样式 */
:deep(.code-block) {
  margin: 1rem 0;
}

:deep(.code-block pre) {
  margin: 0;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 14px;
  line-height: 1.5;
}

:deep(.code-block button) {
  background: none;
  border: none;
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }

  .editor-container {
    width: 100%;
    height: 50vh;
  }
}
</style>
