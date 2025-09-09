<template>
  <div ref="container" class="wh-full bg-gray-400"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
// import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import TailwindcssWorker from "monaco-tailwindcss/tailwindcss.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import type { Options as PrettierOptions } from "prettier"
import { registerEmmet } from 'monaco-plugin-emmet'


import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { debounce } from 'lodash-es';
import { DEFAULT_CODE, DEFAULT_FORMAT_OPTIONS } from '@/Helper/Code';
const editorContainer = useTemplateRef("container");
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

import FormatWorker from "@/Helper/Format?worker"
// import { formatCodeForPrettier } from '@/Helper/Format';

interface FileInfo {
  id: number, name: string, language: string, content: string; state?: any
}


const modelValue = defineModel("value")
const files = ref<FileInfo[]>([
  { id: 1, name: "settings.json", language: "json", content: "{}" },
  {
    id: 2,
    name: "index.html",
    language: "html",
    content: DEFAULT_CODE,
  },
]);
const fileId = ref(files.value[1].id)
const currentFile = computed(() => files.value.find(file => file.id === fileId.value))

const registerTwTheme = () => {
  monaco.editor.defineTheme("tw-light", {
    base: "vs",
    inherit: true,
    rules: [
      {
        foreground: "1f2937ff",
        token: "",
      },
      {
        token: "comment",
        foreground: "9ca3afff",
      },
      {
        token: "string",
        foreground: "4f46e5ff",
      },
      {
        token: "number",
        foreground: "1f2937ff",
      },
      {
        token: "tag",
        foreground: "0284c7ff",
      },
      {
        token: "delimiter",
        foreground: "9ca3afff",
      },
      {
        token: "attribute.name.html",
        foreground: "0ea5e9ff",
      },
      {
        token: "attribute.value.html",
        foreground: "4f46e5ff",
      },
      {
        token: "delimiter.html",
        foreground: "9ca3afff",
      },
      {
        token: "keyword.js",
        foreground: "0284c7ff",
      },
      {
        token: "identifier.js",
        foreground: "1f2937ff",
      },
      {
        token: "attribute.name.css",
        foreground: "4f46e5ff",
      },
      {
        token: "attribute.value.unit.css",
        foreground: "0d9488ff",
      },
      {
        token: "attribute.value.number.css",
        foreground: "1f2937ff",
      },
      {
        token: "attribute.value.css",
        foreground: "1f2937ff",
      },
      {
        token: "attribute.value.hex.css",
        foreground: "1f2937ff",
      },
      {
        token: "keyword.css",
        foreground: "0284c7ff",
      },
      {
        token: "function.css",
        foreground: "0d9488ff",
      },
      {
        token: "pseudo.css",
        foreground: "0284c7ff",
      },
      {
        token: "variable.css",
        foreground: "1f2937ff",
      },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.selectionBackground": "#e2e8f0ff",
      "editor.inactiveSelectionBackground": "#e2e8f066",
      "editorLineNumber.foreground": "#9ca3afff",
      "editor.lineHighlightBorder": "#f1f5f9ff",
      "editorBracketMatch.background": "#00000000",
      "editorBracketMatch.border": "#cbd5e1ff",
      "editorSuggestWidget.background": "#f8fafcff",
      "editorSuggestWidget.selectedBackground": "#94a3b81a",
      "editorSuggestWidget.selectedForeground": "#334155ff",
      "editorSuggestWidget.foreground": "#334155ff",
      "editorSuggestWidget.highlightForeground": "#6366f1ff",
      "editorSuggestWidget.focusHighlightForeground": "#6366f1ff",
      "editorHoverWidget.background": "#f8fafcff",
      "editorError.foreground": "#ef4444ff",
      "editorWarning.foreground": "#eab308ff",
    },
  });
};

