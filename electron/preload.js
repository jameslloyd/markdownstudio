const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: ({ filePath, content }) => ipcRenderer.invoke('file:save', { filePath, content }),
  saveFileAs: ({ content, defaultName }) => ipcRenderer.invoke('dialog:saveFileAs', { content, defaultName }),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

  // Image pasting and handling
  savePastedImage: ({ buffer, ext, currentFilePath }) =>
    ipcRenderer.invoke('image:savePasted', { buffer, ext, currentFilePath }),
  resolveImagePath: ({ relativePath, currentFilePath }) =>
    ipcRenderer.invoke('app:resolveImagePath', { relativePath, currentFilePath }),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // Menu and system event listeners
  onMenuNewFile: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:new-file', handler);
    return () => ipcRenderer.removeListener('menu:new-file', handler);
  },
  onMenuOpenFile: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:open-file', handler);
    return () => ipcRenderer.removeListener('menu:open-file', handler);
  },
  onMenuSaveFile: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:save-file', handler);
    return () => ipcRenderer.removeListener('menu:save-file', handler);
  },
  onMenuSaveAs: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:save-as', handler);
    return () => ipcRenderer.removeListener('menu:save-as', handler);
  },
  onMenuToggleMode: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:toggle-mode', handler);
    return () => ipcRenderer.removeListener('menu:toggle-mode', handler);
  },
  onMenuOpenSettings: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:open-settings', handler);
    return () => ipcRenderer.removeListener('menu:open-settings', handler);
  },
  onSettingsUpdated: (callback) => {
    const handler = (event, settings) => callback(settings);
    ipcRenderer.on('settings:updated', handler);
    return () => ipcRenderer.removeListener('settings:updated', handler);
  },
});
