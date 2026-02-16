const { defineConfig } = require("vite");

module.exports = defineConfig({
  base: './',  // 使用相对路径，支持 Electron 打包
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
