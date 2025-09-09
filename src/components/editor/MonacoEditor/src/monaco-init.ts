import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import TailwindcssWorker from "monaco-tailwindcss/tailwindcss.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import { registerEmmet } from "monaco-plugin-emmet";

export const registerAll = () => {
  registerTwTheme();
  registerJsonSchema();
  registerEmvironment();
  registerEmmet(monaco as any, ["html"], {
    html: { card: ".card>.card-body{${0}}" },
  });
};

const registerTwTheme = () => {
  monaco.editor.defineTheme("tw-light", {
    base: "vs",
    inherit: true,
    rules: [
      { foreground: "1f2937ff", token: "" },
      { token: "comment", foreground: "9ca3afff" },
      { token: "string", foreground: "4f46e5ff" },
      { token: "number", foreground: "1f2937ff" },
      { token: "tag", foreground: "0284c7ff" },
      { token: "delimiter", foreground: "9ca3afff" },
      { token: "attribute.name.html", foreground: "0ea5e9ff" },
      { token: "attribute.value.html", foreground: "4f46e5ff" },
      { token: "delimiter.html", foreground: "9ca3afff" },
      { token: "keyword.js", foreground: "0284c7ff" },
      { token: "identifier.js", foreground: "1f2937ff" },
      { token: "attribute.name.css", foreground: "4f46e5ff" },
      { token: "attribute.value.unit.css", foreground: "0d9488ff" },
      { token: "attribute.value.number.css", foreground: "1f2937ff" },
      { token: "attribute.value.css", foreground: "1f2937ff" },
      { token: "attribute.value.hex.css", foreground: "1f2937ff" },
      { token: "keyword.css", foreground: "0284c7ff" },
      { token: "function.css", foreground: "0d9488ff" },
      { token: "pseudo.css", foreground: "0284c7ff" },
      { token: "variable.css", foreground: "1f2937ff" },
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
    schemas: [
      {
        uri: "http://myserver/monaco-editor-options-schema.json",
        fileMatch: ["settings.json"],
        schema: {
          type: "object",
          properties: {
            automaticLayout: { type: "boolean", description: "编辑器是否应自动调整大小以适应其容器" },
            wordWrap: { type: "string", enum: ["off", "on", "wordWrapColumn", "bounded"], description: "控制自动换行的方式" },
            wordWrapColumn: { type: "number", description: "当 wordWrap 设置为 'wordWrapColumn' 或 'bounded' 时使用的列数" },
            lineNumbers: { type: "string", enum: ["on", "off", "relative", "interval"], description: "控制行号的显示方式" },
            lineNumbersMinChars: { type: "number", description: "控制行号的最小字符数" },
            readOnly: { type: "boolean", description: "编辑器是否为只读" },
            theme: { type: "string", enum: ["vs", "vs-dark", "hc-black", "hc-light", "tw-light"], description: "编辑器主题" },
            cursorStyle: { type: "string", enum: ["line", "block", "underline", "line-thin", "block-outline", "underline-thin"], description: "控制光标样式" },
            cursorWidth: { type: "number", description: "控制光标宽度，仅当 cursorStyle 设置为 'line' 时有效" },
            cursorBlinking: { type: "string", enum: ["blink", "smooth", "phase", "expand", "solid"], description: "控制光标闪烁动画" },
            cursorSmoothCaretAnimation: { type: "boolean", description: "启用/禁用光标平滑动画" },
            fontFamily: { type: "string", description: "编辑器字体系列" },
            fontSize: { type: "number", description: "编辑器字体大小（像素）" },
            fontWeight: { type: "string", description: "编辑器字体粗细" },
            lineHeight: { type: "number", description: "编辑器行高" },
            letterSpacing: { type: "number", description: "编辑器字母间距" },
            minimap: { type: "object", properties: { enabled: { type: "boolean" }, side: { type: "string", enum: ["right", "left"] }, showSlider: { type: "string", enum: ["always", "mouseover"] }, maxColumn: { type: "number" }, renderCharacters: { type: "boolean" }, scale: { type: "number" } } },
            scrollbar: { type: "object", properties: { vertical: { type: "string", enum: ["auto", "visible", "hidden"] }, horizontal: { type: "string", enum: ["auto", "visible", "hidden"] }, verticalScrollbarSize: { type: "number" }, horizontalScrollbarSize: { type: "number" } } },
            folding: { type: "boolean", description: "是否启用代码折叠" },
            foldingStrategy: { type: "string", enum: ["auto", "indentation"], description: "用于计算折叠区域的策略" },
            formatOnType: { type: "boolean", description: "键入时是否自动格式化" },
            formatOnPaste: { type: "boolean", description: "粘贴时是否自动格式化" },
            autoIndent: { type: "string", enum: ["none", "keep", "brackets", "advanced", "full"], description: "控制编辑器的自动缩进行为" },
            suggestOnTriggerCharacters: { type: "boolean", description: "键入触发字符时是否显示建议" },
            acceptSuggestionOnEnter: { type: "string", enum: ["on", "smart", "off"], description: "按 Enter 键时是否接受建议" },
            acceptSuggestionOnCommitCharacter: { type: "boolean", description: "键入提交字符时是否接受建议" },
            snippetSuggestions: { type: "string", enum: ["top", "bottom", "inline", "none"], description: "控制代码片段建议的显示方式" },
            tabCompletion: { type: "string", enum: ["on", "off", "onlySnippets"], description: "控制 Tab 键是否完成建议" },
            hover: { type: "object", properties: { enabled: { type: "boolean" }, delay: { type: "number" }, sticky: { type: "boolean" } } },
            links: { type: "boolean", description: "是否检测链接并使其可点击" },
            colorDecorators: { type: "boolean", description: "是否显示颜色装饰器" },
            renderWhitespace: { type: "string", enum: ["none", "boundary", "selection", "trailing", "all"] },
            renderControlCharacters: { type: "boolean", description: "是否渲染控制字符" },
            renderIndentGuides: { type: "boolean", description: "是否渲染缩进参考线" },
            renderLineHighlight: { type: "string", enum: ["none", "gutter", "line", "all"], description: "控制当前行高亮的渲染方式" },
          },
        },
      },
    ],
  });
};

const registerEmvironment = () => {
  self.MonacoEnvironment = {
    getWorker(_, label) {
      switch (label) {
        case "editorWorkerService":
          return new EditorWorker();
        case "css":
        case "less":
        case "scss":
          return new CssWorker();
        case "json":
          return new JsonWorker();
        case "tailwindcss":
          return new TailwindcssWorker();
        case "handlebars":
        case "html":
        case "razor":
          return new HtmlWorker();
        case "javascript":
        case "typescript":
          return new TsWorker();
        default:
          return new EditorWorker();
      }
    },
  };
};