<template>
  <div v-if="visible" class="fixed inset-0 z-500 flex items-center justify-center">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black opacity-20" @click="$emit('close')"></div>

    <!-- 弹出框内容 -->
    <div
      class="relative z-500 bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 h-[80vh] flex flex-col overflow-hidden"
    >
      <!-- 头部 - 固定 -->
      <div
        class="flex items-center justify-between p-6 border-b border-b-gray-200 flex-shrink-0"
      >
        <h2 class="text-xl font-semibold text-gray-900">设置</h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <CloseIcon class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- 内容区域 - 可滚动 -->
      <div class="flex-1 h-full p-6 pl-1 pr-1 overflow-hidden">
        <div class="w-full h-full overflow-y-auto px-5">
          <div class="space-y-6">
            <!-- 预设管理配置项 -->
            <!-- 预设管理容器 -->
            <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
              <!-- 当前预设选择 -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex gap-1 items-center">
                  <label class="text-sm font-medium text-gray-700">当前预设</label>
                  <div class="relative group">
                    <HelpIcon class="w-4 h-4 text-gray-400 cursor-help" />
                    <div
                      class="absolute left-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                    >
                      管理和切换不同的配置预设
                      <div
                        class="absolute -top-1 left-2 w-2 h-2 bg-gray-800 transform rotate-45"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- 导入导出按钮 -->
                <div class="flex items-center gap-2">
                  <button
                    @click="exportPresets"
                    class="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
                    title="导出所有预设"
                  >
                    <DownloadIcon class="w-4 h-4" />
                    导出
                  </button>
                  <button
                    @click="showImportDialog = true"
                    class="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    title="导入预设"
                  >
                    <UploadIcon class="w-4 h-4" />
                    导入
                  </button>
                  <button
                    @click="showAddPresetDialog = true"
                    class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                    title="添加新预设"
                  >
                    <PlusIcon class="w-4 h-4" />
                    添加
                  </button>
                </div>
              </div>

              <!-- 预设列表 -->
              <div v-if="presets.length > 0" class="space-y-2">
                <div
                  v-for="preset in presetList"
                  :key="preset.name"
                  :class="[
                    'flex items-center justify-between p-3 bg-white rounded-lg border transition-colors',
                    currentPresetName === preset.name
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                >
                  <div class="flex-1 cursor-pointer" @click="loadPreset(preset.name)">
                    <div class="flex items-center justify-between">
                      <span
                        :class="[
                          'font-medium text-sm',
                          currentPresetName === preset.name
                            ? 'text-blue-700'
                            : 'text-gray-900',
                        ]"
                      >
                        {{ preset.name }}
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ formatDate(preset.updatedAt) }}
                      </span>
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="flex items-center gap-1 ml-3">
                    <button
                      @click="copyPreset(preset.name)"
                      class="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="复制预设"
                    >
                      <CopyIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="openRenameDialog(preset.name)"
                      class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="重命名预设"
                    >
                      <EditIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="deletePreset(preset.name)"
                      class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="删除预设"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-else class="text-center py-8">
                <TrashIcon class="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p class="text-sm text-gray-500">暂无保存的预设</p>
                <p class="text-xs text-gray-400 mt-1">
                  配置完成后点击右下角"保存设置"时会提示保存为预设
                </p>
              </div>
            </div>

            <!-- 动态配置项 -->
            <div v-for="(config, index) in configItems" :key="index" class="space-y-4">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-medium text-gray-900">{{ config.title }}</h3>
                <div v-if="config.description" class="relative group">
                  <HelpIcon class="w-4 h-4 text-gray-400 cursor-help" />
                  <div
                    class="absolute left-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  >
                    {{ config.description }}
                    <div
                      class="absolute -top-1 left-2 w-2 h-2 bg-gray-800 transform rotate-45"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- 根据配置类型渲染不同的组件 -->
              <component
                :is="getComponentByType(config.type)"
                :config="config"
                :value="getConfigValue(config.key)"
                @update="updateConfig(config.key, $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 - 固定 -->
      <div
        class="flex items-center justify-end gap-3 p-6 border-t border-t-gray-200 bg-gray-50 flex-shrink-0"
      >
        <button
          @click="resetToDefault"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          重置默认
        </button>
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          @click="saveSettings"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
        >
          保存设置
        </button>
      </div>
    </div>

    <!-- 保存预设对话框 -->
    <div
      v-if="showSavePresetDialog"
      class="absolute inset-0 z-600 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-6 w-96 shadow-xl border border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-4">保存预设</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预设名称</label>
            <input
              v-model="newPresetName"
              type="text"
              placeholder="输入预设名称..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="savePreset"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="showSavePresetDialog = false"
              class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              @click="savePreset"
              :disabled="!newPresetName.trim()"
              class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 重命名预设对话框 -->
    <div
      v-if="showRenameDialog"
      class="absolute inset-0 z-600 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-6 w-96 shadow-xl border border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-4">重命名预设</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">新名称</label>
            <input
              v-model="renamePresetName"
              type="text"
              placeholder="输入新的预设名称..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="renamePreset"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="showRenameDialog = false"
              class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              @click="renamePreset"
              :disabled="!renamePresetName.trim()"
              class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              重命名
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入预设对话框 -->
    <div
      v-if="showImportDialog"
      class="absolute inset-0 z-600 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-6 w-96 shadow-xl border border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-4">导入预设</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              选择预设文件 (.json)
            </label>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileSelect"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div class="text-xs text-gray-500">
            <p>• 支持导入之前导出的预设文件</p>
            <p>• 重名预设将被覆盖</p>
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="showImportDialog = false"
              class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加预设对话框 -->
    <div
      v-if="showAddPresetDialog"
      class="absolute inset-0 z-600 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-6 w-96 shadow-xl border border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-4">添加新预设</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预设名称</label>
            <input
              v-model="addPresetName"
              type="text"
              placeholder="输入预设名称..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="addNewPreset"
            />
          </div>
          <div class="text-xs text-gray-500">
            <p>• 将基于当前配置创建新预设</p>
            <p>• 如果名称已存在将提示覆盖</p>
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="showAddPresetDialog = false"
              class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              @click="addNewPreset"
              :disabled="!addPresetName.trim()"
              class="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useLocalStorage } from "@vueuse/core";