const registerJsonSchema = () => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [{
      uri: "http://myserver/monaco-editor-options-schema.json",
      fileMatch: ["settings.json"], // 只应用到 settings.json 文件
      // fileMatch: ["*"],
      schema: {
        type: "object",
        properties: {
          // 基本选项
          "automaticLayout": {
            type: "boolean",
            description: "编辑器是否应自动调整大小以适应其容器"
          },
          "wordWrap": {
            type: "string",
            enum: ["off", "on", "wordWrapColumn", "bounded"],
            description: "控制自动换行的方式"
          },
          "wordWrapColumn": {
            type: "number",
            description: "当 wordWrap 设置为 'wordWrapColumn' 或 'bounded' 时使用的列数"
          },
          "lineNumbers": {
            type: "string",
            enum: ["on", "off", "relative", "interval"],
            description: "控制行号的显示方式"
          },
          "lineNumbersMinChars": {
            type: "number",
            description: "控制行号的最小字符数"
          },
          "readOnly": {
            type: "boolean",
            description: "编辑器是否为只读"
          },
          "theme": {
            type: "string",
            enum: ["vs", "vs-dark", "hc-black", "hc-light", "tw-light"],
            description: "编辑器主题"
          },
          // 光标相关
          "cursorStyle": {
            type: "string",
            enum: ["line", "block", "underline", "line-thin", "block-outline", "underline-thin"],
            description: "控制光标样式"
          },
          "cursorWidth": {
            type: "number",
            description: "控制光标宽度，仅当 cursorStyle 设置为 'line' 时有效"
          },
          "cursorBlinking": {
            type: "string",
            enum: ["blink", "smooth", "phase", "expand", "solid"],
            description: "控制光标闪烁动画"
          },
          "cursorSmoothCaretAnimation": {
            type: "boolean",
            description: "启用/禁用光标平滑动画"
          },

          // 字体和渲染
          "fontFamily": {
            type: "string",
            description: "编辑器字体系列"
          },
          "fontSize": {
            type: "number",
            description: "编辑器字体大小（像素）"
          },
          "fontWeight": {
            type: "string",
            description: "编辑器字体粗细"
          },
          "lineHeight": {
            type: "number",
            description: "编辑器行高"
          },
          "letterSpacing": {
            type: "number",
            description: "编辑器字母间距"
          },

          // 功能选项
          "minimap": {
            type: "object",
            description: "编辑器小地图设置",
            properties: {
              "enabled": {
                type: "boolean",
                description: "是否启用小地图"
              },
              "side": {
                type: "string",
                enum: ["right", "left"],
                description: "小地图显示位置"
              },
              "showSlider": {
                type: "string",
                enum: ["always", "mouseover"],
                description: "何时显示小地图滑块"
              },
              "maxColumn": {
                type: "number",
                description: "限制小地图的宽度，最多呈现的列数"
              },
              "renderCharacters": {
                type: "boolean",
                description: "控制是否在小地图中呈现实际字符"
              },
              "scale": {
                type: "number",
                description: "小地图的缩放比例"
              }
            }
          },
          "scrollbar": {
            type: "object",
            description: "滚动条设置",
            properties: {
              "vertical": {
                type: "string",
                enum: ["auto", "visible", "hidden"],
                description: "垂直滚动条的可见性"
              },
              "horizontal": {
                type: "string",
                enum: ["auto", "visible", "hidden"],
                description: "水平滚动条的可见性"
              },
              "verticalScrollbarSize": {
                type: "number",
                description: "垂直滚动条的宽度"
              },
              "horizontalScrollbarSize": {
                type: "number",
                description: "水平滚动条的高度"
              }
            }
          },

          // 高级功能
          "folding": {
            type: "boolean",
            description: "是否启用代码折叠"
          },
          "foldingStrategy": {
            type: "string",
            enum: ["auto", "indentation"],
            description: "用于计算折叠区域的策略"
          },
          "formatOnType": {
            type: "boolean",
            description: "键入时是否自动格式化"
          },
          "formatOnPaste": {
            type: "boolean",
            description: "粘贴时是否自动格式化"
          },
          "autoIndent": {
            type: "string",
            enum: ["none", "keep", "brackets", "advanced", "full"],
            description: "控制编辑器的自动缩进行为"
          },
          "suggestOnTriggerCharacters": {
            type: "boolean",
            description: "键入触发字符时是否显示建议"
          },
          "acceptSuggestionOnEnter": {
            type: "string",
            enum: ["on", "smart", "off"],
            description: "按 Enter 键时是否接受建议"
          },
          "acceptSuggestionOnCommitCharacter": {
            type: "boolean",
            description: "键入提交字符时是否接受建议"
          },
          "snippetSuggestions": {
            type: "string",
            enum: ["top", "bottom", "inline", "none"],
            description: "控制代码片段建议的显示方式"
          },
          "tabCompletion": {
            type: "string",
            enum: ["on", "off", "onlySnippets"],
            description: "控制 Tab 键是否完成建议"
          },
          "hover": {
            type: "object",
            description: "悬停提示设置",
            properties: {
              "enabled": {
                type: "boolean",
                description: "是否启用悬停提示"
              },
              "delay": {
                type: "number",
                description: "显示悬停提示前的延迟（毫秒）"
              },
              "sticky": {
                type: "boolean",
                description: "悬停提示是否在光标移开后保持显示"
              }
            }
          },
          "links": {
            type: "boolean",
            description: "是否检测链接并使其可点击"
          },
          "colorDecorators": {
            type: "boolean",
            description: "是否显示颜色装饰器"
          },
          "renderWhitespace": {
            type: "string",
            enum: ["none", "boundary", "selection", "trailing", "all"],
            description: "控制空白字符的渲染方式"
          },
          "renderControlCharacters": {
            type: "boolean",
            description: "是否渲染控制字符"
          },
          "renderIndentGuides": {
            type: "boolean",
            description: "是否渲染缩进参考线"
          },
          "renderLineHighlight": {
            type: "string",
            enum: ["none", "gutter", "line", "all"],
            description: "控制当前行高亮的渲染方式"
          }
        }
      }
    }]
  });

}

