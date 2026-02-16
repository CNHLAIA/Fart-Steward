// preload.js - 预加载脚本
// 在渲染进程中暴露安全的 API

const { contextBridge } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用版本
  getVersion: () => require('../package.json').version,
  
  // 获取平台信息
  getPlatform: () => process.platform,
  
  // 检查是否为打包后的应用
  isPackaged: () => require('electron').app.isPackaged,
});

console.log('Preload script loaded');