import CloseIcon from "@/assets/icons/close.svg?component";
import HelpIcon from "@/assets/icons/help.svg?component";
import DownloadIcon from "@/assets/icons/download.svg?component";
import UploadIcon from "@/assets/icons/upload.svg?component";
import PlusIcon from "@/assets/icons/plus.svg?component";
import CopyIcon from "@/assets/icons/copy.svg?component";
import EditIcon from "@/assets/icons/edit.svg?component";
import TrashIcon from "@/assets/icons/trash.svg?component";
import BasicConfigItem from "@/components/settings/BasicConfigItem.vue";
import MessagesConfigItem from "@/components/settings/MessagesConfigItem.vue";
import PromptsConfigItem from "@/components/settings/PromptsConfigItem.vue";

interface ConfigItem {
  key: string;
  title: string;
  description?: string;
  type: "input" | "textarea" | "select" | "switch" | "messages" | "prompts";
  defaultValue?: any;
  options?: { label: string; value: any }[];
  placeholder?: string;
  required?: boolean;
}

interface Preset {
  name: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  visible: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [settings: Record<string, any>];
}>();

// 使用 localStorage 持久化设置和预设
const settings = useLocalStorage("app-settings", {});
const presets = useLocalStorage<Preset[]>("app-presets", []);

// 预设管理状态
const currentPresetName = ref<string>("");
const showSavePresetDialog = ref(false);
const showRenameDialog = ref(false);
const showImportDialog = ref(false);
const showAddPresetDialog = ref(false);
const newPresetName = ref("");
const renamePresetName = ref("");
const renamePresetTarget = ref<string>(""); // 存储要重命名的原始预设名称
const addPresetName = ref("");
const fileInput = ref<HTMLInputElement>();

// 配置项定义 - JSON 驱动
const configItems = ref<ConfigItem[]>([
  {
    key: "aiBaseUrl",
    title: "Base Url",
    description: "OpenAI 服务的基础 URL 地址",
    type: "input",
    placeholder: "https://api.openai.com/v1",
    defaultValue: "https://api.openai.com/v1",
    required: true,
  },
  {
    key: "aiApiKey",
    title: "API Key",
    description: "OpenAI 服务的 API 密钥",
    type: "input",
    placeholder: "请输入您的 API Key",
    defaultValue: "sk-.....",
    required: true,
  },
  // {
  //   key: "messageSettings",
  //   title: "消息对话设置",
  //   description: "配置消息显示和行为相关设置",
  //   type: "messages",
  //   defaultValue: {
  //     maxMessages: 50,
  //     enableAutoScroll: true,
  //     showTimestamp: true,
  //     enableMarkdown: true,
  //     codeHighlight: true,
  //     messageAnimation: true,
  //   },
  // },
  {
    key: "systemPrompts",
    title: "预设提示词",
    description: "配置系统和用户的预设提示词，用于OpenAI请求中的message对象",
    type: "prompts",
    defaultValue: [
      {
        role: "system",
        content:
          "你是一位资深的Web前端工程师和代码架构师，精通Vue 3 (Composition API with `< script setup >`) 和Tailwind CSS。请根据用户需求，高质量地创建新代码或高效地修改现有代码。",
        enabled: true,
      },
      {
        role: "user",
        content:
          "请确保代码遵循最佳实践，使用Vue 3 Composition API语法，样式使用Tailwind CSS，代码要清晰易读。",
        enabled: false,
      },
    ],
  },
]);

