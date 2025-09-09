<template>
  <div class="relative">
    <!-- 历史记录按钮 -->
    <button
      @click="toggleDropdown"
      class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 flex items-center gap-2"
      title="历史记录"
    >
      <HistoryIcon class="w-4 h-4" />
      <span class="text-sm font-medium">v{{ currentVersion }}</span>
      <ChevronDownIcon class="w-3 h-3" />
    </button>

    <!-- 透明蒙版 -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="closeDropdown"></div>

    <!-- 下拉菜单 -->
    <div
      v-if="isOpen"
      class="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      <div class="p-3 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-800">代码历史记录</h3>
        <p class="text-xs text-gray-500 mt-1">选择要恢复的版本</p>
      </div>

      <div class="py-2">
        <div
          v-for="(item, index) in historyItems"
          :key="index"
          @click="selectHistoryItem(index)"
          :class="[
            'px-3 py-3 cursor-pointer transition-colors border-l-2',
            index === currentIndex
              ? 'bg-blue-50 border-blue-500'
              : 'hover:bg-gray-50 border-transparent',
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium text-gray-800">v{{ index + 1 }}</span>
                <span class="text-xs text-gray-500">{{
                  formatTime(item.timestamp)
                }}</span>
                <span
                  v-if="index === currentIndex"
                  class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full"
                >
                  当前
                </span>
              </div>
              <div class="text-xs text-gray-600 mb-2">
                {{ item.title || generateTitle(item.code) }}
              </div>
              <div
                class="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border max-h-16 overflow-hidden"
              >
                {{ getCodePreview(item.code) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-3 border-t border-gray-100 bg-gray-50">
        <div class="text-xs text-gray-500">共 {{ historyItems.length }} 个版本</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import HistoryIcon from "@/assets/icons/history.svg?component";
import ChevronDownIcon from "@/assets/icons/chevron-down.svg?component";

interface HistoryItem {
  code: string;
  timestamp: number;
  title?: string;
}

interface Props {
  history: HistoryItem[];
  currentIndex: number;
}

interface Emits {
  (e: "select", index: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = ref(false);

// 计算属性
const currentVersion = computed(() => props.currentIndex + 1);
const historyItems = computed(() => props.history);

// 方法
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectHistoryItem = (index: number) => {
  emit("select", index);
  isOpen.value = false;
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  // 如果是今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 如果是昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return (
      "昨天 " +
      date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }

  // 其他情况显示日期
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateTitle = (code: string) => {
  // 尝试从HTML中提取标题
  const titleMatch = code.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }

  // 尝试从h1标签中提取标题
  const h1Match = code.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }

  // 默认标题
  return "代码版本";
};

const getCodePreview = (code: string) => {
  // 移除HTML标签，只保留文本内容
  const textContent = code
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 限制长度
  if (textContent.length > 100) {
    return textContent.substring(0, 100) + "...";
  }

  return textContent || "空内容";
};

// 监听 ESC 键关闭下拉菜单
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && isOpen.value) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
