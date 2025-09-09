import { ref, type Ref } from 'vue';

interface ModelOption {
  label: string;
  value: string;
}

interface ModelSelectionState {
  selectedModel: Ref<string>;
  availableModels: Ref<ModelOption[]>;
  selectModel: (model: string) => void;
  getModelLabel: (value: string) => string;
}

export function useModelSelection(defaultModel: string = 'gemini-2.5-flash'): ModelSelectionState {
  const selectedModel = ref(defaultModel);

  const availableModels = ref<ModelOption[]>([
    { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
    { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
    { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
    { label: "GPT-4o", value: "gpt-4o" },
    { label: "GPT-4o Mini", value: "gpt-4o-mini" },
  ]);

  // 选择模型
  const selectModel = (model: string) => {
    selectedModel.value = model;
    console.log('模型切换为:', model);
    // 这里可以添加模型切换逻辑，比如更新AI请求中的模型参数
  };

  // 根据值获取标签
  const getModelLabel = (value: string): string => {
    const model = availableModels.value.find(m => m.value === value);
    return model ? model.label : 'Gemini 2.5 Flash';
  };

  return {
    selectedModel,
    availableModels,
    selectModel,
    getModelLabel,
  };
}