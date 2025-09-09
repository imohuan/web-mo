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
})
