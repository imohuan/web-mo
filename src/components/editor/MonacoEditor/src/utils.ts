import * as monaco from "monaco-editor";
import type { DiffContent, FileInfo } from "./types";

export const getLanguageByFileName = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const languageMap: Record<string, string> = {
    html: "html",
    htm: "html",
    css: "css",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    vue: "vue",
    java: "java",
    py: "python",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    xml: "xml",
    yml: "yaml",
    yaml: "yaml",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    bat: "bat",
    ps1: "powershell",
  };
  return languageMap[extension] || "plaintext";
};

export const getFileModel = (file: FileInfo) => {
  if (!file) return;
  const { name, language, content } = file;
  const uri = monaco.Uri.parse(`file:///${name}`);
  let model = monaco.editor.getModel(uri);

  if (model) {
    // 如果模型已存在，直接返回它。内容同步将由 useMonacoEditor hook 统一处理。
    return model;
  }

  // 如果模型不存在，则创建一个新的
  return monaco.editor.createModel(content, language, uri);
};

// 解析差异内容（来自output.html的函数）
export const parseDiffContent = (content: string): DiffContent => {
  const lines = content.split("\n");
  let searchContent = "";
  let replaceContent = "";
  let currentSection: "search" | "replace" | null = null;

  for (const line of lines) {
    if (/-------\s*SEARCH/.test(line)) {
      currentSection = "search";
      continue;
    } else if (/=======/.test(line)) {
      currentSection = "replace";
      continue;
    } else if (/\+\+\+\+\+\+\+\s*REPLACE/.test(line)) {
      break;
    } else if (currentSection) {
      if (currentSection === "search") {
        searchContent += line + "\n";
      } else if (currentSection === "replace") {
        replaceContent += line + "\n";
      }
    }
  }

  return {
    search: searchContent.trimEnd(),
    replace: replaceContent.trimEnd(),
  };
};

// 解析多个差异内容块
export const parseMultipleDiffContent = (content: string): DiffContent[] => {
  const diffBlocks: DiffContent[] = [];
  const blocks = content.split(/(?=-------\s*SEARCH)/);

  for (const block of blocks) {
    if (block.trim()) {
      const parsed = parseDiffContent(block);
      if (parsed.search.trim()) {
        diffBlocks.push(parsed);
      }
    }
  }

  return diffBlocks;
};

// 查找并替换内容（来自output.html的函数）
export const findAndReplace = (
  originalContent: string,
  searchContent: string,
  replaceContent: string
): string => {
  let modified = originalContent;

  if (originalContent.includes(searchContent)) {
    modified = originalContent.replace(searchContent, replaceContent);
  } else {
    // 如果未找到，尝试按行匹配
    const originalLines = originalContent.split("\n");
    const searchLines = searchContent.split("\n");
    const replaceLines = replaceContent.split("\n");

    if (searchLines.length > 1) {
      for (let i = 0; i < originalLines.length - searchLines.length + 1; i++) {
        const slice = originalLines.slice(i, i + searchLines.length);
        if (slice.join("\n") === searchLines.join("\n")) {
          originalLines.splice(i, searchLines.length, ...replaceLines);
          modified = originalLines.join("\n");
          break;
        }
      }
    }
  }

  return modified;
};

// 高级查找替换功能：处理多个替换区域
export const advancedFindAndReplace = (
  originalContent: string,
  diffBlocks: DiffContent[]
): { content: string; appliedCount: number; failedBlocks: DiffContent[] } => {
  let modifiedContent = originalContent;
  let appliedCount = 0;
  const failedBlocks: DiffContent[] = [];

  // 按照出现顺序处理替换
  for (const block of diffBlocks) {
    const beforeContent = modifiedContent;
    modifiedContent = findAndReplace(modifiedContent, block.search, block.replace);

    if (modifiedContent !== beforeContent) {
      appliedCount++;
    } else {
      failedBlocks.push(block);
    }
  }

  return {
    content: modifiedContent,
    appliedCount,
    failedBlocks
  };
};

// 监控文件名的改变
export const watchFileName = (fileName: string, callBack: (language: string) => void) => {
  const language = getLanguageByFileName(fileName);
  callBack(language);
};
