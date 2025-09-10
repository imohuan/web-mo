import { ref, computed, watch, onUnmounted, shallowRef, h, render } from "vue";
import * as monaco from "monaco-editor";
import { debounce } from "lodash-es";
import { DEFAULT_FORMAT_OPTIONS } from "@/constants/config";
import type { FileInfo, MonacoEditorOptions } from "./types";
import {
  getFileModel,
  findAndReplace,
  parseDiffContent,
  parseMultipleDiffContent,
  advancedFindAndReplace,
} from "./utils";
import DiffActionButtons from "./DiffActionButtons.vue";
import { formatCode } from "./formatter";

interface MonacoEditorConfig {
  files?: FileInfo[];
  defaultFileId?: number;
  onChange?: (content: string) => void;
  addToHistory?: (code: string, title?: string) => void;
}

export const useMonacoEditor = (config: MonacoEditorConfig = {}) => {
  const container = ref<HTMLElement | null>(null);
  const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const diffEditor = shallowRef<monaco.editor.IDiffEditor | null>(null);

  // 创建防抖的回调函数，彻底防止循环
  const debouncedOnChange = debounce((content: string) => {
    if (!currentFile.value) return;
    if (config.onChange) {
      config.onChange(content);
    }
  }, 300);

  const files = ref<FileInfo[]>(
    config.files || [
      { id: 1, name: "settings.json", language: "json", content: "{}" },
      {
        id: 2,
        name: "index.html",
        language: "html",
        content: `<!DOCTYPE html>
<html>
<head>
  <title>测试页面</title>
</head>
<body>
  <h1>欢迎</h1>
  <p>这是一个测试页面</p>
</body>
</html>`,
      },
    ]
  );

  const fileId = ref(config.defaultFileId || files.value[1]?.id || 1);
  const isDiffMode = ref(false);
  const currentChangeIndex = ref(0);
  const allChanges = ref<any[]>([]);
  const activeWidgets = ref<any[]>([]);

  const currentFile = computed(() =>
    files.value.find((file) => file.id === fileId.value)
  );

  const getModel = () => {
    if (!currentFile.value) return null;
    return getFileModel(currentFile.value);
  };

  const applyEditorOptions = (options: MonacoEditorOptions) => {
    if (!editor.value) return;

    // 提取 prettier 配置
    const { prettier, ...monacoOptions } = options;
    editor.value.updateOptions(monacoOptions);

    // 更新 settings.json 文件
    const settingsFile = files.value.find((f) => f.name === "settings.json");
    if (settingsFile) {
      settingsFile.content = JSON.stringify(options, null, 2);
    }
  };

  const autoApplyOptions = debounce(() => {
    if (!editor.value || !currentFile.value || isUpdatingFromEditor.value) return;

    if (currentFile.value.name === "settings.json") {
      try {
        const options = JSON.parse(currentFile.value.content);
        applyEditorOptions(options);
      } catch (error) {
        console.error("解析设置失败:", error);
      }
    }
  }, 1000);

  const formatCurrentDocument = async () => {
    if (!editor.value) return;
    // 格式化操作会触发 onDidChangeModelContent 事件，标记为内部更新
    isUpdatingFromExternal.value = true;

    await editor.value.getAction("editor.action.formatDocument")?.run();

    // const formatted = await formatCode(editor.value.getValue(), currentFile.value?.language || "html");
    // editor.value.setValue(formatted);

    setTimeout(() => {
      isUpdatingFromExternal.value = false;
    }, 100);
  };

  const debouncedFormatDocument = debounce(formatCurrentDocument, 500);

  // 添加标志位防止循环更新
  const isUpdatingFromEditor = ref(false);
  const isUpdatingFromExternal = ref(false);

  const updateCurrentFileContent = (content: string) => {
    if (!currentFile.value || isUpdatingFromExternal.value) return;

    // 仅在内容真正改变时更新，避免无限循环
    if (currentFile.value.content === content) return;

    isUpdatingFromEditor.value = true;
    currentFile.value.content = content;

    // 使用延迟防抖，完全避免同步循环
    if (config.onChange) {
      debouncedOnChange(content);
    }

    // 自动应用设置，但仅限于settings.json
    if (currentFile.value.name === "settings.json") {
      autoApplyOptions();
    }

    // 重置标志位
    setTimeout(() => {
      isUpdatingFromEditor.value = false;
    }, 0);
  };

  // 差异功能（来自output.html的applyDiff功能）
  const applyDiff = (diffContent: string) => {
    // 检查是否包含多个diff块
    const multipleDiffRegex = /-------\s*SEARCH[\s\S]*?\+\+\+\+\+\+\+\s*REPLACE[\s\S]*?-------\s*SEARCH/;
    const isMultipleDiff =
      multipleDiffRegex.test(diffContent) ||
      (diffContent.match(/-------\s*SEARCH/g) || []).length > 1;

    let originalContent = currentFile.value?.content || "";
    let modifiedContent = "";

    if (isMultipleDiff) {
      // 处理多个diff块
      const diffBlocks = parseMultipleDiffContent(diffContent);
      if (diffBlocks.length === 0) {
        throw new Error("未找到有效的差异内容");
      }

      const result = advancedFindAndReplace(originalContent, diffBlocks);
      modifiedContent = result.content;

      // 显示应用结果
      if (result.appliedCount > 0) {
        console.log(
          `✅ 已成功应用 ${result.appliedCount}/${diffBlocks.length} 个替换操作`
        );
        if (result.failedBlocks.length > 0) {
          console.warn(
            `⚠️ ${result.failedBlocks.length} 个替换操作失败:`,
            result.failedBlocks
          );
        }
      } else {
        // throw new Error("所有替换操作都失败了，请检查搜索内容是否存在");
        console.log("所有替换操作都失败了，请检查搜索内容是否存在");
      }
    } else {
      // 处理单个diff块
      const { search, replace } = parseDiffContent(diffContent);
      if (!search.trim()) {
        throw new Error("请输入搜索内容");
      }
      modifiedContent = findAndReplace(originalContent, search, replace);
    }

    if (originalContent !== modifiedContent) {
      createDiffEditor(originalContent, modifiedContent);
    } else {
      throw new Error("未找到匹配的内容进行替换");
    }
  };

  const acceptAllChanges = () => {
    if (!diffEditor.value || !currentFile.value) return;

    const modifiedContent = diffEditor.value.getModifiedEditor().getValue();

    // 1. 清理差异模式状态
    clearAllWidgets();
    allChanges.value = [];
    currentChangeIndex.value = 0;

    // 2. 更新状态
    isUpdatingFromExternal.value = true;
    currentFile.value.content = modifiedContent;
    isDiffMode.value = false;

    // 3. 清理旧的 diff 编辑器实例
    diffEditor.value.dispose();
    diffEditor.value = null;
    if (editor.value) {
      editor.value.dispose();
      editor.value = null;
    }

    // 4. 重新创建常规编辑器，它会自动从 currentFile 获取最新内容
    createNormalEditor();

    // 5. 将差异应用后的代码添加到历史记录
    if (config.addToHistory) {
      config.addToHistory(modifiedContent, "差异应用");
    }

    setTimeout(() => {
      isUpdatingFromExternal.value = false;
    }, 0);
  };

  const setContent = (content: string) => {
    const indexFile = files.value.find((f) => f.name === "index.html");
    console.log('setContent 被调用:', {
      content: content.substring(0, 50) + '...',
      indexFile: indexFile?.name,
      currentContent: indexFile?.content?.substring(0, 50) + '...',
      contentChanged: indexFile?.content !== content
    });

    // 只更新状态，让统一的 watch 监听器来同步到编辑器
    if (indexFile && indexFile.content !== content) {
      isUpdatingFromExternal.value = true;
      indexFile.content = content;
      console.log('文件内容已更新，触发 watch');
      setTimeout(() => {
        isUpdatingFromExternal.value = false;
      }, 0);
    }
  };

  const getContent = () => {
    if (editor.value && !isDiffMode.value) {
      return editor.value.getValue();
    }
    return currentFile.value?.content || "";
  };

  const createNormalEditor = () => {
    if (!container.value) return;

    const defaultOptions: MonacoEditorOptions = {
      theme: "tw-light",
      automaticLayout: true,
      minimap: { enabled: true, maxColumn: 120 },
      scrollBeyondLastLine: false,
      fontSize: 14,
      tabSize: 2,
      fontWeight: "700",
      wordWrap: "off",
      mouseWheelZoom: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      suggest: {
        showColors: true,
        preview: true,
        showDeprecated: false,
      },
      prettier: DEFAULT_FORMAT_OPTIONS,
    };

    // 初始化配置文件, 如果存在配置
    const settingsFile = files.value.find((f) => f.name === "settings.json");
    if (settingsFile) {
      try {
        const settings = JSON.parse(settingsFile.content);
        // 将配属数据和默认数据合并
        Object.assign(defaultOptions, settings);
      } catch (error) {
        console.error("设置文件解析失败，使用默认设置:", error);
        settingsFile.content = JSON.stringify(defaultOptions, null, 2);
      }
    } else {
      // 创建默认设置文件
      const settings: FileInfo = {
        id: Date.now(),
        name: "settings.json",
        language: "json",
        content: JSON.stringify(defaultOptions, null, 2),
      };
      files.value.unshift(settings);
    }

    editor.value = monaco.editor.create(container.value, {
      model: getModel(),
      ...defaultOptions,
    });

    // 当编辑器内容改变时（用户输入、格式化等），更新 Vue ref
    editor.value.onDidChangeModelContent(() => {
      // 防止在外部更新时触发循环
      if (isUpdatingFromExternal.value) return;

      const newContent = editor.value?.getValue();
      if (
        currentFile.value &&
        newContent !== undefined &&
        currentFile.value.content !== newContent
      ) {
        // 将编辑器的更改同步到 Vue ref
        updateCurrentFileContent(newContent);
      }
    });

    // 注册格式化命令 ctrl + s 保存
    editor.value.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      if (editor.value && currentFile.value) {
        updateCurrentFileContent(editor.value.getValue() || "");
        await formatCurrentDocument();
      }
    });

    // 切换到设置文件 ctrl + , 跳转到设置文件
    editor.value.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Comma, () => {
      if (!currentFile.value || !editor.value) return;

      const currentFileId = fileId.value;
      const currentState = editor.value.saveViewState();
      fileId.value = fileId.value === 1 ? 2 : 1;

      const model = getModel();
      if (model) {
        const oldFile = files.value.find((f) => f.id === currentFileId);
        if (oldFile) oldFile.state = currentState;
        editor.value.setModel(model);
        if (currentFile.value.state) {
          editor.value.restoreViewState(currentFile.value.state);
        }
      }
    });
  };

  // 清除所有小部件
  const clearAllWidgets = () => {
    if (!diffEditor.value) return;
    const modifiedEditor = diffEditor.value.getModifiedEditor();
    activeWidgets.value.forEach((widget) => {
      // 卸载 Vue 组件
      const domNode = widget.getDomNode();
      if (domNode) {
        render(null, domNode);
      }
      // 移除 Monaco Editor 小部件
      modifiedEditor.removeContentWidget(widget);
    });
    activeWidgets.value = [];
  };

  const getDiffEditorWidth = (modifiedEditor: any) => {
    // 使用更可靠的方法获取编辑器宽度
    let width = 800; // 默认宽度
    try {
      // 方法1: 尝试从修改后的编辑器获取宽度
      const modifiedEditorDom = modifiedEditor.getDomNode();
      if (modifiedEditorDom) {
        const rect = modifiedEditorDom.getBoundingClientRect();
        if (rect.width > 0) {
          width = rect.width;
          console.log("方法1: 从修改后的编辑器获取宽度", width, modifiedEditorDom);
        }
      }

      // 方法2: 如果方法1失败，尝试从容器获取
      if (width === 800 && container.value) {
        const containerRect = container.value.getBoundingClientRect();
        if (containerRect.width > 0) {
          width = containerRect.width / 2; // diff编辑器通常是一半宽度
          console.log("方法2: 从容器获取宽度", width);

        }
      }

      // 方法3: 最后的备选方案
      if (width === 800) {
        const editorElements = container.value?.querySelectorAll(".monaco-editor");
        if (editorElements && editorElements.length > 0) {
          // 尝试找到最后一个编辑器元素（通常是修改后的编辑器）
          const lastEditor = editorElements[editorElements.length - 1];
          const viewLines = lastEditor?.querySelector(".view-lines");
          if (viewLines) {
            const rect = viewLines.getBoundingClientRect();
            if (rect.width > 0) {
              width = rect.width;
              console.log("方法3: 从最后一个编辑器获取宽度", width);
            }
          }
        }
      }
    } catch (error) {
      console.warn("获取编辑器宽度失败，使用默认值:", error);
      width = 800;
    }
    return width - 40;
  }

  // 添加区域右下角按钮
  const addActionButtonsToChange = (changeObj: any) => {
    if (!diffEditor.value) return;

    const modifiedEditor = diffEditor.value.getModifiedEditor();
    const lineNumber = changeObj.modifiedEndLineNumber;

    const width = getDiffEditorWidth(modifiedEditor);
    console.log("计算得到的编辑器宽度:", width);

    // 如果宽度仍然无效，跳过按钮创建
    if (width <= 0) {
      console.warn("编辑器宽度无效，跳过按钮创建");
      return;
    }

    // 创建容器 DOM 节点，contentWidget 会修改这个元素的display为block，所以我只能在容器中新建一个容器
    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "absolute";
    buttonContainer.style.pointerEvents = "auto";
    buttonContainer.style.zIndex = "1000";

    // 这样做是为了使用flex布局的justifyContent:flex-end方法，因为父容器display无法设置为flex
    const innerBox = document.createElement("div");
    innerBox.style.display = "flex";
    innerBox.style.width = `${width - 30}px`;
    innerBox.style.justifyContent = "flex-end";
    innerBox.style.alignItems = "center";
    buttonContainer.appendChild(innerBox);

    // 使用 Vue 的 render 函数创建按钮组件
    const vnode = h(DiffActionButtons, {
      change: changeObj,
      onAccept: (change: any) => {
        acceptSpecificChange(change);
      },
      onUndo: (change: any) => {
        undoSpecificChange(change);
      },
    });

    // 将 Vue 组件渲染到 DOM 节点
    render(vnode, innerBox);

    const contentWidget = {
      getId: () => `diff.action.buttons.${lineNumber}`,
      getDomNode: () => buttonContainer,
      getPosition: () => {
        return {
          position: {
            lineNumber: lineNumber,
            column: 0, // 放在行的最右侧
          },
          positionAffinity: monaco.editor.PositionAffinity.RightOfInjectedText,
          preference: [monaco.editor.ContentWidgetPositionPreference.BELOW],
        };
      },
    };

    modifiedEditor.addContentWidget(contentWidget);
    activeWidgets.value.push(contentWidget);
  };

  // 自动退出diff模式（当没有变化时）
  const autoExitDiffMode = () => {
    if (!isDiffMode.value || !diffEditor.value) return false;

    const changes = diffEditor.value.getLineChanges();
    if (!changes || changes.length === 0) {
      console.log("没有检测到差异，自动退出diff模式");

      // 获取当前内容，但不通过acceptAllChanges添加到历史记录（避免重复）
      const modifiedContent = diffEditor.value.getModifiedEditor().getValue();

      // 清理差异模式状态
      clearAllWidgets();
      allChanges.value = [];
      currentChangeIndex.value = 0;

      // 更新状态
      isUpdatingFromExternal.value = true;
      if (currentFile.value) {
        currentFile.value.content = modifiedContent;
      }
      isDiffMode.value = false;

      // 清理旧的 diff 编辑器实例
      diffEditor.value.dispose();
      diffEditor.value = null;
      if (editor.value) {
        editor.value.dispose();
        editor.value = null;
      }

      // 重新创建常规编辑器
      createNormalEditor();

      setTimeout(() => {
        isUpdatingFromExternal.value = false;
      }, 0);

      return true;
    }
    return false;
  };

  // 更新差异按钮
  const updateDiffButtons = () => {
    if (!isDiffMode.value || !diffEditor.value) return;

    // 检查是否需要自动退出diff模式
    if (autoExitDiffMode()) {
      return;
    }

    // 清除所有现有的小部件
    clearAllWidgets();
    // 获取差异信息
    const changes = diffEditor.value.getLineChanges();
    if (changes) {
      changes.forEach((change) => {
        if (change.modifiedEndLineNumber > 0) {
          addActionButtonsToChange(change);
        }
      });
    }
  };

  // 接受特定区域的更改
  const acceptSpecificChange = (change: any) => {
    if (!isDiffMode.value || !diffEditor.value) return;

    const originalModel = diffEditor.value.getOriginalEditor().getModel();
    const modifiedModel = diffEditor.value.getModifiedEditor().getModel();

    if (!originalModel || !modifiedModel) return;

    const originalContent = originalModel.getValue();
    const modifiedContent = modifiedModel.getValue();

    const originalLines = originalContent.split("\n");
    const modifiedLines = modifiedContent.split("\n");

    // 根据change对象的行号范围来合并更改
    // 注意：Monaco的行号是1-based，数组索引是0-based
    const originalStart = change.originalStartLineNumber - 1;
    const originalEnd = change.originalEndLineNumber;
    const modifiedStart = change.modifiedStartLineNumber - 1;
    const modifiedEnd = change.modifiedEndLineNumber;

    // 创建新的内容：保留未修改区域，只应用当前更改
    let newLines = [];

    // 添加当前更改之前的原始内容
    newLines.push(...originalLines.slice(0, originalStart));

    // 添加当前区域的修改内容
    newLines.push(...modifiedLines.slice(modifiedStart, modifiedEnd));

    // 添加当前更改之后的原始内容（跳过被替换的部分）
    newLines.push(...originalLines.slice(originalEnd));

    const newContent = newLines.join("\n");

    // 更新原始模型为新内容（已应用特定更改）
    originalModel.setValue(newContent);

    // 更新按钮，增加延迟确保DOM重新渲染完成
    setTimeout(() => {
      updateDiffButtons();
      updateDiffNavigator();
    }, 200);
  };

  // 撤销特定区域的更改
  const undoSpecificChange = (change: any) => {
    if (!isDiffMode.value || !diffEditor.value) return;

    const originalModel = diffEditor.value.getOriginalEditor().getModel();
    const modifiedModel = diffEditor.value.getModifiedEditor().getModel();

    if (!originalModel || !modifiedModel) return;

    const originalContent = originalModel.getValue();
    const modifiedContent = modifiedModel.getValue();

    const originalLines = originalContent.split("\n");
    const modifiedLines = modifiedContent.split("\n");

    // 撤销逻辑：将修改后的内容恢复为原始内容
    const originalStart = change.originalStartLineNumber - 1;
    const originalEnd = change.originalEndLineNumber;
    const modifiedStart = change.modifiedStartLineNumber - 1;
    const modifiedEnd = change.modifiedEndLineNumber;

    let newLines = [];

    // 添加当前更改之前的修改内容
    newLines.push(...modifiedLines.slice(0, modifiedStart));

    // 添加当前区域的原始内容
    newLines.push(...originalLines.slice(originalStart, originalEnd));

    // 添加当前更改之后的修改内容
    newLines.push(...modifiedLines.slice(modifiedEnd));

    const newContent = newLines.join("\n");

    // 更新修改模型为新内容（已撤销特定更改）
    modifiedModel.setValue(newContent);

    // 更新按钮，增加延迟确保DOM重新渲染完成
    setTimeout(() => {
      updateDiffButtons();
      updateDiffNavigator();
    }, 200);
  };

  // 差异导航功能
  const navigateToPreviousChange = () => {
    if (allChanges.value.length === 0) return;

    currentChangeIndex.value =
      (currentChangeIndex.value - 1 + allChanges.value.length) % allChanges.value.length;
    jumpToChange(currentChangeIndex.value);
  };

  const navigateToNextChange = () => {
    if (allChanges.value.length === 0) return;

    currentChangeIndex.value = (currentChangeIndex.value + 1) % allChanges.value.length;
    jumpToChange(currentChangeIndex.value);
  };

  // 跳转到指定更改
  const jumpToChange = (index: number) => {
    if (index < 0 || index >= allChanges.value.length || !diffEditor.value) return;

    const change = allChanges.value[index];
    const modifiedEditor = diffEditor.value.getModifiedEditor();
    const lineNumber = Math.max(1, change.modifiedStartLineNumber);

    setTimeout(() => {
      modifiedEditor.revealLineInCenter(lineNumber);
      const maxColumn = Math.max(
        1,
        modifiedEditor.getModel()?.getLineMaxColumn(lineNumber) || 1
      );
      modifiedEditor.setPosition({
        lineNumber: lineNumber,
        column: Math.min(2, maxColumn),
      });
      modifiedEditor.focus();
    }, 50);
  };

  // 更新差异导航器
  const updateDiffNavigator = () => {
    if (!isDiffMode.value || !diffEditor.value) return;

    try {
      const changes = diffEditor.value.getLineChanges() || [];
      allChanges.value = changes;

      // 检查是否需要自动退出diff模式
      if (changes.length === 0) {
        console.log("导航器检测到无差异，自动退出diff模式");

        // 获取当前内容并添加到历史记录
        const modifiedContent = diffEditor.value.getModifiedEditor().getValue();
        if (config.addToHistory) {
          config.addToHistory(modifiedContent, "差异应用完成");
        }

        // 调用autoExitDiffMode而不是acceptAllChanges，避免重复添加历史记录
        autoExitDiffMode();
        return;
      }

      currentChangeIndex.value = Math.min(currentChangeIndex.value, changes.length - 1);
    } catch (error) {
      console.error("更新导航器时出错:", error);
    }
  };

  const createDiffEditor = (originalContent: string, modifiedContent: string) => {
    if (!container.value) return;

    if (editor.value) {
      editor.value.dispose();
      editor.value = null;
    }

    isDiffMode.value = true;

    const originalModel = monaco.editor.createModel(
      originalContent,
      currentFile.value?.language || "html"
    );
    const modifiedModel = monaco.editor.createModel(
      modifiedContent,
      currentFile.value?.language || "html"
    );

    diffEditor.value = monaco.editor.createDiffEditor(container.value, {
      readOnly: false,
      renderSideBySide: false,
      ignoreTrimWhitespace: false,
      automaticLayout: true,
    });

    diffEditor.value.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    // 延迟确保编辑器完全加载
    setTimeout(() => {
      updateDiffButtons();
      updateDiffNavigator();
    }, 100);

    // 监听差异更新，动态调整按钮和导航器
    diffEditor.value.onDidUpdateDiff(() => {
      updateDiffButtons();
      updateDiffNavigator();
    });
  };

  const switchFile = (newFileId: number) => {
    if (fileId.value === newFileId || !editor.value || isDiffMode.value) return;

    // 保存当前文件的视图状态，内容已通过 onDidChangeModelContent 自动同步
    const oldFile = currentFile.value;
    if (oldFile) {
      oldFile.state = editor.value.saveViewState();
    }

    // 切换 ID，让 watch 处理器来更新编辑器模型
    fileId.value = newFileId;
  };

  // 统一的 watch 监听器，处理文件切换和外部内容变更
  watch(
    currentFile,
    (newFile, oldFile) => {
      if (!editor.value || !newFile || isUpdatingFromEditor.value) return;

      const editorContent = editor.value.getValue();

      // 场景1：文件已切换
      if (oldFile && newFile.id !== oldFile.id) {
        const model = getModel();
        if (model) {
          isUpdatingFromExternal.value = true;
          editor.value.setModel(model);
          if (newFile.state) {
            editor.value.restoreViewState(newFile.state);
          }
          editor.value.focus();
          setTimeout(() => {
            isUpdatingFromExternal.value = false;
          }, 0);
        }
      }
      // 场景2：文件内容从外部被修改
      else if (editorContent !== newFile.content) {
        console.log('检测到外部内容变化:', {
          editorContent: editorContent.substring(0, 50) + '...',
          newContent: (newFile.content || '').substring(0, 50) + '...',
          isUpdatingFromExternal: isUpdatingFromExternal.value
        });
        const position = editor.value.getPosition();
        isUpdatingFromExternal.value = true;
        // 用新内容更新编辑器
        editor.value.setValue(newFile.content || "");
        if (position) {
          editor.value.setPosition(position);
        }
        setTimeout(() => {
          isUpdatingFromExternal.value = false;
        }, 0);
      }
    },
    {
      // 确保在编辑器初始化后，立即将初始文件的内容同步进去
      immediate: true,
      // 添加深度监听以确保能检测到文件内容的变化
      deep: true,
    }
  );

  onUnmounted(() => {
    clearAllWidgets();
    if (editor.value) {
      editor.value.dispose();
    }
    if (diffEditor.value) {
      diffEditor.value.dispose();
    }
  });

  return {
    container,
    files,
    fileId,
    currentFile,
    editor,
    diffEditor,
    isDiffMode,
    currentChangeIndex,
    allChanges,

    createNormalEditor,
    createDiffEditor,
    formatCurrentDocument,
    applyDiff,
    acceptAllChanges,
    acceptSpecificChange,
    undoSpecificChange,
    switchFile,
    setContent,
    getContent,
    updateCurrentFileContent,
    updateDiffButtons,
    navigateToPreviousChange,
    navigateToNextChange,
    jumpToChange,
  };
};
