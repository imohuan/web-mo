<template>
  <a-split class="wh-full" :style="{ border: '1px solid var(--color-border)' }" v-model:size="size" min="400px"
    max="1000px" @move-start="docMask = true" @move-end="docMask = false">
    <template #first>
      <a-typography-paragraph>
        <div class="wh-full">
          <a-tabs type="line" size="large" class="wh-full flex flex-col" v-model:active-key="tab">
            <a-tab-pane key="ai" title="自定义请求">
              <a-spin :loading="isLoading" tip="模型输出中" class="wh-full">
                <Ai :vars="vars" @send-request="sendRequest" />
              </a-spin>
            </a-tab-pane>
            <a-tab-pane key="edit" title="代码预览" class="wh-full">
              <Editor ref="editor" v-model:value="docHtml" />
            </a-tab-pane>
            <!-- <a-tab-pane v-if="response" key="render" title="结果预览" class="wh-full overflow-y-auto">
              <div class="wh-full overflow-y-auto">
                <div class="center pb-10">
                  <button @click="clearResponse"
                    class="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-300 ease-in-out transform hover:scale-105">
                    清除结果
                  </button>
                </div>
                <RenderMd :content="response" class="p-30 pt-0 " />
              </div>
            </a-tab-pane>
            -->
          </a-tabs>
        </div>
      </a-typography-paragraph>
    </template>
    <template #second>
      <a-typography-paragraph>
        <div class="wh-full relative">
          <IFrame v-if="refreshShow" :doc-html="docHtml" />
          <div v-show="docMask" class="absolute z-10 inset-0 "></div>
          <button
            class="absolute bottom-4 right-4 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            @click="handleRefresh">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
              </path>
            </svg>
          </button>
        </div>
      </a-typography-paragraph>
    </template>
  </a-split>
</template>

<script setup lang="ts">
import Ai from './Components/Ai.vue';
import Editor from './Components/Editor.vue';
import IFrame from './Components/IFrame.vue';
// import RenderMd from './Components/RenderMd.vue';
import { computed, getCurrentInstance, onMounted, ref, useTemplateRef, watch } from 'vue';
import type { ChatOption } from "@/Interface"
import { Notification } from '@arco-design/web-vue';
import { useLocalStorage } from '@vueuse/core';
import { DEFAULT_CODE } from '@/Helper/Code';
import { getLines, getMessages } from '@/Helper/Request';
const tab = ref("ai")
const size = ref(0.5)
const editor = useTemplateRef("editor")
const docHtml = ref("")
const docMask = ref(false)
const isLoading = ref(false)
const response = ref(``)

const refreshShow = ref(true)
useLocalStorage("response", response)

const vars = computed(() => ({
  html: docHtml.value
}))

watch(response, (contentResponse: string) => {
  if (!response.value.trim()) {
    tab.value = 'ai'
  }

  if (!editor.value) return
  const newHtml = contentResponse.match(/<!DOCTYPE html>[\s\S]*/)?.[0];
  if (!newHtml) return

  let partialDoc = newHtml;
  if (!partialDoc.includes("</html>")) {
    partialDoc += "\n</html>";
  } else {
    partialDoc = partialDoc.slice(0, partialDoc.indexOf("</html>") + "</html>".length)
  }

  setEditorValue(partialDoc)
})

const setEditorValue = (value: string) => {
  if (!editor.value) return
  editor.value.setValue(value)
}

const addEditorValue = (value: string) => {
  if (!editor.value) return
  editor.value.addValue(value)
}

const clearResponse = () => {
  response.value = ""
  setEditorValue(DEFAULT_CODE)
}

const handleRefresh = () => {
  refreshShow.value = false
  setTimeout(() => {
    refreshShow.value = true
  }, 100);
}


const playNotificationSound = () => {
  const audioContext = new window.AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4 note
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01)
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}


const sendRequest = async (option: ChatOption) => {
  let { url, token, model, messages, temperature, stream, max_tokens, renderMarkdown } = option
  url = url.trim()
  token = token.trim()
  model = model.trim()
  if (!url.endsWith("/v1/chat/completions")) {
    if (url.endsWith("/")) {
      url = url + "v1/chat/completions"
    } else {
      url = url + "/v1/chat/completions"
    }
  }

  if (!url || !token || !model || messages.length === 0) {
    Notification.error({ content: "请填写所有必填字段", showIcon: true })
    return;
  }
  isLoading.value = true;
  tab.value = "edit"
  response.value = "加载中..."

  // 构建请求体
  const requestBody = { model, messages, temperature, stream, max_tokens };
  // console.log(requestBody);
  // return
  try {
    if (stream) {
      // 流式响应处理
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody)
      })

      if (!result.ok) {
        Notification.error({ content: `HTTP error! Status: ${result.status}`, showIcon: true, duration: 10000 })
        response.value = ""
        return
      }

      if (!result || !result.body) {
        Notification.error({ content: "意外错误", showIcon: true, duration: 10000 })
        response.value = ""
        return
      }

      const reader = result.body.getReader();
      let events: any[] = [];
      const onChunk = getLines(getMessages(
        () => {
        },
        () => {
        },
        (event: any) => events.push(event)
      ))

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          onChunk(value)

          for (const event of events) {
            if (event.data.length > 0) {
              if (event.data === "[DONE]") return;
              const data = JSON.parse(event.data);

              if (typeof data === "object" && data !== null && "error" in data) {
                const errorStr = typeof data.error === "string" ? data.error : typeof data.error === "object" && data.error && "message" in data.error && typeof data.error.message === "string" ? data.error.message : JSON.stringify(data.error);
                throw new Error(`Error forwarded from backend: ` + errorStr);
              }

              const content = data['choices'][0]['delta']['content']
              if (response.value === "加载中...") {
                response.value = content
              } else {
                response.value += content
              }
            }
          }
          events = [];
        }
      } catch {

      } finally {
        reader.releaseLock();
      }
    } else {
      // 非流式响应处理
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody)
      })

      if (!result.ok) {
        Notification.error({ content: `HTTP error! Status: ${result.status}`, showIcon: true, duration: 10000 })
        response.value = ""
        return
      }

      if (!result) return
      const data = await result.json();
      if (data.choices && data.choices.length > 0) {
        response.value = data.choices[0].message.content
      } else {
        response.value = ""
        Notification.error({ content: "API返回的数据格式不正确", showIcon: true, duration: 10000 })
      }
    }
  } catch (error: any) {
    response.value = ""
    Notification.error({ content: response.value, showIcon: true, duration: 10000 })
  } finally {
    isLoading.value = false;
    playNotificationSound()
  }
}
</script>

<style>
.arco-split-pane {
  @apply h-full !overflow-hidden;
}

.arco-typography {
  @apply h-full overflow-hidden;
}

.arco-tabs-content {
  @apply flex-1 h-full;
}

.arco-tabs-content-list,
.arco-tabs-pane {
  @apply h-full;
}

.arco-tabs-nav-tab-list {
  margin-left: 10px;
}
</style>