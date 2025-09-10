<template>
  <div class="h-full space-y-6 overflow-y-auto pr-2 pb-2">
    <!-- 消息数量限制提示 -->
    <div
      v-if="props.messages.length > messageSettings.maxMessages"
      class="text-center py-2"
    >
      <div
        class="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
      >
        显示最近 {{ messageSettings.maxMessages }} 条消息，共
        {{ props.messages.length }} 条
      </div>
    </div>

    <div
      v-for="message in displayMessages"
      :key="message.id"
      :class="[
        'flex gap-4 group',
        message.role === 'user' ? 'justify-end' : 'justify-start',
        messageSettings.messageAnimation ? 'message-enter-active' : '',
      ]"
    >
      <!-- 头像 -->
      <div
        v-if="message.role === 'assistant'"
        class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
      >
        G
      </div>

      <!-- 消息内容 -->
      <div
        :class="[
          'max-w-3xl rounded-lg px-4 py-3 shadow-sm overflow-x-hidden min-w-32 flex flex-col gap-2',
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'w-11/12 bg-white text-gray-800 border border-gray-200',
        ]"
      >
        <!-- 如果是助手消息，根据设置决定是否使用markdown渲染 -->
        <div v-if="message.role === 'assistant'" class="relative">
          <div
            v-if="messageSettings.enableMarkdown"
            v-html="renderMarkdown(message.content)"
            :class="[
              'markdown-body',
              !messageSettings.codeHighlight ? 'no-highlight' : '',
            ]"
          ></div>
          <div v-else class="whitespace-pre-wrap">{{ message.content }}</div>
        </div>
        <div v-else class="whitespace-pre-wrap">{{ message.content }}</div>

        <!-- 图片显示 -->
        <div
          v-if="message.images && message.images.length > 0"
          class="mt-3 flex flex-wrap gap-2"
        >
          <img
            v-for="(image, index) in message.images"
            :key="index"
            :src="image"
            class="max-w-xs rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            alt="上传的图片"
            @click="previewImage(image)"
          />
        </div>

        <div class="w-full flex justify-between items-center">
          <!-- xs 时间戳 -->
          <div
            v-if="!message.isStreaming && messageSettings.showTimestamp"
            class="text-xs opacity-70"
          >
            {{ formatTime(message.timestamp) }}
          </div>
          <div v-else-if="!message.isStreaming && !messageSettings.showTimestamp"></div>

          <!-- 消息操作按钮 -->
          <div
            v-if="!message.isStreaming"
            class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <!-- 重试按钮（仅AI消息显示） -->
            <button
              v-if="message.role === 'assistant'"
              @click="retryMessage(message)"
              class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
              title="重新生成"
            >
              <RefreshIcon class="w-4 h-4" />
            </button>

            <!-- 删除按钮 -->
            <button
              @click="deleteMessage(message)"
              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              title="删除消息"
            >
              <CloseIcon class="w-4 h-4" />
            </button>
          </div>

          <div
            v-if="message.role === 'assistant' && message.isStreaming"
            class="flex items-center"
          >
            <LoaddingSvg class="w-4 h-4 animate-spin" />
          </div>
        </div>
      </div>

      <!-- 用户头像 -->
      <div
        v-if="message.role === 'user'"
        class="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
      >
        U
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ChatMessage } from "@/composables/useChat";
import { useSettings } from "@/composables/useSettings";
import LoaddingSvg from "@/assets/icons/loadding.svg?component";
import RefreshIcon from "@/assets/icons/refresh.svg?component";
import CloseIcon from "@/assets/icons/close.svg?component";

interface Props {
  messages: ChatMessage[];
  renderMarkdown: (content: string) => string;
  formatTime: (date: Date) => string;
}

interface Emits {
  (e: "delete-message", message: ChatMessage): void;
  (e: "retry-message", message: ChatMessage): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 获取设置
const { messageSettings } = useSettings();

// 根据设置限制消息数量
const displayMessages = computed(() => {
  const maxMessages = messageSettings.value.maxMessages;
  if (props.messages.length <= maxMessages) {
    return props.messages;
  }
  return props.messages.slice(-maxMessages);
});

const previewImage = (imageUrl: string) => {
  window.open(imageUrl, "_blank");
};

const deleteMessage = (message: ChatMessage) => {
  if (confirm("确定要删除这条消息吗？")) {
    emit("delete-message", message);
  }
};

const retryMessage = (message: ChatMessage) => {
  emit("retry-message", message);
};
</script>

<style scoped>
/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter-active {
  animation: fadeIn 0.3s ease-out;
}

/* 代码块简洁样式 */
.markdown-body :deep(.code-block) {
  border-radius: 0.375rem;
  overflow: hidden;
}

.markdown-body :deep(.code-header) {
  border-bottom: 1px solid #e5e7eb;
}

.markdown-body :deep(.fold-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.markdown-body :deep(.fold-btn svg) {
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

.markdown-body :deep(.code-action-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.markdown-body :deep(.code-action-btn svg) {
  width: 14px;
  height: 14px;
}

.markdown-body :deep(.code-content) {
  transition: all 0.3s ease;
}

/* 语法高亮样式覆盖 */
.markdown-body :deep(.hljs) {
  background: #f8f9fa !important;
  color: #24292e !important;
}

/* 禁用代码高亮时的样式 */
.markdown-body.no-highlight :deep(.hljs) {
  background: #f8f9fa !important;
  color: #24292e !important;
}

.markdown-body.no-highlight :deep(.hljs *) {
  color: #24292e !important;
}

/* 流式光标 */
.streaming-text-cursor::after {
  content: "";
  display: inline-block;
  width: 3px;
  height: 1.2em;
  background-color: #3b82f6;
  animation: blink 1s infinite;
  margin-left: 4px;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* 代码块流式加载动画 */
.streaming-code-cursor::after {
  content: "";
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 16px;
  height: 16px;
  border: 2px solid #9ca3af;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}
</style>
