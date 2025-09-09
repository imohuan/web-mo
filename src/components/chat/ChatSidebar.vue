<template>
  <div
    :class="[
      'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col truncate',
      collapsed ? 'w-18' : 'w-[280px]',
    ]"
  >
    <!-- 侧边栏头部 -->
    <div
      :class="[
        'p-4 border-b border-gray-200 flex items-center',
        collapsed ? 'justify-center' : 'justify-between',
      ]"
    >
      <button
        @click="$emit('toggle')"
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            :d="collapsed ? 'M4 6h16M4 12h16M4 18h16' : 'M6 18L18 6M6 6l12 12'"
          ></path>
        </svg>
      </button>

      <h1 v-if="!collapsed" class="text-lg font-semibold text-gray-800">Gemini</h1>
    </div>

    <!-- 新对话按钮 -->
    <div class="p-4 flex items-center justify-center">
      <button
        @click="$emit('new-chat')"
        :class="[
          'py-2  bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2',
          collapsed ? 'w-8 h-8' : 'w-full px-4',
        ]"
        :title="collapsed ? '新建对话' : ''"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        <span v-if="!collapsed">新对话</span>
      </button>
    </div>
    <div v-if="!collapsed" class="flex-1 overflow-y-auto">
      <div class="px-4 py-2">
        <h3 class="text-sm font-medium text-gray-500 mb-2">近期对话</h3>

        <!-- 对话列表 -->
        <div class="space-y-1">
          <div
            v-for="chat in chatHistory"
            :key="chat.id"
            @click="$emit('select-chat', chat.id)"
            :class="[
              'p-2 rounded-lg cursor-pointer transition-colors truncate text-sm relative group flex items-center justify-between',
              currentChatId === chat.id
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100 text-gray-700',
            ]"
          >
            <span class="truncate">{{ chat.title || "新对话" }}</span>
            <button
              v-if="chat.id !== -1"
              @click.stop="$emit('delete-chat', chat.id)"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 hidden group-hover:block flex-shrink-0"
              title="删除对话"
            >
              <svg
                class="w-4 h-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 侧边栏底部 -->
    <div v-if="!collapsed" class="p-4 border-t border-gray-200">
      <div class="text-xs text-gray-500">Gemini 2.5 Pro</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatSession } from "@/composables/useChat";

interface Props {
  collapsed: boolean;
  chatHistory: ChatSession[];
  currentChatId: number | null;
}

interface Emits {
  (e: "toggle"): void;
  (e: "new-chat"): void;
  (e: "select-chat", chatId: number): void;
  (e: "delete-chat", chatId: number): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>
