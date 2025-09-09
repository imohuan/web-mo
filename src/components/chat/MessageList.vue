<template>
  <div class="h-full space-y-6 overflow-y-auto pr-2 pb-2">
    <div
      v-for="message in messages"
      :key="message.id"
      :class="[
        'flex gap-4 message-enter-active',
        message.role === 'user' ? 'justify-end' : 'justify-start',
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
          'max-w-3xl rounded-lg px-4 py-3 shadow-sm overflow-x-hidden',
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'w-10/12 bg-white text-gray-800 border border-gray-200',
        ]"
      >
        <!-- 如果是助手消息，使用markdown渲染 -->
        <div v-if="message.role === 'assistant'" class="relative">
          <div v-html="renderMarkdown(message.content)" class="markdown-body"></div>
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

        <div class="w-full flex justify-between items-center mt-2">
          <!-- xs 时间戳 -->
          <div v-if="!message.isStreaming" class="text-xs opacity-70">
            {{ formatTime(message.timestamp) }}
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
import type { ChatMessage } from "@/composables/useChat";
import LoaddingSvg from "@/assets/icons/loadding.svg?component";

interface Props {
  messages: ChatMessage[];
  renderMarkdown: (content: string) => string;
  formatTime: (date: Date) => string;
}

defineProps<Props>();

const previewImage = (imageUrl: string) => {
  window.open(imageUrl, "_blank");
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
