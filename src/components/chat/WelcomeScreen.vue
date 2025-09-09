<template>
  <div class="w-full h-10/12 flex items-center justify-center">
    <div class="text-center py-12">
      <div
        class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <ChatIcon class="w-8 h-8 text-blue-500" />
      </div>
      <h3 class="text-lg font-medium text-gray-800 mb-2">欢迎使用AI代码编辑器</h3>
      <p class="text-gray-600">您可以在下方输入框中描述您的需求，AI将为您生成代码</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入 SVG 组件
import ChatIcon from '@/assets/icons/chat.svg?component';
// 无需props和emits，纯展示组件
</script>
