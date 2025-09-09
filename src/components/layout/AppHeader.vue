<template>
  <header class="px-6 py-4 flex items-center justify-between z-10">
    <!-- 左侧：模型选择器 -->
    <ModelSelector
      v-model="selectedModel"
      :models="availableModels"
      @model-change="$emit('model-change', $event)"
    />

    <!-- 右侧：全局操作按钮 -->
    <div class="flex items-center gap-2">
      <!-- 设置按钮 -->
      <button
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        title="设置"
      >
        <SettingsIcon class="w-5 h-5 text-gray-600" />
      </button>

      <!-- 帮助按钮 -->
      <button
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        title="帮助"
      >
        <HelpIcon class="w-5 h-5 text-gray-600" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ModelSelector from "../ModelSelector.vue";
// 导入 SVG 组件
import SettingsIcon from '@/assets/icons/settings.svg?component';
import HelpIcon from '@/assets/icons/help.svg?component';

interface Props {
  title: string;
  selectedModel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "AI Chat & Code Editor",
  selectedModel: "gemini-2.5-flash",
});

// v-model 支持
const selectedModel = ref(props.selectedModel);

interface ModelOption {
  label: string;
  value: string;
  description: string;
}

// 可用模型列表
const availableModels: ModelOption[] = [
  {
    label: "2.5 Flash",
    value: "gemini-2.5-flash",
    description: "快速提供分析的帮助",
  },
  {
    label: "2.5 Pro",
    value: "gemini-2.5-pro",
    description: "推理、数学和编程",
  },
];

// 计算当前选择模型的标签
const selectedModelLabel = computed(() => {
  const model = availableModels.find((m) => m.value === props.selectedModel);
  return model ? model.label : "Gemini 2.5 Flash";
});
</script>
