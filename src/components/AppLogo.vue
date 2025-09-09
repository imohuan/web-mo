<template>
  <div :class="logoClasses">
    <!-- AI Chat & Code Editor Logo -->
    <div class="relative">
      <!-- 主图标 -->
      <div
        class="flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm"
      >
        <CodeIcon :class="iconClasses" />
      </div>

      <!-- AI装饰小图标 -->
      <div
        v-if="size !== 'small'"
        class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center"
      >
        <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
// 导入 SVG 组件
import CodeIcon from "@/assets/icons/code.svg?component";

interface Props {
  size?: "small" | "medium" | "large";
}

const props = withDefaults(defineProps<Props>(), {
  size: "medium",
});

// 计算Logo容器样式
const logoClasses = computed(() => {
  const sizes = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };
  return `${sizes[props.size]} flex items-center justify-center`;
});

// 计算图标样式
const iconClasses = computed(() => {
  const iconSizes = {
    small: "w-3 h-3",
    medium: "w-4 h-4",
    large: "w-6 h-6",
  };
  return `${iconSizes[props.size]} text-white`;
});
</script>
