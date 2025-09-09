<template>
  <div
    class="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between rounded-t-xl"
  >
    <!-- 左侧标题和操作 -->
    <div class="flex items-center gap-4 min-w-0 flex-1">
      <!-- Logo和标题 -->
      <div class="flex items-center gap-3 min-w-0">
        <AppLogo size="large" />
        <h3
          class="text-lg font-semibold text-gray-800 truncate max-w-48 sm:max-w-64 md:max-w-80"
          :title="displayTitle"
        >
          {{ displayTitle }}
        </h3>
      </div>

      <!-- 分隔线 -->
      <div class="w-px h-6 bg-gray-200 flex-shrink-0"></div>

      <!-- 操作按钮组 -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <!-- 历史记录选择器 -->
        <HistorySelector
          :history="history"
          :current-index="currentHistoryIndex"
          @select="handleHistorySelect"
        />

        <!-- 撤销按钮 -->
        <button
          @click="$emit('undo')"
          :disabled="!canUndo"
          :class="[
            'p-2 rounded-lg transition-colors',
            canUndo
              ? 'hover:bg-gray-100 text-gray-600'
              : 'text-gray-300 cursor-not-allowed',
          ]"
          title="撤销 (Ctrl+Z)"
        >
          <UndoIcon class="w-4 h-4" />
        </button>

        <!-- 恢复按钮 -->
        <button
          @click="$emit('redo')"
          :disabled="!canRedo"
          :class="[
            'p-2 rounded-lg transition-colors',
            canRedo
              ? 'hover:bg-gray-100 text-gray-600'
              : 'text-gray-300 cursor-not-allowed',
          ]"
          title="恢复 (Ctrl+Y)"
        >
          <RedoIcon class="w-4 h-4" />
        </button>

        <!-- 刷新按钮（仅预览模式显示） -->
        <button
          v-if="isPreviewMode"
          @click="$emit('refresh')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          title="刷新预览 (F5)"
        >
          <RefreshIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 右侧代码/预览切换 -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <!-- 代码按钮 -->
      <button
        @click="toggleToCode"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
          !isPreviewMode
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
        ]"
      >
        <CodeIcon class="w-4 h-4" />
        代码
      </button>

      <!-- 预览按钮 -->
      <button
        @click="toggleToPreview"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
          isPreviewMode
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
        ]"
        :disabled="!isHtmlContent"
        :title="!isHtmlContent ? '只有HTML内容才能预览' : '预览HTML'"
      >
        <PreviewIcon class="w-4 h-4" />
        预览
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppLogo from "../AppLogo.vue";
import HistorySelector from "./HistorySelector.vue";
// 导入 SVG 组件
import UndoIcon from "@/assets/icons/undo.svg?component";
import RedoIcon from "@/assets/icons/redo.svg?component";
import RefreshIcon from "@/assets/icons/refresh.svg?component";
import CodeIcon from "@/assets/icons/code.svg?component";
import PreviewIcon from "@/assets/icons/preview.svg?component";

interface HistoryItem {
  code: string;
  timestamp: number;
  title?: string;
}

interface Props {
  title: string;
  isPreviewMode: boolean;
  currentCode?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  history?: HistoryItem[];
  currentHistoryIndex?: number;
}

interface Emits {
  (e: "toggle-preview"): void;
  (e: "undo"): void;
  (e: "redo"): void;
  (e: "history"): void;
  (e: "refresh"): void;
  (e: "history-select", index: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  currentCode: "",
  canUndo: false,
  canRedo: false,
  history: () => [],
  currentHistoryIndex: 0,
});

const emit = defineEmits<Emits>();

// 计算属性：检查是否为HTML内容
const isHtmlContent = computed(() => {
  const code = props.currentCode?.toLowerCase() || "";
  return code.includes("<html") || code.includes("<!doctype html");
});

// 计算属性：显示标题
const displayTitle = computed(() => {
  let title = "";

  // 如果有历史记录且当前索引有效，使用历史记录中的标题
  if (
    props.history &&
    props.history.length > 0 &&
    props.currentHistoryIndex !== undefined
  ) {
    const currentHistoryItem = props.history[props.currentHistoryIndex];
    if (currentHistoryItem && currentHistoryItem.title) {
      title = currentHistoryItem.title;
    }
  } else {
    // 否则使用传入的 title 属性
    title = props.title;
  }

  // 限制标题长度，避免UI变形
  if (title.length > 20) {
    return title.substring(0, 20) + "...";
  }

  return title;
});

// 方法
const toggleToCode = () => {
  if (props.isPreviewMode) {
    emit("toggle-preview");
  }
};

const toggleToPreview = () => {
  if (!props.isPreviewMode && isHtmlContent.value) {
    emit("toggle-preview");
  }
};

// 处理历史记录选择
const handleHistorySelect = (index: number) => {
  emit("history-select", index);
};
</script>

<style scoped>
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:disabled:hover {
  background-color: transparent !important;
  color: currentColor !important;
}
</style>