const getFileModel = () => {
  if (!currentFile.value) return
  const { name, language, content } = currentFile.value
  const uri = monaco.Uri.parse(`file:///${name}`);
  const existingModel = monaco.editor.getModel(uri);
  if (existingModel) existingModel.dispose();
  return monaco.editor.createModel(content, language, uri);
}

const getLanguageByFileName = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase() ?? "";
  const languageMap: any = {
    // 前端相关
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'vue': 'vue',

    // 后端相关
    'java': 'java',
    'py': 'python',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',

    // 配置文件
    'xml': 'xml',
    'yml': 'yaml',
    'yaml': 'yaml',
    'md': 'markdown',

    // 数据库
    'sql': 'sql',

    // 其他
    'sh': 'shell',
    'bat': 'bat',
    'ps1': 'powershell'
  };
  return languageMap[extension] || 'plaintext';
}

const autoApplyOptions = debounce(() => {
  if (!editor || !currentFile.value) return
  if (currentFile.value.name === "settings.json") {
    try {
      const { prettier, ...options } = JSON.parse(currentFile.value.content)
      editor.updateOptions(options)
    } catch { }
  }
}, 1000)

const formatCode = async (code: string, language: string): Promise<string> => {
  // 获取 配置中的 Prettier
  let prettierOptions: any = {}
  try {
    const configContent = files.value[0].content;
    const config = JSON.parse(configContent);
    prettierOptions = config.prettier || {};

  } catch (error) {
    console.error("读取配置失败:", error);
    prettierOptions = { ...DEFAULT_FORMAT_OPTIONS };
  }

  // 使用Web Worker执行格式化
  const worker = new FormatWorker()
  return new Promise((resolve) => {
    const id = Math.ceil(Math.random() * 100000)
    worker.addEventListener('message', (event) => {
      const { id: _id, code } = event.data;
      if (id === _id) resolve(code);
      worker.terminate();
    });
    worker.postMessage({ id, code, language, options: prettierOptions });
  });
}

