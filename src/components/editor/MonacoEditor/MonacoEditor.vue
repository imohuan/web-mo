<template>
  <div class="monaco-editor-wrapper h-full flex flex-col">
    <!-- 工具栏 -->
    <div class="hidden toolbar p-2 border-b flex items-center gap-2">
      <select
        v-model="fileId"
        class="px-2 py-1 border rounded text-sm"
        @change="handleFileSwitch"
      >
        <option v-for="file in files" :key="file.id" :value="file.id">
          {{ file.name }}
        </option>
      </select>

      <button
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        @click="formatCurrentDocument"
      >
        格式化
      </button>

      <button
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        @click="openDiffInput"
      >
        差异模式开启
      </button>

      <button
        v-if="isDiffMode"
        class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        @click="acceptAllChanges"
      >
        接受所有更改
      </button>

      <span v-if="isDiffMode" class="text-sm text-orange-600 ml-2"> 差异对比模式 </span>
    </div>

    <!-- 差异输入区域 -->
    <div v-if="showDiffInput" class="diff-input-area p-2 border-b">
      <div class="flex gap-2 items-center mb-2">
        <label class="text-sm font-medium">差异内容：</label>
        <button
          class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          @click="applyCurrentDiff"
        >
          应用差异
        </button>
        <button
          class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
          @click="closeDiffInput"
        >
          关闭
        </button>
      </div>
      <textarea
        v-model="diffInput"
        class="w-full h-40 p-2 border rounded text-sm font-mono"
        placeholder="------- SEARCH
搜索内容
=======
替换内容
+++++++ REPLACE"
      />
    </div>

    <!-- 编辑器容器 -->
    <div class="flex-1 relative">
      <div ref="editorContainer" class="w-full h-full bg-gray-400" />

      <!-- 底部差异导航器 -->
      <DiffBottomNavigation
        v-if="isDiffMode && allChanges.length > 0"
        :currentIndex="currentChangeIndex"
        :totalChanges="allChanges.length"
        @previous="navigateToPreviousChange"
        @next="navigateToNextChange"
        @acceptAll="acceptAllChanges"
        @undoAll="undoAllChanges"
        @close="closeDiffMode"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { registerAll } from "./src/monaco-init";
import { registerFormatProviders } from "./src/formatter";
import { registerFoldingRangeProvider } from "./src/providers";
import { useMonacoEditor } from "./src/useMonacoEditor";
import { DEFAULT_CODE } from "@/constants/config";
import DiffBottomNavigation from "./src/DiffBottomNavigation.vue";

interface MonacoEditorProps {
  value?: string;
  height?: string | number;
  readonly?: boolean;
}

interface MonacoEditorEmits {
  (e: "update:value", value: string): void;
}

const props = withDefaults(defineProps<MonacoEditorProps>(), {
  height: "100%",
  readonly: false,
});

const emit = defineEmits<MonacoEditorEmits>();

const editorContainer = ref<HTMLElement>();
const diffInput = ref("");
const showDiffInput = ref(false);

const {
  container,
  files,
  fileId,
  currentFile,
  editor,
  diffEditor,
  isDiffMode,
  currentChangeIndex,
  allChanges,
  formatCurrentDocument,
  createNormalEditor,
  applyDiff,
  acceptAllChanges,
  navigateToPreviousChange,
  navigateToNextChange,
  switchFile,
  setContent,
  getContent,
} = useMonacoEditor({
  files: [
    { id: 1, name: "settings.json", language: "json", content: "{}" },
    {
      id: 2,
      name: "index.html",
      language: "html",
      content: props.value || DEFAULT_CODE,
    },
  ],
  onChange: (content: string) => {
    emit("update:value", content);
  },
});

// 初始化
onMounted(() => {
  registerAll();
  registerFormatProviders();
  registerFoldingRangeProvider();

  container.value = editorContainer.value;
  createNormalEditor();
  // 设置默认内容
  // if (props.value && props.value !== currentFile.value?.content) {
  //   setContent(props.value);
  // }
});

// 监听外部内容变化：委托给 setContent 处理防循环逻辑
watch(
  () => props.value,
  (newValue) => {
    if (typeof newValue === "string") {
      setContent(newValue);
    }
  }
);

// 文件切换处理
const handleFileSwitch = () => {
  switchFile(fileId.value);
};

// 差异功能
const openDiffInput = () => {
  showDiffInput.value = true;
};

const closeDiffInput = () => {
  showDiffInput.value = false;
  diffInput.value = "";
};

const applyCurrentDiff = async () => {
  if (!diffInput.value.trim()) {
    // 如果没有输入内容，使用测试示例演示多区域替换功能
    const multiDiffValue = `------- SEARCH
  <title>示例页面</title>
=======
  <title>测试页面 - 已修改</title>
  <meta charset="UTF-8">
+++++++ REPLACE

------- SEARCH
  <h1>欢迎使用AI代码编辑器</h1>
=======
  <h1>欢迎来到新页面</h1>
  <p>这是一个已更新的测试页面</p>
  <footer>© 2024</footer>
+++++++ REPLACE`;
    try {
      await applyDiff(multiDiffValue);
      closeDiffInput();
    } catch (error) {
      console.error("应用差异失败:", error);
    }
    return;
  }

  try {
    await applyDiff(diffInput.value);
    closeDiffInput();
  } catch (error) {
    console.error("应用差异失败:", error);
  }
};

// 撤销所有更改
const undoAllChanges = () => {
  // 重置到原始状态，不接受任何更改
  if (isDiffMode && diffEditor.value) {
    const originalModel = diffEditor.value.getOriginalEditor().getModel();
    if (originalModel) {
      // 将修改后的内容重置为原始内容
      const modifiedModel = diffEditor.value.getModifiedEditor().getModel();
      if (modifiedModel) {
        modifiedModel.setValue(originalModel.getValue());
      }
    }
  }
};

// 关闭差异模式
const closeDiffMode = () => {
  if (editor.value && diffEditor.value) {
    const finalCode = diffEditor.value.getModifiedEditor().getModel()?.getValue() || '';
    console.log("发送差异模式结束事件，最终代码:", finalCode);
    // 触发自定义事件，通知父组件差异模式已结束
    const event = new CustomEvent('diffModeEnded', {
      detail: { finalCode }
    });
    window.dispatchEvent(event);
  }
  acceptAllChanges();
  showDiffInput.value = false;
};

// 暴露方法
defineExpose({
  setValue: setContent,
  addValue: (code: string) => {
    const currentContent = getContent();
    setContent(currentContent + code);
  },
  getValue: getContent,
  openDiffInput,
  applyDiff,
  formatDocument: formatCurrentDocument,
});
</script>

<style scoped>
@import "monaco-editor/min/vs/editor/editor.main.css";

.monaco-editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.diff-input-area {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.textarea:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}
</style>
