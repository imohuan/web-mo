import * as monaco from "monaco-editor";
import { DEFAULT_FORMAT_OPTIONS } from "@/constants/config";
import FormatWorker from "@/workers/format?worker";

export interface PrettierOptions {
  [key: string]: any;
}

// Web Worker格式化服务
export const formatCode = async (
  code: string,
  language: string,
  prettierOptions?: PrettierOptions
): Promise<string> => {
  const options = prettierOptions || DEFAULT_FORMAT_OPTIONS;
  const worker = new FormatWorker();
  
  return new Promise((resolve) => {
    const id = Math.ceil(Math.random() * 100000);
    worker.addEventListener("message", (event) => {
      const { id: _id, code: formattedCode } = event.data;
      if (id === _id) resolve(formattedCode);
      worker.terminate();
    });
    worker.postMessage({ id, code, language, options });
  });
};

// 注册格式化提供者（已清理重复注释）
export const registerFormatProviders = () => {
  monaco.languages.registerDocumentFormattingEditProvider("html", {
    async provideDocumentFormattingEdits(model, options, token) {
      const text = model.getValue();
      try {
        const formatted = await formatCode(text, "html");
        if (formatted && formatted !== text) {
          return [{ range: model.getFullModelRange(), text: formatted }];
        }
      } catch (error) {
        console.error("HTML格式化失败:", error);
      }
      return [];
    },
  });

  monaco.languages.registerDocumentFormattingEditProvider("javascript", {
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
    },
  });

  monaco.languages.registerDocumentFormattingEditProvider("typescript", {
    async provideDocumentFormattingEdits(model, options, token) {
      const text = model.getValue();
      try {
        const formatted = await formatCode(text, "typescript");
        if (formatted && formatted !== text) {
          return [{ range: model.getFullModelRange(), text: formatted }];
        }
      } catch (error) {
        console.error("TypeScript格式化失败:", error);
      }
      return [];
    },
  });

  monaco.languages.registerDocumentFormattingEditProvider("css", {
    async provideDocumentFormattingEdits(model, options, token) {
      const text = model.getValue();
      try {
        const formatted = await formatCode(text, "css");
        if (formatted && formatted !== text) {
          return [{ range: model.getFullModelRange(), text: formatted }];
        }
      } catch (error) {
        console.error("CSS格式化失败:", error);
      }
      return [];
    },
  });
};