// 自定义格式化
const registerFormatProvider = () => {
  monaco.languages.registerDocumentFormattingEditProvider('html', {
    async provideDocumentFormattingEdits(model, options, token) {
      const text = model.getValue();
      try {
        // 确保HTML格式化能够处理内嵌JavaScript
        const formatted = await formatCode(text, "html");
        if (formatted && formatted !== text) {
          return [{ range: model.getFullModelRange(), text: formatted }];
        }
      } catch (error) {
        console.error("HTML格式化失败:", error);
      }
      return [];
    }
  });

  // 为JavaScript/TypeScript添加格式化提供程序，增强内嵌脚本格式化能力
  monaco.languages.registerDocumentFormattingEditProvider('javascript', {
    async provideDocumentFormattingEdits(model, options, token) {
      const text = model.getValue();
      try {
        const formatted = await formatCode(text, "javascript");
        if (formatted && formatted !== text) {
          return [{ range: model.getFullModelRange(), text: formatted }];
        }
      } catch (error) {
        console.error("JavaScript格式化失败:", error);
      }
      return [];
    }
  });
}

// 自定义HTML代码折叠
const registerFoldingRangeProvider = () => {
  // 配置HTML折叠策略，使script标签内的代码可折叠
  monaco.languages.registerFoldingRangeProvider('html', {
    provideFoldingRanges(model, context, token) {
      const text = model.getValue();
      const ranges = [];

      // 查找所有script标签
      const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
      let match;

      while ((match = scriptRegex.exec(text)) !== null) {
        if (match.index === scriptRegex.lastIndex) {
          scriptRegex.lastIndex++;
        }

        // 计算起始行和结束行
        const startLine = model.getPositionAt(match.index).lineNumber;
        const endLine = model.getPositionAt(match.index + match[0].length).lineNumber;

        // 添加折叠区域
        if (endLine > startLine) {
          ranges.push({
            start: startLine,
            end: endLine,
            kind: monaco.languages.FoldingRangeKind.Region
          });

          // 如果script标签内容有多行，也为内部代码添加折叠
          const scriptContent = match[1];
          const scriptStartOffset = match.index + match[0].indexOf(scriptContent);
          const scriptLines = scriptContent.split('\n');

          if (scriptLines.length > 2) {
            let innerStart = -1;
            let innerDepth = 0;

            // 分析script内部代码结构，寻找可折叠块
            for (let i = 0; i < scriptLines.length; i++) {
              const line = scriptLines[i];
              const lineStartPos = model.getPositionAt(scriptStartOffset + scriptContent.indexOf(line)).lineNumber;

              // 简单的折叠逻辑 - 检测{}括号
              if (line.includes('{')) {
                if (innerStart === -1) {
                  innerStart = lineStartPos;
                }
                innerDepth++;
              }

              if (line.includes('}') && innerDepth > 0) {
                innerDepth--;
                if (innerDepth === 0 && innerStart !== -1) {
                  const innerEndPos = lineStartPos;
                  if (innerEndPos > innerStart) {
                    ranges.push({
                      start: innerStart,
                      end: innerEndPos,
                      kind: monaco.languages.FoldingRangeKind.Region
                    });
                  }
                  innerStart = -1;
                }
              }
            }
          }
        }
      }

      return ranges;
    }
  });

}


const updateCode = () => {
  if (!currentFile.value || !editor) return
  const value = editor.getValue() || "";
  currentFile.value.content = value

  autoApplyOptions()
  if (currentFile.value.name === "index.html") {
    modelValue.value = value
  }
}

