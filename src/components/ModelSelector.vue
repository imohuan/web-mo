<template>
  <div class="relative">
    <!-- 选择器按钮 -->
    <button
      @click="toggleDropdown"
      class="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
    >
      <!-- 模型信息 -->
      <div class="flex-1 text-left">
        <div class="text-sm font-medium text-gray-900">{{ selectedModelInfo.label }}</div>
      </div>

      <!-- 下拉箭头 -->
      <div
        class="w-4 h-4 text-gray-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      >
        <ChevronDownIcon class="w-4 h-4" />
      </div>
    </button>

    <!-- 下拉菜单 -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute top-full left-0 mt-2 w-[300px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2"
      >
        <!-- 头部标题 -->
        <div class="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
          选择模型
        </div>

        <!-- 模型列表 -->
        <div class="max-h-80 overflow-y-auto">
          <div
            v-for="model in modelGroups"
            :key="model.value"
            @click="selectModel(model.value)"
            class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
            :class="{ 'bg-blue-50': props.modelValue === model.value }"
          >
            <div class="flex-1">
              <!-- 模型名称 -->
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900">{{ model.label }}</span>
              </div>
              <!-- 模型描述 -->
              <div class="text-xs text-gray-500 mt-1">{{ model.description }}</div>
            </div>

            <!-- 选中状态和升级按钮 -->
            <div class="flex items-center gap-2">
              <!-- 选中图标 -->
              <div v-if="props.modelValue === model.value" class="w-4 h-4 text-blue-500">
                <CheckIcon class="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 遮罩层 -->
    <div v-if="isOpen" @click="closeDropdown" class="fixed inset-0 z-40"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
// 导入 SVG 组件
import ChevronDownIcon from "@/assets/icons/chevron-down.svg?component";
import CheckIcon from "@/assets/icons/check.svg?component";

interface ModelOption {
  label: string;
  value: string;
  description: string;
}

interface Props {
  modelValue: string; // v-model 支持
  models?: ModelOption[];
}

interface Emits {
  (e: "update:modelValue", value: string): void; // v-model 支持
  (e: "model-change", value: string): void; // 保持向后兼容
}

const props = withDefaults(defineProps<Props>(), {
  models: () => [],
});

const emit = defineEmits<Emits>();

const isOpen = ref(false);

// 默认模型配置
const defaultModels: ModelOption[] = [
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

// 使用传入的models或默认models
const modelGroups = computed(() =>
  props.models.length > 0 ? props.models : defaultModels
);

// 获取当前选中模型的信息
const selectedModelInfo = computed(() => {
  const model = modelGroups.value.find((m) => m.value === props.modelValue);
  return (
    model ||
    modelGroups.value[0] || {
      label: "2.5 Flash",
      description: "快速提供分析的帮助",
      value: "gemini-2.5-flash",
    }
  );
});

// 切换下拉菜单
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// 关闭下拉菜单
const closeDropdown = () => {
  isOpen.value = false;
};

// 选择模型
const selectModel = (value: string) => {
  emit("update:modelValue", value); // v-model 支持
  emit("model-change", value); // 保持向后兼容
  closeDropdown();
};

// 处理升级
const handleUpgrade = () => {
  console.log("触发升级流程");
  // 这里可以添加升级逻辑
};

// ESC键关闭下拉菜单
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === "Escape" && isOpen.value) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscape);
});
</script>
