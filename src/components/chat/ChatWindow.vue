<template>
  <div class="w-[600px] flex flex-col max-w-4xl min-w-0 pl-6 pb-4">
    <!-- 对话内容 -->
    <div class="flex-1 h-full overflow-y-hidden space-y-6 pb-6" ref="chatContainer">
      <!-- 欢迎消息 -->
      <WelcomeScreen v-if="messages.length === 0" />

      <!-- 消息列表 -->
      <MessageList
        :messages="messages"
        :render-markdown="renderMarkdown"
        :format-time="formatTime"
        @delete-message="$emit('delete-message', $event)"
        @retry-message="$emit('retry-message', $event)"
      />
    </div>

    <!-- 输入区域 -->
    <div class="border-t border-gray-200 pr-2">
      <ChatInput
        @send="$emit('send-message', $event)"
        @stop="$emit('stop-streaming')"
        :disabled="isLoading"
        :isStreaming="isStreaming"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch } from "vue";
import type { ChatMessage } from "@/composables/useChat";
import { useSettings } from "@/composables/useSettings";
import ChatInput from "../ChatInput.vue";
import WelcomeScreen from "./WelcomeScreen.vue";
import MessageList from "./MessageList.vue";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  renderMarkdown: (content: string) => string;
  formatTime: (date: Date) => string;
}

interface Emits {
  (e: "send-message", data: { message: string; images: string[] }): void;
  (e: "stop-streaming"): void;
  (e: "delete-message", message: any): void;
  (e: "retry-message", message: any): void;
  (e: "model-change", model: string): void;
  (e: "clear-chat"): void;
}

// 计算是否有流式消息
const isStreaming = computed(() => {
  return props.messages.some((msg) => msg.isStreaming);
});

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits<Emits>();

// 获取设置
const { messageSettings } = useSettings();

const chatContainer = ref<HTMLElement>();

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value && messageSettings.value.enableAutoScroll) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

// 监听消息变化，自动滚动到底部
watch(
  () => props.messages,
  () => {
    if (messageSettings.value.enableAutoScroll) {
      scrollToBottom();
    }
  },
  { deep: true }
);

// 暴露滚动方法给父组件
defineExpose({
  scrollToBottom,
});
</script>