onMounted(() => {
  if (!editorContainer.value) return
  registerTwTheme()
  registerJsonSchema()
  registerEmmet(monaco as any, ['html'], {
    html: { card: '.card>.card-body{${0}}' }
  })
  registerFoldingRangeProvider()

  monaco.editor.onDidCreateEditor((editor) => {
    console.log('Monaco 编辑器已成功启动');
    setTimeout(() => {
      console.log('Monaco 自定义格式化');
      registerFormatProvider()
    }, 1000);
  });

  self.MonacoEnvironment = {
    getWorker(_, label) {
      switch (label) {
        case 'editorWorkerService':
          return new EditorWorker()
        case 'css':
        case 'less':
        case 'scss':
          return new CssWorker()
        case 'json':
          return new JsonWorker()
        case 'tailwindcss':
          return new TailwindcssWorker()
        case 'handlebars':
        case 'html':
        case 'razor':
          return new HtmlWorker()
        case 'javascript':
        case 'typescript':
          return new TsWorker()
        default:
          return new EditorWorker()
      }
    },
  };

  const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions & { prettier: PrettierOptions } = {
    theme: "tw-light",
    automaticLayout: true,
    minimap: {
      enabled: true,
      maxColumn: 120
    },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    fontWeight: "700",
    wordWrap: "off",
    mouseWheelZoom: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    // 额外选项，使自动完成更友好
    suggest: {
      showColors: true, // 显示颜色预览
      preview: true, // 显示预览
      showDeprecated: false, // 不显示废弃项
    },
    prettier: DEFAULT_FORMAT_OPTIONS,
  }
  files.value[0].content = JSON.stringify(defaultOptions, null, 2)
  // 创建编辑器实例
  editor = monaco.editor.create(editorContainer.value, {
    model: getFileModel(),
    ...defaultOptions
  });
  editor.onDidChangeModelContent(() => updateCode());

  // editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
  //   // 在这里执行保存操作
  //   if (!currentFile.value || !editor) return
  //   currentFile.value.content = editor.getValue()
  // });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async function () {
    if (!currentFile.value || !editor) return
    updateCode()
    const action = editor.getAction('editor.action.formatDocument');
    if (action) action.run();
  });

  // ctrl+,
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Comma, function () {
    if (!currentFile.value || !editor) return
    const currentFileId = fileId.value
    const currentState = editor.saveViewState()
    fileId.value = fileId.value === 1 ? 2 : 1
    const model = getFileModel()
    if (model) {
      const oldFile = files.value.find(f => f.id === currentFileId)
      if (oldFile) oldFile.state = currentState
      editor.setModel(model);
      if (currentFile.value.state) editor.restoreViewState(currentFile.value.state);
    }
  });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, function () {
    setTimeout(() => {
      debugger
    }, 400);
  });

  // const formatDocumentAction = editor.getAction("editor.action.formatDocument")
  // editor.addAction({
  //   id: 'prettier-format',
  //   label: 'Format with Prettier',
  //   contextMenuGroupId: '1_modification',
  //   contextMenuOrder: 2,
  //   keybindings: [
  //     monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF
  //   ],
  //   run: async (ed) => {
  //     const code = ed.getValue();
  //     const formatted = await formatCode(code, ed.getModel()?.getLanguageId() ?? "html");
  //     ed.setValue(formatted);
  //   }
  // });

  watch(() => currentFile.value?.content, (newCode) => {
    if (currentFile.value && editor && editor.getValue() !== newCode) {
      const model = editor.getModel()
      if (!model) return
      editor.executeEdits('my-source', [{ range: model.getFullModelRange(), text: newCode ?? "" }]);
    }
  })

  modelValue.value = editor.getValue()

  onBeforeUnmount(() => {
    if (editor) editor.dispose();
  });
})


defineExpose({
  setValue: (code: string) => {
    files.value[1].content = code
    modelValue.value = files.value[1].content
  },

  addValue: (code: string) => {
    files.value[1].content += code
    modelValue.value = files.value[1].content
  },

  getValue: () => files.value[1].content
})
</script>
