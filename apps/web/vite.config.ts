import vue from '@vitejs/plugin-vue'
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server:{
    proxy:{
      '/api':{
        target:"http://localhost:3000",
        changeOrigin:true
      }
    }
  },
  plugins: [vue(),vueJsx()],
})
