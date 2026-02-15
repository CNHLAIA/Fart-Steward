const { defineConfig } = require("vite");

module.exports = defineConfig({
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  }
});
