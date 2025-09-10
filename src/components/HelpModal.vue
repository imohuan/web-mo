<template>
  <div v-if="visible" class="fixed inset-0 z-500 flex items-center justify-center">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black opacity-20" @click="$emit('close')"></div>

    <!-- 弹出框内容 -->
    <div
      class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 h-[80vh] flex flex-col overflow-hidden"
    >
      <!-- 头部 - 固定 -->
      <div
        class="flex items-center justify-between p-6 border-b flex-shrink-0 border-b-gray-200"
      >
        <h2 class="text-xl font-semibold text-gray-900">帮助文档</h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <CloseIcon class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- 内容区域 - 可滚动 -->
      <div class="flex flex-1 min-h-0 pr-1">
        <!-- 左侧导航 -->
        <div class="w-64 border-r border-r-gray-200 bg-gray-50 p-4 flex-shrink-0">
          <nav class="space-y-2">
            <button
              v-for="section in helpSections"
              :key="section.id"
              @click="activeSection = section.id"
              :class="[
                'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100',
              ]"
            >
              <component :is="section.icon" class="w-4 h-4 inline-block mr-2" />
              {{ section.title }}
            </button>
          </nav>
        </div>

        <!-- 右侧内容 -->
        <div class="flex-1 p-6 overflow-y-auto">
          <div v-for="section in helpSections" :key="section.id">
            <div v-if="activeSection === section.id" class="prose max-w-none">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                {{ section.title }}
              </h3>
              <div v-html="section.content"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CloseIcon from "@/assets/icons/close.svg?component";
import ChatIcon from "@/assets/icons/chat.svg?component";
import CodeIcon from "@/assets/icons/code.svg?component";
import SettingsIcon from "@/assets/icons/settings.svg?component";
import HelpIcon from "@/assets/icons/help.svg?component";

interface Props {
  visible: boolean;
}

defineProps<Props>();

defineEmits<{
  close: [];
}>();

const activeSection = ref("getting-started");

