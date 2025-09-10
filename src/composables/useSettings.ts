import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';

// 消息设置接口
export interface MessageSettings {
  maxMessages: number;
  enableAutoScroll: boolean;
  showTimestamp: boolean;
  enableMarkdown: boolean;
  codeHighlight: boolean;
  messageAnimation: boolean;
}

// 提示词设置接口
export interface PromptItem {
  role: "system" | "user" | "assistant";
  content: string;
  enabled: boolean;
}

// 完整设置接口
export interface AppSettings {
  aiBaseUrl: string;
  aiApiKey: string;
  messageSettings: MessageSettings;
  systemPrompts: PromptItem[];
}

// 默认设置
const defaultSettings: AppSettings = {
  aiBaseUrl: "https://api.openai.com/v1",
  aiApiKey: "sk-.....",
  messageSettings: {
    maxMessages: 50,
    enableAutoScroll: true,
    showTimestamp: true,
    enableMarkdown: true,
    codeHighlight: true,
    messageAnimation: true,
  },
  systemPrompts: [
    {
      role: "system",
      content: "你是一位资深的Web前端工程师和代码架构师，精通Vue 3 (Composition API with `< script setup >`) 和Tailwind CSS。请根据用户需求，高质量地创建新代码或高效地修改现有代码。",
      enabled: true,
    },
    {
      role: "user",
      content: "请确保代码遵循最佳实践，使用Vue 3 Composition API语法，样式使用Tailwind CSS，代码要清晰易读。",
      enabled: false,
    }
  ],
};

export function useSettings() {
  // 使用 localStorage 持久化设置
  const settings = useLocalStorage<Partial<AppSettings>>("app-settings", {});

  // 获取设置值，如果不存在则使用默认值
  const getSettingValue = <K extends keyof AppSettings>(key: K): AppSettings[K] => {
    return (settings.value[key] ?? defaultSettings[key]) as AppSettings[K];
  };

  // 更新设置
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    settings.value[key] = value;
  };

  // 重置为默认设置
  const resetToDefault = () => {
    settings.value = { ...defaultSettings };
  };

  // 计算属性：获取各种设置
  const aiSettings = computed(() => ({
    baseUrl: getSettingValue('aiBaseUrl'),
    apiKey: getSettingValue('aiApiKey'),
  }));

  const messageSettings = computed(() => getSettingValue('messageSettings'));
  const systemPrompts = computed(() => getSettingValue('systemPrompts'));

  // 获取启用的提示词
  const enabledPrompts = computed(() =>
    systemPrompts.value.filter(prompt => prompt.enabled)
  );

  return {
    settings,
    getSettingValue,
    updateSetting,
    resetToDefault,
    aiSettings,
    messageSettings,
    systemPrompts,
    enabledPrompts,
  };
}
