<template>
  <div class="relative">
    <!-- 输入框容器 -->
    <div class="bg-white border border-gray-300 rounded-xl shadow-sm">
      <!-- 图片预览区域 -->
      <div v-if="images.length > 0" class="p-4 border-b border-gray-200">
        <div class="flex flex-wrap gap-3">
          <div v-for="(image, index) in images" :key="index" class="relative group">
            <img
              :src="image"
              alt="上传的图片"
              class="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
            <button
              @click="removeImage(index)"
              class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>

      <!-- 主输入区域 -->
      <div class="flex flex-col p-4 gap-3">
        <!-- 文本输入框 -->
        <div class="flex-1">
          <textarea
            ref="textareaRef"
            v-model="message"
            @keydown="handleKeydown"
            @paste="handlePaste"
            @input="adjustHeight"
            :disabled="disabled"
            placeholder="有什么可以帮您的？"
            class="w-full resize-none border-0 outline-none placeholder-gray-400 text-gray-900 text-base leading-6"
            rows="1"
            style="max-height: 200px"
          ></textarea>
        </div>

        <!-- 底部按钮组 -->
        <div class="flex items-center gap-2">
          <!-- 上传图片按钮 -->
          <label
            class="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <ImageIcon class="w-5 h-5 text-gray-500" />
            <input
              type="file"
              @change="handleFileUpload"
              accept="image/*"
              multiple
              class="hidden"
            />
          </label>

          <!-- 发送按钮 -->
          <button
            @click="sendMessage"
            :disabled="disabled || (!message.trim() && images.length === 0)"
            :class="[
              'p-2 rounded-lg transition-all duration-200',
              disabled || (!message.trim() && images.length === 0)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm',
            ]"
          >
            <SendIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- 提示文本 -->
    <div class="mt-2 text-xs text-gray-500 text-center">
      按 Ctrl+Enter 发送消息，支持直接粘贴图片
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
// 导入 SVG 组件
import ImageIcon from "@/assets/icons/image.svg?component";
import SendIcon from "@/assets/icons/send.svg?component";
import CloseIcon from "@/assets/icons/close.svg?component";

interface Props {
  disabled?: boolean;
}

interface Emits {
  (e: "send", data: { message: string; images: string[] }): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

// 响应式数据
const message = ref("");
const images = ref<string[]>([]);
const textareaRef = ref<HTMLTextAreaElement>();

// 方法
const adjustHeight = () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = "auto";
      textareaRef.value.style.height = textareaRef.value.scrollHeight + "px";
    }
  });
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
};

const sendMessage = () => {
  if (props.disabled || (!message.value.trim() && images.value.length === 0)) {
    return;
  }

  emit("send", {
    message: message.value.trim(),
    images: [...images.value],
  });

  // 清空输入
  message.value = "";
  images.value = [];

  // 重置输入框高度
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = "auto";
    }
  });
};

const handlePaste = async (event: ClipboardEvent) => {
  if (!event.clipboardData) return;

  const items = event.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        const base64 = await convertToBase64(file);
        if (base64) {
          images.value.push(base64);
        }
      }
    }
  }
};

const handleFileUpload = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;

  for (let i = 0; i < files.length; i++) {
    const base64 = await convertToBase64(files[i]);
    if (base64) {
      images.value.push(base64);
    }
  }

  // 重置input
  (event.target as HTMLInputElement).value = "";
};

const convertToBase64 = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

const removeImage = (index: number) => {
  images.value.splice(index, 1);
};
</script>

<style scoped>
/* 自定义滚动条样式 */
textarea::-webkit-scrollbar {
  width: 4px;
}

textarea::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
