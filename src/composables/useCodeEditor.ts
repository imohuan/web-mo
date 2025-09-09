import { ref, computed, watch } from "vue";
import type { Ref, ComputedRef } from "vue";

// 定义历史记录项接口
export interface HistoryItem {
  code: string;
  timestamp: number;
  title?: string;
}

export function useCodeEditor(externalRefs?: {
  history: Ref<HistoryItem[]>;
  currentHistoryIndex: Ref<number>;
  currentCode: Ref<string>;
}) {
  const currentCode =
    externalRefs?.currentCode ||
    ref(`<!DOCTYPE html>
<html lang="zh-CN">
<head>  
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>示例页面</title>
</head>
<body>
    <div class="container">
        <h1>欢迎使用AI代码编辑器</h1>
        <p>这是一个示例HTML页面，您可以在左侧与AI对话来生成或修改代码。</p>
    </div>
</body>
</html>`);

  const isPreviewMode = ref(false);
  const editorTitle = ref("index.html");

  // 生成历史记录标题
  const generateHistoryTitle = (code: string) => {
    // 尝试从HTML中提取标题
    const titleMatch = code.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }

    // 尝试从h1标签中提取标 题
    const h1Match = code.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return h1Match[1].trim();
    }

    // 默认标题
    return "代码版本";
  };

  // 历史记录管理 - 使用外部响应式引用或创建本地的
  const history =
    externalRefs?.history ||
    ref<HistoryItem[]>([
      {
        title: generateHistoryTitle(currentCode.value),
        code: currentCode.value,
        timestamp: Date.now(),
      },
    ]);

  const currentHistoryIndex = externalRefs?.currentHistoryIndex || ref(0);
  const maxHistorySize = 50; // 最大历史记录数量

  // 计算属性：是否可以撤销/恢复
  const canUndo = computed(() => currentHistoryIndex.value > 0);
  const canRedo = computed(() => currentHistoryIndex.value < history.value.length - 1);

  // 添加到历史记录
  const addToHistory = (code: string, customTitle?: string) => {
    // 如果代码没有变化，不添加到历史记录
    if (history.value[currentHistoryIndex.value]?.code === code) {
      return;
    }

    // 删除当前位置之后的所有历史记录（用户在历史记录中间进行了新的修改）
    if (currentHistoryIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentHistoryIndex.value + 1);
    }

    // 添加新的历史记录
    const newHistoryItem: HistoryItem = {
      code,
      timestamp: Date.now(),
      title: customTitle || generateHistoryTitle(code),
    };

    history.value.push(newHistoryItem);
    currentHistoryIndex.value = history.value.length - 1;

    // 限制历史记录大小
    if (history.value.length > maxHistorySize) {
      history.value.shift();
      currentHistoryIndex.value--;
    }
  };

  const isHtmlContent = computed(() => {
    const code = currentCode.value.toLowerCase();
    return code.includes("<html") || code.includes("<!doctype html");
  });

  const togglePreview = () => {
    // 只有当代码为HTML时才允许切换到预览模式
    if (!isPreviewMode.value && !isHtmlContent.value) {
      return;
    }
    isPreviewMode.value = !isPreviewMode.value;
  };

  // 代码块监听器状态
  const codeBlockBuffer = ref("");
  const isInCodeBlock = ref(false);

  // 缓冲区用于检测代码块标记
  const detectionBuffer = ref("");
  const maxDetectionBufferSize = 50; // 限制缓冲区大小，避免内存问题

  // 代码块差异检测器
  const detectAndApplyDiff = (codeContent: string) => {
    // 检测是否包含差异格式
    const diffPattern = /-------\s*SEARCH[\s\S]*?=======([\s\S]*?)\+\+\+\+\+\+\+\s*REPLACE/;
    if (diffPattern.test(codeContent)) {
      console.log("检测到差异格式代码，准备应用差异:", codeContent);
      // 触发自定义事件通知编辑器应用差异
      const event = new CustomEvent("applyCodeDiff", {
        detail: { diffContent: codeContent },
      });
      window.dispatchEvent(event);
      return true;
    }
    return false;
  };

  // 上一次处理的内容长度，用于增量检测
  const lastProcessedLength = ref(0);

  // 已处理的HTML代码块缓存，避免重复处理
  const processedHtmlBlocks = ref(new Set<string>());

  // 监听流式内容更新，检测代码块（优化版）
  const monitorStreamContent = (content: string) => {
    // 只处理新增的内容
    const newContent = content.substring(lastProcessedLength.value);
    lastProcessedLength.value = content.length;

    if (!newContent) return;

    // 将新内容添加到检测缓冲区
    detectionBuffer.value += newContent;

    // 限制检测缓冲区大小，保留最近的内容
    if (detectionBuffer.value.length > maxDetectionBufferSize) {
      detectionBuffer.value = detectionBuffer.value.substring(
        detectionBuffer.value.length - maxDetectionBufferSize
      );
    }

    // 如果不在代码块中，检测代码块开始标记
    if (!isInCodeBlock.value) {
      // 在检测缓冲区中查找代码块开始标记
      const codeBlockStartMatch = detectionBuffer.value.match(/```(\w+)?/);
      if (codeBlockStartMatch) {
        isInCodeBlock.value = true;
        codeBlockBuffer.value = "";

        console.log("检测到代码块开始");

        // 找到代码块开始标记在完整内容中的位置
        const startMarkInContent = content.indexOf(codeBlockStartMatch[0]);
        if (startMarkInContent !== -1) {
          // 收集代码块开始标记及之后的内容（保留```符号）
          const contentAfterStart = content.substring(startMarkInContent);

          // 检查是否在当前内容中已经有结束标记
          const endMatch = contentAfterStart.substring(3).match(/```/);
          if (endMatch) {
            // 代码块在同一次更新中完成
            const fullCodeBlock = contentAfterStart.substring(0, endMatch.index + 6); // +6 = 3 for start ``` + 3 for end ```
            handleCompleteCodeBlock(fullCodeBlock);
            isInCodeBlock.value = false;
            codeBlockBuffer.value = "";
            detectionBuffer.value = ""; // 清空检测缓冲区
            console.log("代码块在同一次更新中完成");
          } else {
            // 代码块未完成，开始累积（包含开始的```）
            codeBlockBuffer.value = contentAfterStart;
          }
        }

        // 清空检测缓冲区
        detectionBuffer.value = "";
        return;
      }
    }

    // 如果在代码块中，检测结束标记并累积内容
    if (isInCodeBlock.value) {
      // 检测代码块结束标记
      if (detectionBuffer.value.includes("```")) {
        const endIndex = detectionBuffer.value.indexOf("```");

        // 计算需要添加到代码块缓冲区的内容（只添加到```为止，包含```）
        const contentToAdd = newContent.substring(
          0,
          newContent.length - (detectionBuffer.value.length - endIndex - 3)
        );
        const fullCodeBlock = codeBlockBuffer.value + contentToAdd;

        console.log("检测到代码块结束，完整代码块长度:", fullCodeBlock.length);

        // 处理完整的代码块
        handleCompleteCodeBlock(fullCodeBlock);

        // 重置状态
        isInCodeBlock.value = false;
        codeBlockBuffer.value = "";
        detectionBuffer.value = ""; // 清空检测缓冲区
        return;
      } else {
        // 继续累积内容
        codeBlockBuffer.value += newContent;
      }
    }
  };

  // 处理完整的代码块
  const handleCompleteCodeBlock = (fullCodeBlock: string) => {
    console.log("处理完整代码块:", { length: fullCodeBlock.length, fullCodeBlock });

    // 使用正则解析完整的代码块
    const codeBlockMatch = fullCodeBlock.match(/^```(\w+)?[\r\n]?([\s\S]*?)[\r\n]?```$/m);
    if (codeBlockMatch) {
      const language = codeBlockMatch[1] || "";
      const codeContent = codeBlockMatch[2] || "";

      console.log("解析出代码块:", { language, length: codeContent.length });

      // 先检查是否是差异格式
      if (!detectAndApplyDiff(codeContent)) {
        // 如果不是差异格式，按原有逻辑处理
        if (
          language === "html" ||
          language === "" ||
          codeContent.includes("<!DOCTYPE") ||
          codeContent.includes("<html")
        ) {
          // 直接处理HTML内容，不需要额外的函数调用
          processHtmlContent(codeContent.trim());
        }
      }
    } else {
      console.warn("无法解析代码块格式:", fullCodeBlock);
    }
  };

  // 重置监听器状态（在新对话开始时调用）
  const resetStreamMonitor = () => {
    isInCodeBlock.value = false;
    codeBlockBuffer.value = "";
    detectionBuffer.value = "";
    lastProcessedLength.value = 0;
    processedHtmlBlocks.value.clear();
    console.log("流式监听器状态已重置");
  };

  // 处理HTML内容的统一函数（避免重复逻辑）
  const processHtmlContent = (extractedHtml: string) => {
    // 生成内容的哈希值用于去重（使用安全的编码方式处理Unicode字符）
    const contentHash = btoa(encodeURIComponent(extractedHtml)).substring(0, 50);

    // 检查是否已经处理过这个内容
    if (processedHtmlBlocks.value.has(contentHash)) {
      console.log("HTML内容已处理过，跳过重复处理");
      return false;
    }

    // 检查是否为完整的HTML文档
    if (extractedHtml.includes("<html") || extractedHtml.includes("<!DOCTYPE")) {
      const newCode = extractedHtml;
      // 检查是否与当前代码相同，避免不必要的更新
      if (currentCode.value !== newCode) {
        currentCode.value = newCode;
        addToHistory(newCode);
        processedHtmlBlocks.value.add(contentHash);
        console.log("更新了完整HTML文档");
      }
      return true;
    }
    // 如果只是HTML片段，尝试将其包装为完整的HTML文档
    else if (extractedHtml.includes("<") && extractedHtml.includes(">")) {
      const wrappedHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI生成的页面</title>
</head>
<body>
${extractedHtml}
</body>
</html>`;
      // 检查是否与当前代码相同，避免不必要的更新
      if (currentCode.value !== wrappedHtml) {
        currentCode.value = wrappedHtml;
        addToHistory(wrappedHtml);
        processedHtmlBlocks.value.add(contentHash);
        console.log("更新了包装后的HTML文档");
      }
      return true;
    }

    return false;
  };

  const extractHtmlFromMarkdown = (content: string) => {
    // 只需要运行流式监听器，它会自动处理所有代码块
    // 包括HTML代码块，通过 handleCompleteCodeBlock -> processHtmlContent
    monitorStreamContent(content);
  };

  const updateCssInHtml = (cssContent: string) => {
    let html = currentCode.value;
    const originalHtml = html;
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/i;

    if (styleRegex.test(html)) {
      html = html.replace(styleRegex, "<style>\\n" + cssContent + "\\n</style>");
    } else {
      const headRegex = /<\/head>/i;
      if (headRegex.test(html)) {
        html = html.replace(
          headRegex,
          "    <style>\\n" + cssContent + "\\n    </style>\\n</head>"
        );
      }
    }

    // 只有在内容发生变化时才更新
    if (html !== originalHtml) {
      currentCode.value = html;
      addToHistory(html);
    }
  };

  const updateJsInHtml = (jsContent: string) => {
    let html = currentCode.value;
    const originalHtml = html;
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/i;

    if (scriptRegex.test(html)) {
      html = html.replace(scriptRegex, "<script>\\n" + jsContent + "\\n</script>");
    } else {
      const bodyEndTag = "</body>";
      if (html.includes(bodyEndTag)) {
        html = html.replace(
          bodyEndTag,
          "    <script>\\n" + jsContent + "\\n    </script>\\n" + bodyEndTag
        );
      }
    }

    // 只有在内容发生变化时才更新
    if (html !== originalHtml) {
      currentCode.value = html;
      addToHistory(html);
    }
  };

  const handleUndo = () => {
    if (canUndo.value) {
      const newIndex = currentHistoryIndex.value - 1;
      currentHistoryIndex.value = newIndex;
      currentCode.value = history.value[newIndex].code;
    }
  };

  const handleRedo = () => {
    if (canRedo.value) {
      const newIndex = currentHistoryIndex.value + 1;
      currentHistoryIndex.value = newIndex;
      currentCode.value = history.value[newIndex].code;
    }
  };

  const showHistory = () => {
    window.alert("历史记录功能将在未来版本中实现");
  };

  // 选择历史记录项
  const selectHistoryItem = (index: number) => {
    if (index >= 0 && index < history.value.length) {
      currentHistoryIndex.value = index;
      currentCode.value = history.value[index].code;
    }
  };

  // 获取当前版本号
  const currentVersion = computed(() => currentHistoryIndex.value + 1);

  // 获取历史记录总数
  const totalHistoryCount = computed(() => history.value.length);

  return {
    currentCode,
    isPreviewMode,
    editorTitle,
    isHtmlContent,
    canUndo,
    canRedo,
    togglePreview,
    extractHtmlFromMarkdown,
    updateCssInHtml,
    updateJsInHtml,
    handleUndo,
    handleRedo,
    showHistory,
    addToHistory,
    // 新增：历史记录相关
    history,
    currentHistoryIndex,
    currentVersion,
    totalHistoryCount,
    selectHistoryItem,
    generateHistoryTitle,
    // 新增：代码块监听相关
    monitorStreamContent,
    detectAndApplyDiff,
    handleCompleteCodeBlock,
    resetStreamMonitor,
    isInCodeBlock,
    codeBlockBuffer,
    detectionBuffer,
  };
}