const helpSections = [
  {
    id: "getting-started",
    title: "快速开始",
    icon: ChatIcon,
    content: `
      <div class="space-y-4">
        <h4 class="font-medium text-gray-900">欢迎使用 AI Chat & Code Editor</h4>
        <p class="text-gray-600">这是一个集成了 AI 对话和代码编辑功能的智能开发工具。</p>
        
        <h5 class="font-medium text-gray-900 mt-6">主要功能：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>AI 对话</strong>：与 AI 助手进行自然语言交流</li>
          <li><strong>代码生成</strong>：根据需求自动生成代码</li>
          <li><strong>实时预览</strong>：即时查看代码运行效果</li>
          <li><strong>历史记录</strong>：管理多个对话会话</li>
          <li><strong>代码编辑</strong>：内置 Monaco 编辑器</li>
        </ul>

        <h5 class="font-medium text-gray-900 mt-6">快速开始步骤：</h5>
        <ol class="list-decimal list-inside space-y-2 text-gray-600">
          <li>在左侧对话区输入您的问题或需求</li>
          <li>AI 会根据您的需求生成相应的代码</li>
          <li>代码会自动显示在右侧编辑器中</li>
          <li>点击预览按钮查看运行效果</li>
        </ol>
      </div>
    `,
  },
  {
    id: "chat-features",
    title: "对话功能",
    icon: ChatIcon,
    content: `
      <div class="space-y-4">
        <h4 class="font-medium text-gray-900">对话功能详解</h4>
        
        <h5 class="font-medium text-gray-900 mt-6">消息类型：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>文本消息</strong>：支持 Markdown 格式</li>
          <li><strong>图片消息</strong>：可上传图片进行分析</li>
          <li><strong>代码消息</strong>：自动识别和高亮代码块</li>
        </ul>

        <h5 class="font-medium text-gray-900 mt-6">操作功能：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>重新生成</strong>：重新请求 AI 回答</li>
          <li><strong>删除消息</strong>：删除不需要的消息</li>
          <li><strong>复制代码</strong>：一键复制代码块</li>
          <li><strong>应用代码</strong>：将代码应用到编辑器</li>
        </ul>

        <h5 class="font-medium text-gray-900 mt-6">会话管理：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>新建对话</strong>：创建新的对话会话</li>
          <li><strong>切换对话</strong>：在不同会话间切换</li>
          <li><strong>删除对话</strong>：删除不需要的会话</li>
          <li><strong>清空对话</strong>：清空当前会话内容</li>
        </ul>
      </div>
    `,
  },
  {
    id: "code-editor",
    title: "代码编辑",
    icon: CodeIcon,
    content: `
      <div class="space-y-4">
        <h4 class="font-medium text-gray-900">代码编辑器功能</h4>
        
        <h5 class="font-medium text-gray-900 mt-6">编辑器特性：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>语法高亮</strong>：支持多种编程语言</li>
          <li><strong>智能提示</strong>：代码自动完成</li>
          <li><strong>错误检查</strong>：实时语法检查</li>
          <li><strong>代码格式化</strong>：自动格式化代码</li>
        </ul>

        <h5 class="font-medium text-gray-900 mt-6">预览功能：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>实时预览</strong>：即时查看代码效果</li>
          <li><strong>响应式预览</strong>：支持不同屏幕尺寸</li>
          <li><strong>错误提示</strong>：显示运行时错误</li>
        </ul>

        <h5 class="font-medium text-gray-900 mt-6">历史记录：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>版本控制</strong>：保存代码修改历史</li>
          <li><strong>撤销重做</strong>：支持撤销和重做操作</li>
          <li><strong>版本切换</strong>：快速切换到历史版本</li>
        </ul>

        <h5 class="font-medium text-gray-900 mt-6">快捷键：</h5>
        <div class="bg-gray-50 p-4 rounded-lg">
          <ul class="list-none space-y-1 text-sm text-gray-600">
            <li><kbd class="bg-gray-200 px-2 py-1 rounded">Ctrl + S</kbd> - 保存代码</li>
            <li><kbd class="bg-gray-200 px-2 py-1 rounded">Ctrl + Z</kbd> - 撤销</li>
            <li><kbd class="bg-gray-200 px-2 py-1 rounded">Ctrl + Y</kbd> - 重做</li>
            <li><kbd class="bg-gray-200 px-2 py-1 rounded">Ctrl + F</kbd> - 查找</li>
            <li><kbd class="bg-gray-200 px-2 py-1 rounded">Ctrl + H</kbd> - 替换</li>
          </ul>
        </div>
      </div>
    `,
  },
  {
    id: "settings",
    title: "设置配置",
    icon: SettingsIcon,
    content: `
      <div class="space-y-4">
        <h4 class="font-medium text-gray-900">设置配置说明</h4>
        
        <h5 class="font-medium text-gray-900 mt-6">AI 配置：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>Base URL</strong>：AI 服务的 API 地址</li>
          <li><strong>API Key</strong>：访问 AI 服务的密钥</li>
          <li><strong>模型选择</strong>：选择不同的 AI 模型</li>
        </ul>

        <h5 class="font-medium text-gray-900 mt-6">消息设置：</h5>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li><strong>最大消息数量</strong>：限制对话历史长度</li>
          <li><strong>自动滚动</strong>：新消息时自动滚动</li>
          <li><strong>显示时间戳</strong>：显示消息发送时间</li>
          <li><strong>启用 Markdown</strong>：支持 Markdown 渲染</li>
          <li><strong>代码高亮</strong>：启用代码语法高亮</li>
          <li><strong>消息动画</strong>：启用消息动画效果</li>
        </ul>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h6 class="font-medium text-yellow-800">注意事项：</h6>
          <ul class="list-disc list-inside space-y-1 text-sm text-yellow-700 mt-2">
            <li>API Key 会安全存储在本地，不会上传到服务器</li>
            <li>修改设置后需要刷新页面才能完全生效</li>
            <li>重置设置会清除所有自定义配置</li>
          </ul>
        </div>
      </div>
    `,
  },
  {
    id: "faq",
    title: "常见问题",
    icon: HelpIcon,
    content: `
      <div class="space-y-4">
        <h4 class="font-medium text-gray-900">常见问题解答</h4>
        
        <div class="space-y-6">
          <div>
            <h5 class="font-medium text-gray-900">Q: 如何获取 API Key？</h5>
            <p class="text-gray-600 mt-2">
              您需要注册相应的 AI 服务提供商账户（如 OpenAI、Google Gemini 等），
              然后在其开发者控制台中生成 API Key。
            </p>
          </div>

          <div>
            <h5 class="font-medium text-gray-900">Q: 为什么 AI 不响应？</h5>
            <p class="text-gray-600 mt-2">
              请检查：1) API Key 是否正确配置；2) Base URL 是否可访问；
              3) 网络连接是否正常；4) 是否超出了 API 调用限制。
            </p>
          </div>

          <div>
            <h5 class="font-medium text-gray-900">Q: 代码预览不显示怎么办？</h5>
            <p class="text-gray-600 mt-2">
              确保代码是有效的 HTML/CSS/JavaScript，检查浏览器控制台是否有错误信息，
              尝试刷新预览或重新生成代码。
            </p>
          </div>

          <div>
            <h5 class="font-medium text-gray-900">Q: 如何保存我的工作？</h5>
            <p class="text-gray-600 mt-2">
              所有对话和代码都会自动保存在浏览器本地存储中。
              您也可以手动复制代码到外部文件进行备份。
            </p>
          </div>

          <div>
            <h5 class="font-medium text-gray-900">Q: 支持哪些编程语言？</h5>
            <p class="text-gray-600 mt-2">
              主要支持 Web 开发相关语言：HTML、CSS、JavaScript、TypeScript、Vue、React 等。
              编辑器还支持语法高亮和基本的代码提示功能。
            </p>
          </div>

          <div>
            <h5 class="font-medium text-gray-900">Q: 如何提高 AI 回答质量？</h5>
            <p class="text-gray-600 mt-2">
              1) 提供清晰具体的需求描述；2) 包含相关的上下文信息；
              3) 指定期望的技术栈和框架；4) 提供示例或参考资料。
            </p>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <h6 class="font-medium text-blue-800">需要更多帮助？</h6>
          <p class="text-sm text-blue-700 mt-2">
            如果您遇到其他问题，可以在对话中直接询问 AI 助手，
            或查看项目的 GitHub 仓库获取更多技术支持。
          </p>
        </div>
      </div>
    `,
  },
];
</script>

<style scoped>
/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 键盘样式 */
kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo,
    monospace;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Prose 样式重置 */
.prose {
  color: inherit;
}

.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: inherit;
  margin-top: 0;
}

.prose ul,
.prose ol {
  margin: 0;
}

.prose li {
  margin: 0;
}
</style>
