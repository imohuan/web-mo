<template>
  <div>
    <div v-html="renderedContent" class="select-text markdown-body"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, } from 'vue'
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github.css';
import { useEventListener } from '@vueuse/core';
import DOMPurify from 'dompurify';

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(unescapeHtml(code), { language }).value;
    }
  })
);

const unescapeHtml = (safe: string) => {
  return safe
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const escapeHtmlOutsideCodeBlocks = (text: string) => {
  const codeBlockRegex = /(`{1,3})[\s\S]*?\1/g;
  let result = '';
  let lastIndex = 0;
  text.replace(codeBlockRegex, (match: string, p1: string, offset: number): any => {
    // 转义代码块之前的文本
    result += escapeHtml(text.slice(lastIndex, offset));
    // 保留代码块
    result += match;
    lastIndex = offset + match.length;
  });
  // 处理最后一个代码块之后的文本
  result += escapeHtml(text.slice(lastIndex));
  return result;
}

const props = defineProps<{ content: string }>();
const renderedContent = computed(() => {
  // 将没有被代码块包裹的html代码进行转义
  const content = escapeHtmlOutsideCodeBlocks(props.content)
  const code = marked.parse(content) as string
  return DOMPurify.sanitize(code)
})

useEventListener("mousemove", (event: any) => {
  if (event.target.tagName === 'PRE' || event.target.tagName === 'CODE') {
    let pre = event.target.closest('pre');
    if (!pre.querySelector('.copy-button')) {
      let button = document.createElement('button');
      button.textContent = '复制';
      button.className = 'copy-button';
      pre.style.position = 'relative';
      pre.classList.add("group")
      pre.appendChild(button);

      button.addEventListener('click', function () {
        let code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.textContent).then(() => {
          button.textContent = '已复制!';
          setTimeout(() => button.textContent = '复制', 2000);
        }).catch(err => {
          console.error('复制失败:', err);
        });
      });
    }
  }
})
</script>


<style lang="scss">
.markdown-body {

  ul,
  ol {
    list-style: auto;
  }
}

.copy-button {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px 12px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 5px;
  visibility: hidden;
  @apply group-hover:visible;
}

.copy-button:hover {
  background-color: #3367d6;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.copy-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 可选：添加图标 */
.copy-button::before {
  content: "📋";
  font-size: 16px;
}

/* 可选：复制成功时的样式 */
.copy-button.success {
  background-color: #34a853;
}
</style>