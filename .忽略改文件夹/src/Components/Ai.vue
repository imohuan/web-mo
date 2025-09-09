<template>
  <div class="bg-white h-full overflow-y-auto p-6 pt-0">
    <div class="space-y-4">
      <!-- API 配置 -->
      <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">API 配置</h2>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label for="apiName" class="block text-sm font-medium text-gray-700 mb-1">预设名称:</label>
            <input type="text" id="apiName" v-model="chatOption.name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label for="apiUrl" class="block text-sm font-medium text-gray-700 mb-1">API URL:</label>
            <input type="text" id="apiUrl" v-model="chatOption.url"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.openai.com/v1/chat/completions">
          </div>
          <div>
            <label for="apiToken" class="block text-sm font-medium text-gray-700 mb-1">API Token:</label>
            <input type="password" id="apiToken" v-model="chatOption.token"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="sk-...">
          </div>
        </div>
      </div>

      <!-- 模型配置 -->
      <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">模型配置</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="model" class="block text-sm font-medium text-gray-700 mb-1">模型:</label>
            <input type="text" id="model" v-model="chatOption.model"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="gpt-3.5-turbo">
            <!-- <a-select placeholder="Please select ..." :loading="false" allow-create v-model="chatOption.model"
              @search="handleSearchModel" :filter-option="true">
              <a-option v-for="model in models" :key="model.id" :value="model.id">{{ model.id }}</a-option>
            </a-select> -->
          </div>
          <div>
            <label for="temperature" class="block text-sm font-medium text-gray-700 mb-1">
              温度 ({{ chatOption.temperature }}):
            </label>
            <a-slider :default-value="50" v-model="chatOption.temperature" :min="0" :max="2" :step="0.1" />
            <!-- <input type="range" id="temperature" v-model="chatOption.temperature" min="0" max="2" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"> -->
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label for="model" class="block text-sm font-medium text-gray-700 mb-1">最大 Token (max_token):</label>
            <input type="number" id="model" v-model="chatOption.max_tokens"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="8192">
          </div>
        </div>
      </div>

      <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">预设提示词</h2>

        <div class="flex flex-col gap-2">
          <div v-for="(message, index) in chatOption.messages" :key="index + message.role" class="flex flex-col gap-2">
            <div class="flex justify-between gap-2">
              <a-select :style="{ width: '160px' }" placeholder="Select" :trigger-props="{ autoFitPopupMinWidth: true }"
                v-model="message.role">
                <a-option>system</a-option>
                <a-option>user</a-option>
                <a-option>assistant</a-option>
              </a-select>
              <button @click="removeMessage(index)"
                class="text-red-500 hover:text-red-700 transition-colors duration-200 px-2 rounded-md">
                删除消息
              </button>
            </div>
            <textarea v-model="message.content as string" rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入您的提示词..."></textarea>
          </div>
        </div>

        <button @click="addMessage('system', '')"
          class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
          添加消息
        </button>

      </div>


      <!-- 提示词输入 -->
      <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 ">
        <h2 class="text-lg font-semibold text-gray-700 mb-3 relative">用户提示词
          <span class="absolute bottom-0 right-0 text-sm text-gray-400 font-mono">输入框支持图片粘贴</span>
        </h2>

        <textarea v-model="chatOption.prompt" rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
          placeholder="输入您的提示词..." @paste="handlePaste">
        </textarea>

        <!-- 图片上传 -->
        <div class="mt-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">添加图片:</label>
          <div class="flex items-center space-x-2">
            <label
              class="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer">
              <i class="fas fa-upload mr-2"></i>
              选择图片
              <input type="file" @change="handleImageUpload" accept="image/*" multiple class="hidden">
            </label>
            <span v-if="imageLoading" class="text-sm text-gray-500">
              <i class="fas fa-spinner fa-spin mr-1"></i>
              处理中...
            </span>
          </div>
        </div>

        <!-- 图片预览区域 -->
        <div v-if="images.length > 0" class="mt-3 flex flex-wrap gap-2">
          <a-image-preview-group infinite>
            <div v-for="(img, index) in images" :key="index"
              class="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden group">
              <a-image fit="cover" class="w-full h-full" :src="img.url" />
              <button @click="removeImage(index)"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Close class="w-4 h-4 text-white" />
              </button>
            </div>
          </a-image-preview-group>
        </div>
      </div>

      <!-- 其他配置 -->
      <!-- <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">输出配置</h2>
        <div class="flex gap-10">
          <div class="flex flex-col items-center gap-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">流式输出</label>
            <a-switch v-model="chatOption.stream" />
          </div>
          <div class="flex flex-col items-center gap-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Markdown 渲染</label>
            <a-switch v-model="chatOption.renderMarkdown" />
          </div>
        </div>
      </div> -->

      <!-- 操作按钮 -->
      <div class="flex justify-between items-center">
        <button @click="sendRequest"
          class="px-5 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
          :disabled="isLoading">
          <span v-if="isLoading">处理中...</span>
          <span v-else>发送请求</span>
        </button>

        <div class="flex gap-2">
          <button @click="handleSavePreset"
            class="px-5 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center">
            <span>预设保存</span>
          </button>

          <a-popover title="预设列表" trigger="click">
            <button
              class="px-5 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center">
              <span>加载预设</span>
            </button>
            <template #content>
              <div v-if="presets.length === 0" class="text-gray-400">当前没有预设列表</div>
              <div class="group py-1 min-w-50 hover:bg-slate-200 active:bg-slate-300 px-3 flex justify-between"
                v-for="(preset, index) in presets" :key="preset.name" @click="handleSelectPreset(preset)">
                <div class="flex-1 w-full truncate">{{ preset.name }}</div>
                <button @click="removePreset(index)"
                  class="text-red-500  bg-white w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Close class="w-4 h-4" />
                </button>
              </div>
            </template>
          </a-popover>
        </div>
      </div>

      <!-- 响应区域 -->
      <!-- <div v-if="response || isLoading" class="mt-6 markdown-body">
        <h2 class="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <i class="fas fa-comment-dots mr-2 text-green-500"></i>
          响应结果
          <span v-if="isLoading" class="ml-2 text-sm font-normal text-gray-500">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
        </h2>
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-96" style="min-height: 100px;">
          <div v-if="renderMarkdown" v-html="renderedResponse" class="prose max-w-none"></div>
          <pre v-else class="whitespace-pre-wrap">{{ response }}</pre>
        </div>
      </div> -->
    </div>
  </div>

