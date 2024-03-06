import { defineConfig } from "vite";
import Vue from '@vitejs/plugin-vue'
import vueJsx from "@vitejs/plugin-vue-jsx";
import { markdownTypePlugIn,viteInitPlugin } from "./src/index";
import Markdown from 'unplugin-vue-markdown/vite'
export default defineConfig({
  plugins: [
    viteInitPlugin(),
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    vueJsx({
      resolveType: true
    }),
    Markdown({
      markdownItSetup(md) {
        md.use(markdownTypePlugIn)
      }
    })
  ],
  optimizeDeps: {
    include: ['esm-dep > cjs-dep'],
    // exclude: ['vscode-textmate','vscode-oniguruma'],
  },
})
