import { resolve } from "path"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  server: {
    allowedHosts: ["85a4874f13a2.ngrok-free.app"],
  },
  plugins: [vue(), tailwindcss(), svgLoader()],
  // GitHub Pages 部署配置
  base: process.env.NODE_ENV === 'production' ? '/sitecopy/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          monaco: ['monaco-editor'],
          utils: ['lodash-es', 'marked', 'highlight.js']
        }
      }
    }
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
})
