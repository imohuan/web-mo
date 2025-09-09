import * as monaco from "monaco-editor";

// 自定义HTML代码折叠
export const registerFoldingRangeProvider = () => {
  monaco.languages.registerFoldingRangeProvider("html", {
    provideFoldingRanges(model, context, token) {
      const text = model.getValue();
      const ranges = [];

      const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
      let match;

      while ((match = scriptRegex.exec(text)) !== null) {
        if (match.index === scriptRegex.lastIndex) {
          scriptRegex.lastIndex++;
        }

        const startLine = model.getPositionAt(match.index).lineNumber;
        const endLine = model.getPositionAt(match.index + match[0].length).lineNumber;

        if (endLine > startLine) {
          ranges.push({
            start: startLine,
            end: endLine,
            kind: monaco.languages.FoldingRangeKind.Region,
          });

          const scriptContent = match[1];
          const scriptStartOffset = match.index + match[0].indexOf(scriptContent);
          const scriptLines = scriptContent.split("\n");

          if (scriptLines.length > 2) {
            let innerStart = -1;
            let innerDepth = 0;

            for (let i = 0; i < scriptLines.length; i++) {
              const line = scriptLines[i];
              const lineStartPos = model.getPositionAt(
                scriptStartOffset + scriptContent.indexOf(line)
              ).lineNumber;

              if (line.includes("{")) {
                if (innerStart === -1) {
                  innerStart = lineStartPos;
                }
                innerDepth++;
              }

              if (line.includes("}") && innerDepth > 0) {
                innerDepth--;
                if (innerDepth === 0 && innerStart !== -1) {
                  const innerEndPos = lineStartPos;
                  if (innerEndPos > innerStart) {
                    ranges.push({
                      start: innerStart,
                      end: innerEndPos,
                      kind: monaco.languages.FoldingRangeKind.Region,
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
    },
  });
};

// 构建高亮HTML字符数据
export const registerHtmlCharacterEntities = () => {
  const htmlCharacterEntities = [
    { name: "&lt;", value: "&lt;", description: "小于号 (<)" },
    { name: "&gt;", value: "&gt;", description: "大于号 (>)" },
    { name: "&amp;", value: "&amp;", description: "和号 (&)" },
    { name: "&quot;", value: "&quot;", description: "引号 (\")" },
    { name: "&apos;", value: "&#39;", description: "单引号 (')" },
    { name: "&nbsp;", value: "&nbsp;", description: "不换行空格" },
    { name: "&copy;", value: "&copy;", description: "版权符号" },
    { name: "&reg;", value: "&reg;", description: "注册商标符号" },
    { name: "&trade;", value: "&trade;", description: "商标符号" },
  ];

  // 注册HTML字符实体的自动完成
  monaco.languages.registerCompletionItemProvider("html", {
    provideCompletionItems: function (model, position, context, token) {
      const suggestions = htmlCharacterEntities.map(item => ({
        label: item.name,
        kind: monaco.languages.CompletionItemKind.Text,
        documentation: item.description,
        insertText: item.value,
        detail: item.description,
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: model.getWordUntilPosition(position).startColumn,
          endColumn: position.column,
        },
      }));

      return { suggestions };
    },
  });
};