</template>


<script setup lang="ts">
import Close from "@/Icons/close.vue";
import { useLocalStorage } from "@vueuse/core"
import { cloneDeep } from "lodash-es";
import { onMounted, ref, watchEffect } from "vue"
import type { ChatOption } from "@/Interface"

interface Props {
  vars: any
}

const props = defineProps<Props>()
const emits = defineEmits(['sendRequest'])
const images = ref<{ url: string }[]>([]);
const isLoading = ref(false);
const imageLoading = ref(false);

const presets = ref<ChatOption[]>([])

interface ModelOption {
  created: number
  id: string
  object: string
  owned_by: string
  parent: string
  permission: any[]
  root: string
}

const models = ref<ModelOption[]>([])
const chatOption = ref<ChatOption>({
  name: "",
  url: "",
  token: "",
  model: "",
  temperature: 0.7,
  max_tokens: 12000,
  messages: [],
  stream: true,
  renderMarkdown: true,
  prompt: ""
})


useLocalStorage("presets", presets)
useLocalStorage("chatOption", chatOption)

const addMessage = (role: string, content: string) => {
  chatOption.value.messages.push({ role, content })
}

const removeMessage = (index: number) => {
  chatOption.value.messages.splice(index, 1)
}


const convertToBase64 = async (file: File | null): Promise<string | null> => {
  if (!file) return null
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e: any) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

const removeImage = (index: number) => {
  images.value.splice(index, 1)
}

const replaceVariables = (input: string, replacements: any) => {
  return input.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return replacements[variable] || match;
  });
}

const sendRequest = () => {
  const option = cloneDeep(chatOption.value)
  option.messages.forEach(message => {
    message.content = replaceVariables(message.content as string, props.vars)
  })

  const userContent = replaceVariables(chatOption.value.prompt, props.vars)
  const userMessage: ChatOption['messages'][0] = { role: "user", content: userContent }
  if (images.value.length > 0) {
    userMessage.content = [
      { type: "text", text: userContent },
      ...images.value.map(img => ({ type: "image_url", image_url: { url: img.url } }))
    ]
  }
  option.messages.push(userMessage)
  option.messages = option.messages.filter(message => Array.isArray(message.content) ? true : (message.content as any).trim())
  emits("sendRequest", option)
}

const handlePaste = async (event: ClipboardEvent) => {
  if (!event.clipboardData) return
  const items = event.clipboardData.items
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile()
      const base64 = await convertToBase64(blob)
      if (base64) images.value.push({ url: base64 })
      break
    }
  }
}
const handleImageUpload = (event: Event) => {
  const files: File[] = Array.from((event as any).target.files)
  imageLoading.value = true;
  Promise.all(files.map(async (file) => {
    const base64 = await convertToBase64(file)
    if (base64) images.value.push({ url: base64 })
  })).finally(() => {
    imageLoading.value = false;
  })
};

const handleSavePreset = () => {
  if (chatOption.value.name === "") {
    alert("请输入预设名称")
    return
  }
  const index = presets.value.findIndex(item => item.name === chatOption.value.name)
  if (index !== -1) {
    // alert("预设名称已存在")
    presets.value[index] = JSON.parse(JSON.stringify(chatOption.value))
    return
  }
  presets.value.push(JSON.parse(JSON.stringify(chatOption.value)))
}

const handleSelectPreset = (preset: ChatOption) => {
  chatOption.value = JSON.parse(JSON.stringify(preset))
  // document.querySelectorAll(".arco-trigger-popup").forEach(f => f.remove())
}

const removePreset = (index: number) => {
  presets.value.splice(index, 1)
}

const getModels = async () => {
  const res = await fetch(`${chatOption.value.url}/v1/models`, {
    headers: {
      "Authorization": `Bearer ${chatOption.value.token}`
    }
  })
  const data = await res.json()
  models.value = data?.data ?? []
}

const handleSearchModel = (value: string) => {
  console.log(value);
  if (models.value.length === 0) {
    getModels()
  }
}

// getModels()

watchEffect(() => {
  if (chatOption.value.messages.length === 0) {
    addMessage("system", "")
  }
})

watchEffect(() => {
  if (presets.value.length === 0) {
    presets.value.push({
      max_tokens: 12000,
      messages: [
        { role: "system", content: "ONLY USE HTML, CSS AND JAVASCRIPT. If you want to use ICON make sure to import the library first. Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Also, try to ellaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE" },
        { role: "user", content: "Vue3 setup syntax, use tailwindcss library, Code extensibility, high-quality code" },
        { role: "assistant", content: "The current code is: {{html}}" }
      ],
      model: "Qwen/Qwen2-VL-72B-Instruct",
      url: "https://api.siliconflow.cn",
      token: "",
      temperature: 0.7,
      renderMarkdown: true,
      name: "默认",
      stream: true,
      prompt: ""
    })
  }
})
</script>

<style>
.arco-image-img {
  @apply h-full;
}
</style>