// 获取配置值
const getConfigValue = (key: string) => {
  const config = configItems.value.find((item) => item.key === key);
  return settings.value[key] ?? config?.defaultValue;
};

// 更新配置
const updateConfig = (key: string, value: any) => {
  settings.value[key] = value;
};

// 根据类型获取组件
const getComponentByType = (type: string) => {
  switch (type) {
    case "messages":
      return MessagesConfigItem;
    case "prompts":
      return PromptsConfigItem;
    default:
      return BasicConfigItem;
  }
};

// 保存设置
const saveSettings = () => {
  // 如果当前有预设，询问是否更新预设
  if (currentPresetName.value) {
    const shouldUpdatePreset = confirm(`是否同时更新预设"${currentPresetName.value}"？`);
    if (shouldUpdatePreset) {
      updateCurrentPreset();
    }
  } else {
    // 如果没有当前预设，询问是否保存为新预设
    const shouldSaveAsPreset = confirm("是否将当前配置保存为新预设？");
    if (shouldSaveAsPreset) {
      showSavePresetDialog.value = true;
      return; // 不关闭对话框，等待用户输入预设名称
    }
  }

  emit("save", settings.value);
  emit("close");
};

// 更新当前预设
const updateCurrentPreset = () => {
  if (!currentPresetName.value) return;

  const presetIndex = presets.value.findIndex((p) => p.name === currentPresetName.value);
  if (presetIndex !== -1) {
    presets.value[presetIndex].settings = { ...settings.value };
    presets.value[presetIndex].updatedAt = new Date().toISOString();
  }
};

// 重置为默认值
const resetToDefault = () => {
  if (confirm("确定要重置所有设置为默认值吗？")) {
    const defaultSettings: Record<string, any> = {};
    configItems.value.forEach((item) => {
      if (item.defaultValue !== undefined) {
        defaultSettings[item.key] = item.defaultValue;
      }
    });
    settings.value = defaultSettings;
  }
};

// 计算属性：预设列表
const presetList = computed(() => {
  return presets.value.sort((a, b) => a.name.localeCompare(b.name));
});

// 计算属性：当前预设对象
const currentPreset = computed(() => {
  if (!currentPresetName.value) return null;
  return presets.value.find((p) => p.name === currentPresetName.value);
});

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 保存预设
const savePreset = () => {
  if (!newPresetName.value.trim()) return;

  const presetName = newPresetName.value.trim();

  // 检查预设名称是否已存在
  const existingIndex = presets.value.findIndex((p) => p.name === presetName);

  const now = new Date().toISOString();
  const presetData: Preset = {
    name: presetName,
    settings: { ...settings.value },
    createdAt: existingIndex === -1 ? now : presets.value[existingIndex].createdAt,
    updatedAt: now,
  };

  if (existingIndex !== -1) {
    // 更新现有预设
    if (confirm(`预设"${presetName}"已存在，是否覆盖？`)) {
      presets.value[existingIndex] = presetData;
      currentPresetName.value = presetName;
    } else {
      return; // 用户取消覆盖，不继续执行
    }
  } else {
    // 创建新预设
    presets.value.push(presetData);
    currentPresetName.value = presetName;
  }

  newPresetName.value = "";
  showSavePresetDialog.value = false;

  // 保存预设后继续保存设置并关闭对话框
  emit("save", settings.value);
  emit("close");
};

// 加载预设
const loadPreset = (presetName: string) => {
  if (!presetName) {
    // 加载默认配置
    resetToDefault();
    currentPresetName.value = "";
    return;
  }

  const preset = presets.value.find((p) => p.name === presetName);
  if (preset) {
    // 清空当前设置
    Object.keys(settings.value).forEach((key) => {
      delete settings.value[key];
    });

    // 加载预设设置
    Object.assign(settings.value, preset.settings);
    currentPresetName.value = presetName;
  }
};

// 删除预设
const deletePreset = (presetName: string) => {
  if (confirm(`确定要删除预设"${presetName}"吗？`)) {
    const index = presets.value.findIndex((p) => p.name === presetName);
    if (index !== -1) {
      presets.value.splice(index, 1);
      if (currentPresetName.value === presetName) {
        currentPresetName.value = "";
        resetToDefault();
      }
    }
  }
};

