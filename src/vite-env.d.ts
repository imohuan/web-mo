/// <reference types="vite/client" />

// SVG 组件类型定义
declare module '*.svg?component' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

declare module '*.svg' {
  const src: string
  export default src
}
