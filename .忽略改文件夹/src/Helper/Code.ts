import type { Options as PrettierOptions } from "prettier"

export let DEFAULT_CODE = `<!DOCTYPE html>
<html>
  <head>
    <title>My app</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100dvh;
        font-family: "Arial", sans-serif;
        text-align: center;
      }
      .arrow {
        position: absolute;
        bottom: 32px;
        left: 0px;
        width: 100px;
        transform: rotate(30deg);
      }
      h1 {
        font-size: 50px;
      }
      h1 span {
        color: #acacac;
        font-size: 32px;
      }
      @media screen and (max-width: 640px) {
        .arrow {
          top: 12px;
          left: 56px;
          transform: rotate(180deg);
        }
      }
    </style>
  </head>
  <body>
    <h1>
      <span>I'm ready to work,</span><br />
      Ask me anything.
    </h1>
    <img src="https://enzostvs-deepsite.hf.space/arrow.svg" class="arrow" />
    <script></script>
  </body>
</html>
`

// DEFAULT_CODE = `<!DOCTYPE html>
// <HTML CLASS="no-js mY-ClAsS">

// <HEAD>
//                       <META CHARSET="utf-8">
//                       <TITLE>My tITlE</TITLE>
//                       <META NAME="description" content="My CoNtEnT">
//                     </HEAD>

//                     <body>
//   <P>Hello world!<BR> This is HTML5 Boilerplate.</P>
//                     <script>
//                           if (false)                {
//                                       			console.log(123)
//                               }
//                       </script>

// </body>

// </HTML>`

export const DEFAULT_FORMAT_OPTIONS: PrettierOptions = {
  "arrowParens": "always",
  "bracketSameLine": false,
  "bracketSpacing": true,
  "semi": true,
  "experimentalTernaries": true,
  "singleQuote": false,
  "jsxSingleQuote": false,
  "quoteProps": "as-needed",
  "trailingComma": "all",
  "singleAttributePerLine": false,
  "htmlWhitespaceSensitivity": "css",
  "vueIndentScriptAndStyle": false,
  "proseWrap": "preserve",
  "insertPragma": false,
  "printWidth": 120,
  "requirePragma": false,
  "tabWidth": 2,
  "useTabs": false,
  "embeddedLanguageFormatting": "auto"
}

