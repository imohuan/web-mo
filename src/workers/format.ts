import prettier from "prettier/standalone";
import type { Options } from "prettier"

export const formatCodeForPrettier = async (code: string, language: string, prettierOptions: any = {}) => {
  try {
    let parser;
    // 确定正确的解析器
    switch (language) {
      case "html":
        parser = "html";
        break;
      case "typescript":
      case "ts":
        parser = "typescript";
        break;
      case "javascript":
      case "js":
        parser = "babel";
        break;
      case "css":
        parser = "css";
        break;
      case "json":
        parser = "json";
        break;
      default:
        parser = language || "babel";
    }

    // 加载所有必要的解析器插件
    const plugins = [
      await import('prettier/parser-html'),
      await import('prettier/parser-babel'),
      await import('prettier/parser-postcss'),
      await import('prettier/parser-typescript'),
    ];

    // 确保格式化选项中包含embeddedLanguageFormatting设置
    const formatOption: Options = {
      ...prettierOptions,
      parser,
      plugins,
      embeddedLanguageFormatting: "auto", // 关键设置：确保格式化嵌入式语言
    }

    // 确保使用正确的parser
    console.log("格式化选项:", JSON.stringify({ ...formatOption, plugins: '已加载' }, null, 2));

    // 使用Prettier格式化代码
    const formattedCode = await prettier.format(code, formatOption);
    return formattedCode;
  } catch (error) {
    console.error("格式化错误:", error);
    return code; // 出错时返回原始代码
  }
}

self.addEventListener('message', async (event) => {
  const { id, code, language, options } = event.data;
  console.log("收到格式化请求:", { id, language });

  try {
    // 确保options中包含embeddedLanguageFormatting
    const formattingOptions = {
      ...options,
      embeddedLanguageFormatting: "auto" // 强制设置为auto
    };
    const formatted = await formatCodeForPrettier(code, language, formattingOptions);
    self.postMessage({ id, code: formatted });
  } catch (error) {
    console.error("处理格式化失败:", error);
    self.postMessage({ id, code }); // 出错时返回原始代码
  }
});