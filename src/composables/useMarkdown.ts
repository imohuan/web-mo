import { marked } from "marked";
import { getMarkdownButtonIcons } from "@/utils/icons";
// @ts-ignore
import hljs from "highlight.js";

// 转义HTML，防止XSS攻击
const escapeHTML = (str: string) =>
  str.replace(
    /[&<>'"]/g,
    (tag) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }[tag] || tag)
  );

export function useMarkdown() {
  // 可选的回调函数，用于处理代码预览
  let onCodePreview: ((code: string, lang: string) => void) | null = null;

  const setCodePreviewHandler = (handler: (code: string, lang: string) => void) => {
    onCodePreview = handler;
  };

  const renderMarkdown = (content: string): string => {
    try {
      // 配置marked渲染器
      const renderer = new marked.Renderer();
      const icons = getMarkdownButtonIcons();

      // 自定义代码块渲染（包含代码高亮）
      renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
        const language = lang || "text";
        const isHtml = language.toLowerCase() === "html";

        // 使用 highlight.js 进行代码高亮
        let highlightedCode;
        if (language && language !== "text" && hljs.getLanguage(language)) {
          try {
            highlightedCode = hljs.highlight(text, { language }).value;
          } catch (e) {
            console.warn("代码高亮失败:", e);
            highlightedCode = escapeHTML(text);
          }
        } else {
          highlightedCode = escapeHTML(text);
        }

        return `<div class="code-block mb-4">
          <div class="code-header bg-gray-100 text-gray-700 px-4 py-2 flex items-center justify-between border border-gray-200 rounded-t-md">
            <div class="flex items-center gap-2">
              <button onclick="toggleCodeFold(this)" class="fold-btn text-gray-500 hover:text-gray-700 transition-colors" title="折叠/展开代码">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <span class="text-sm font-medium uppercase">${language}</span>
            </div>
            <div class="flex items-center gap-1">
              ${isHtml
            ? `<button onclick="previewCode(this, '${language}')" class="code-action-btn p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all" title="在编辑器中预览">
                ${icons.previewIcon}
              </button>`
            : ""
          }
              <button onclick="copyCode(this)" class="code-action-btn p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all" title="复制代码">
                ${icons.copyIcon}
              </button>
            </div>
          </div>
          <div class="code-content">
            <pre class="bg-gray-50 text-gray-800 p-0! border border-t-0 border-gray-200 rounded-b-md overflow-x-auto max-h-[500px] overflow-y-auto"><code class="hljs language-${language}">${highlightedCode}</code></pre>
          </div>
        </div>`;
      };

      // 自定义内联代码渲染
      renderer.codespan = ({ text }: { text: string }) => {
        return `<code class="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono">${escapeHTML(
          text
        )}</code>`;
      };

      // 设置marked选项
      marked.setOptions({
        renderer,
        breaks: true,
        gfm: true,
      });

      return marked(content) as string;
    } catch (error) {
      console.error("Markdown渲染错误:", error);
      return content.replace(/\n/g, "<br>");
    }
  };

  const formatTime = (date: Date | string): string => {
    const now = new Date();
    const inputDate = typeof date === "string" ? new Date(date) : date;

    const diff = now.getTime() - inputDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;

    return inputDate.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const setupCopyCodeFunction = () => {
    // 全局函数：复制代码
    (window as any).copyCode = function (button: HTMLElement) {
      const codeBlock = button.closest(".code-block");
      const code = codeBlock?.querySelector("code")?.textContent;

      if (!code) return;

      const icons = getMarkdownButtonIcons();

      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(code)
          .then(() => {
            const originalText = button.innerHTML;
            button.innerHTML = icons.checkIcon;
            button.style.color = "#10b981";

            setTimeout(() => {
              button.innerHTML = originalText;
              button.style.color = "";
            }, 2000);
          })
          .catch((err) => {
            console.error("复制失败:", err);
          });
      } else {
        // 备用方案
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        const originalText = button.innerHTML;
        button.innerHTML = "✓";
        button.style.color = "#10b981";

        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.color = "";
        }, 2000);
      }
    };

    // 全局函数：预览代码
    (window as any).previewCode = function (button: HTMLElement, lang: string) {
      const codeBlock = button.closest(".code-block");
      const code = codeBlock?.querySelector("code")?.textContent;

      if (code && onCodePreview) {
        onCodePreview(code, lang);

        const icons = getMarkdownButtonIcons();
        // 显示反馈
        const originalText = button.innerHTML;
        button.innerHTML = icons.checkIcon;
        button.style.color = "#10b981";

        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.color = "";
        }, 1500);
      }
    };

    // 全局函数：折叠/展开代码
    (window as any).toggleCodeFold = function (button: HTMLElement) {
      const codeBlock = button.closest(".code-block");
      const codeContent = codeBlock?.querySelector(".code-content") as HTMLElement;
      const svg = button.querySelector("svg") as SVGElement;

      if (codeContent && svg) {
        const isCollapsed = codeContent.style.display === "none";

        if (isCollapsed) {
          // 展开
          codeContent.style.display = "block";
          svg.style.transform = "rotate(90deg)";
        } else {
          // 折叠
          codeContent.style.display = "none";
          svg.style.transform = "rotate(0deg)";
        }
      }
    };
  };

  return {
    renderMarkdown,
    formatTime,
    setupCopyCodeFunction,
    setCodePreviewHandler,
  };
}
