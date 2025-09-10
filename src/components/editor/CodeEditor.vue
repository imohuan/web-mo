<template>
  <div class="flex-1 p-4 pt-0 bg-gray-50 overflow-hidden">
    <div
      class="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden"
    >
      <!-- 编辑器头部工具栏 -->
      <EditorHeader
        :title="title"
        :is-preview-mode="isPreviewMode"
        :current-code="currentCode"
        :can-undo="canUndo"
        :can-redo="canRedo"
        :history="history"
        :current-history-index="currentHistoryIndex"
        @toggle-preview="$emit('toggle-preview')"
        @undo="$emit('undo')"
        @redo="$emit('redo')"
        @history="$emit('history')"
        @history-select="$emit('history-select', $event)"
        @refresh="refreshPreview"
      />

      <!-- 编辑器内容 -->
      <div class="flex-1 relative">
        <!-- Monaco编辑器 (始终存在，保持diff模式状态) -->
        <div class="h-full">
          <MonacoEditor
            ref="editorRef"
            :value="currentCode"
            :addToHistory="props.addToHistory"
            @update:value="handleCodeUpdate"
            class="h-full"
          />
        </div>

        <!-- HTML预览覆盖层 -->
        <div v-if="isPreviewMode" class="absolute inset-0 z-5 bg-white">
          <iframe
            ref="previewFrame"
            class="w-full h-full border-0"
            :srcdoc="currentCode"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import MonacoEditor from "./MonacoEditor/MonacoEditor.vue";
import EditorHeader from "./EditorHeader.vue";

interface HistoryItem {
  code: string;
  timestamp: number;
  title?: string;
}

interface Props {
  title: string;
  currentCode: string;
  isPreviewMode: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  history?: HistoryItem[];
  currentHistoryIndex?: number;
  addToHistory?: (code: string, title?: string) => void;
}

interface Emits {
  (e: "update:currentCode", value: string): void;
  (e: "toggle-preview"): void;
  (e: "undo"): void;
  (e: "redo"): void;
  (e: "history"): void;
  (e: "history-select", index: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editorRef = ref();
const previewFrame = ref();

// 处理代码更新
const handleCodeUpdate = (newCode: string) => {
  emit("update:currentCode", newCode);
};

// 刷新预览
const refreshPreview = () => {
  if (previewFrame.value) {
    // 通过重新设置srcdoc来刷新iframe
    const currentSrc = previewFrame.value.getAttribute("srcdoc");
    previewFrame.value.setAttribute("srcdoc", "");
    setTimeout(() => {
      if (previewFrame.value) {
        previewFrame.value.setAttribute("srcdoc", currentSrc || "");
      }
    }, 100);
  }
};

// 暴露编辑器引用给父组件
defineExpose({
  editorRef,
});

onMounted(() => {
  if (editorRef.value) {
    // editorRef.value.openDiffInput();
    //     editorRef.value.applyDiff(`------- SEARCH
    // <head>
    // =======
    // <head test="123">
    // +++++++ REPLACE`);
  }
});
</script>
