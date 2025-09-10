<template>
  <div class="space-y-2">
    <!-- 输入框类型 -->
    <div v-if="config.type === 'input'" class="space-y-2">
      <div class="relative">
        <input
          :type="isPasswordField && !showPassword ? 'password' : 'text'"
          :value="value"
          @input="$emit('update', ($event.target as HTMLInputElement).value)"
          :placeholder="config.placeholder"
          :required="config.required"
          :class="[
            'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            isPasswordField ? 'pr-10' : '',
          ]"
        />
        <!-- 密码显示/隐藏按钮 -->
        <button
          v-if="isPasswordField"
          type="button"
          @click="showPassword = !showPassword"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg
            v-if="showPassword"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
            />
          </svg>
          <svg
            v-else
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 文本域类型 -->
    <div v-else-if="config.type === 'textarea'" class="space-y-2">
      <textarea
        :value="value"
        @input="$emit('update', ($event.target as HTMLTextAreaElement).value)"
        :placeholder="config.placeholder"
        :required="config.required"
        rows="4"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
    </div>

    <!-- 选择框类型 -->
    <div v-else-if="config.type === 'select'" class="space-y-2">
      <select
        :value="value"
        @change="$emit('update', ($event.target as HTMLSelectElement).value)"
        :required="config.required"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option
          v-for="option in config.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- 开关类型 -->
    <div v-else-if="config.type === 'switch'" class="flex items-center justify-end">
      <button
        @click="$emit('update', !value)"
        :class="[
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          value ? 'bg-blue-600' : 'bg-gray-200',
        ]"
      >
        <span
          :class="[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            value ? 'translate-x-5' : 'translate-x-0',
          ]"
        ></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

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

interface Props {
  config: ConfigItem;
  value: any;
}

const props = defineProps<Props>();

defineEmits<{
  update: [value: any];
}>();

// 密码显示状态
const showPassword = ref(false);

// 判断是否为密码字段
const isPasswordField = computed(() => {
  return (
    props.config.key.toLowerCase().includes("key") ||
    props.config.key.toLowerCase().includes("password")
  );
});
</script>