// 打开重命名对话框
const openRenameDialog = (presetName: string) => {
  if (!presetName) return;
  
  renamePresetTarget.value = presetName; // 存储要重命名的预设原始名称
  renamePresetName.value = presetName;   // 显示当前名称供编辑
  showRenameDialog.value = true;
};

// 重命名预设
const renamePreset = () => {
  const oldName = renamePresetTarget.value;
  if (!renamePresetName.value.trim() || !oldName) {
    return;
  }

  const newName = renamePresetName.value.trim();
  
  // 检查新名称是否已存在（排除自身）
  if (presets.value.some((p) => p.name === newName && p.name !== oldName)) {
    alert(`预设名称"${newName}"已存在！`);
    return;
  }

  const presetIndex = presets.value.findIndex((p) => p.name === oldName);
  if (presetIndex !== -1) {
    presets.value[presetIndex].name = newName;
    presets.value[presetIndex].updatedAt = new Date().toISOString();
    
    // 如果重命名的是当前选中的预设，更新currentPresetName
    if (currentPresetName.value === oldName) {
      currentPresetName.value = newName;
    }
  }

  renamePresetName.value = "";
  renamePresetTarget.value = "";
  showRenameDialog.value = false;
};

// 复制预设
const copyPreset = (presetName: string) => {
  const preset = presets.value.find((p) => p.name === presetName);
  if (!preset) return;

  let copyName = `${presetName}_副本`;
  let counter = 1;

  // 确保副本名称唯一
  while (presets.value.some((p) => p.name === copyName)) {
    copyName = `${presetName}_副本${counter}`;
    counter++;
  }

  const now = new Date().toISOString();
  const copiedPreset: Preset = {
    name: copyName,
    settings: { ...preset.settings },
    createdAt: now,
    updatedAt: now,
  };

  presets.value.push(copiedPreset);
  currentPresetName.value = copyName;

  // 加载复制的预设
  Object.keys(settings.value).forEach((key) => {
    delete settings.value[key];
  });
  Object.assign(settings.value, copiedPreset.settings);
};

// 导出预设
const exportPresets = () => {
  const exportData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    presets: presets.value,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `settings-presets-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const importData = JSON.parse(content);

      // 验证文件格式
      if (!importData.presets || !Array.isArray(importData.presets)) {
        alert("无效的预设文件格式！");
        return;
      }

      // 导入预设
      let importCount = 0;
      let overwriteCount = 0;

      importData.presets.forEach((importPreset: Preset) => {
        if (!importPreset.name || !importPreset.settings) return;

        const existingIndex = presets.value.findIndex(
          (p) => p.name === importPreset.name
        );

        if (existingIndex !== -1) {
          // 覆盖现有预设
          presets.value[existingIndex] = {
            ...importPreset,
            updatedAt: new Date().toISOString(),
          };
          overwriteCount++;
        } else {
          // 添加新预设
          presets.value.push(importPreset);
          importCount++;
        }
      });

      alert(`导入完成！新增 ${importCount} 个预设，覆盖 ${overwriteCount} 个预设。`);
      showImportDialog.value = false;

      // 清空文件输入
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    } catch (error) {
      alert("文件解析失败，请确保文件格式正确！");
      console.error("Import error:", error);
    }
  };

  reader.readAsText(file);
};

// 添加新预设
const addNewPreset = () => {
  if (!addPresetName.value.trim()) return;

  const presetName = addPresetName.value.trim();

  // 检查预设名称是否已存在
  const existingIndex = presets.value.findIndex((p) => p.name === presetName);

  const now = new Date().toISOString();
  const presetData: Preset = {
    name: presetName,
    settings: { ...settings.value },
    createdAt: existingIndex === -1 ? now : presets.value[existingIndex].createdAt,
    updatedAt: now,
  };

  if (existingIndex !== -1) {
    // 更新现有预设
    if (confirm(`预设"${presetName}"已存在，是否覆盖？`)) {
      presets.value[existingIndex] = presetData;
      currentPresetName.value = presetName;
    } else {
      return; // 用户取消覆盖，不继续执行
    }
  } else {
    // 创建新预设
    presets.value.push(presetData);
    currentPresetName.value = presetName;
  }

  addPresetName.value = "";
  showAddPresetDialog.value = false;
};

// 初始化默认值
onMounted(() => {
  configItems.value.forEach((item) => {
    if (item.defaultValue !== undefined && settings.value[item.key] === undefined) {
      settings.value[item.key] = item.defaultValue;
    }
  });
});
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
</style>
