<template>
  <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-900">预设提示词</h4>
      <button
        @click="addPrompt"
        class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        添加提示词
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="(prompt, index) in localValue"
        :key="index"
        class="bg-white p-4 rounded-lg border border-gray-200"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <select
              :value="prompt.role"
              @change="updatePrompt(index, 'role', ($event.target as HTMLSelectElement).value)"
              class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
            <!-- 启用按钮移到这里 -->
            <span class="pl-2 text-xs">启用</span>
            <button
              @click="updatePrompt(index, 'enabled', !prompt.enabled)"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                prompt.enabled ? 'bg-blue-600' : 'bg-gray-200',
              ]"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  prompt.enabled ? 'translate-x-5' : 'translate-x-0',
                ]"
              ></span>
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="movePrompt(index, -1)"
              :disabled="index === 0"
              class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="上移"
            >
              <UpIcon class="w-4 h-4" />
            </button>
            <button
              @click="movePrompt(index, 1)"
              :disabled="index === localValue.length - 1"
              class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="下移"
            >
              <ChevronDownIcon class="w-4 h-4" />
            </button>
            <button
              @click="removePrompt(index)"
              class="p-1 text-red-400 hover:text-red-600"
              title="删除"
            >
              <CloseIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              提示词内容
            </label>
            <textarea
              :value="prompt.content"
              @input="updatePrompt(index, 'content', ($event.target as HTMLTextAreaElement).value)"
              placeholder="输入提示词内容..."
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="localValue.length === 0" class="text-center py-8 text-gray-500">
        <ChatIcon class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-sm">暂无预设提示词</p>
        <p class="text-xs text-gray-400 mt-1">点击"添加提示词"按钮开始配置</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
// 导入 SVG 组件
import UpIcon from "@/assets/icons/up.svg?component";
import ChevronDownIcon from "@/assets/icons/chevron-down.svg?component";
import CloseIcon from "@/assets/icons/close.svg?component";
import ChatIcon from "@/assets/icons/chat.svg?component";

interface ConfigItem {
  key: string;
  title: string;
  description?: string;
  type: string;
  defaultValue?: any;
}

interface PromptItem {
  role: "system" | "user" | "assistant";
  content: string;
  enabled: boolean;
}

interface Props {
  config: ConfigItem;
  value: PromptItem[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [value: PromptItem[]];
}>();

// 本地值，用于实时更新
const localValue = ref<PromptItem[]>([]);

// 添加新提示词
const addPrompt = () => {
  const newPrompt: PromptItem = {
    role: "system",
    content: "",
    enabled: true,
  };
  localValue.value.push(newPrompt);
  emit("update", [...localValue.value]);
};

// 更新提示词
const updatePrompt = (index: number, field: keyof PromptItem, value: any) => {
  if (localValue.value[index]) {
    (localValue.value[index] as any)[field] = value;
    emit("update", [...localValue.value]);
  }
};

// 删除提示词
const removePrompt = (index: number) => {
  if (confirm("确定要删除这个提示词吗？")) {
    localValue.value.splice(index, 1);
    emit("update", [...localValue.value]);
  }
};

// 移动提示词位置
const movePrompt = (index: number, direction: number) => {
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < localValue.value.length) {
    const item = localValue.value.splice(index, 1)[0];
    localValue.value.splice(newIndex, 0, item);
    emit("update", [...localValue.value]);
  }
};

// 监听外部值变化
watch(
  () => props.value,
  (newValue) => {
    if (newValue && Array.isArray(newValue)) {
      localValue.value = [...newValue];
    }
  },
  { immediate: true, deep: true }
);

// 初始化默认值
onMounted(() => {
  if (props.value && Array.isArray(props.value)) {
    localValue.value = [...props.value];
  } else if (props.config.defaultValue && Array.isArray(props.config.defaultValue)) {
    localValue.value = [...props.config.defaultValue];
    emit("update", localValue.value);
  }
});
</script>
