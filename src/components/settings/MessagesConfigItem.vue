<template>
  <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 最大消息数量 -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700"> 最大消息数量 </label>
        <input
          type="number"
          :value="localValue.maxMessages"
          @input="updateValue('maxMessages', parseInt(($event.target as HTMLInputElement).value))"
          min="10"
          max="200"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- 自动滚动 -->
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700"> 自动滚动 </label>
        <button
          @click="updateValue('enableAutoScroll', !localValue.enableAutoScroll)"
          :class="[
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            localValue.enableAutoScroll ? 'bg-blue-600' : 'bg-gray-200',
          ]"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              localValue.enableAutoScroll ? 'translate-x-5' : 'translate-x-0',
            ]"
          ></span>
        </button>
      </div>

      <!-- 显示时间戳 -->
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700"> 显示时间戳 </label>
        <button
          @click="updateValue('showTimestamp', !localValue.showTimestamp)"
          :class="[
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            localValue.showTimestamp ? 'bg-blue-600' : 'bg-gray-200',
          ]"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              localValue.showTimestamp ? 'translate-x-5' : 'translate-x-0',
            ]"
          ></span>
        </button>
      </div>

      <!-- 启用 Markdown -->
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700"> 启用 Markdown </label>
        <button
          @click="updateValue('enableMarkdown', !localValue.enableMarkdown)"
          :class="[
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            localValue.enableMarkdown ? 'bg-blue-600' : 'bg-gray-200',
          ]"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              localValue.enableMarkdown ? 'translate-x-5' : 'translate-x-0',
            ]"
          ></span>
        </button>
      </div>

      <!-- 代码高亮 -->
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700"> 代码高亮 </label>
        <button
          @click="updateValue('codeHighlight', !localValue.codeHighlight)"
          :class="[
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            localValue.codeHighlight ? 'bg-blue-600' : 'bg-gray-200',
          ]"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              localValue.codeHighlight ? 'translate-x-5' : 'translate-x-0',
            ]"
          ></span>
        </button>
      </div>

      <!-- 消息动画 -->
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700"> 消息动画 </label>
        <button
          @click="updateValue('messageAnimation', !localValue.messageAnimation)"
          :class="[
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            localValue.messageAnimation ? 'bg-blue-600' : 'bg-gray-200',
          ]"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              localValue.messageAnimation ? 'translate-x-5' : 'translate-x-0',
            ]"
          ></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

interface ConfigItem {
  key: string;
  title: string;
  description?: string;
  type: "input" | "textarea" | "select" | "switch" | "messages";
  defaultValue?: any;
  options?: { label: string; value: any }[];
  placeholder?: string;
  required?: boolean;
}

interface MessageSettings {
  maxMessages: number;
  enableAutoScroll: boolean;
  showTimestamp: boolean;
  enableMarkdown: boolean;
  codeHighlight: boolean;
  messageAnimation: boolean;
}

interface Props {
  config: ConfigItem;
  value: MessageSettings;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [value: MessageSettings];
}>();

// 本地值，用于实时更新
const localValue = ref<MessageSettings>({
  maxMessages: 50,
  enableAutoScroll: true,
  showTimestamp: true,
  enableMarkdown: true,
  codeHighlight: true,
  messageAnimation: true,
});

// 更新单个值
const updateValue = (key: keyof MessageSettings, value: any) => {
  localValue.value[key] = value;
  emit("update", { ...localValue.value });
};

// 监听外部值变化
watch(
  () => props.value,
  (newValue) => {
    if (newValue) {
      localValue.value = { ...newValue };
    }
  },
  { immediate: true, deep: true }
);

// 初始化默认值
onMounted(() => {
  if (props.value) {
    localValue.value = { ...props.value };
  } else if (props.config.defaultValue) {
    localValue.value = { ...props.config.defaultValue };
    emit("update", localValue.value);
  }
});
</script>
