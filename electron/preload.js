const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: ({ filePath, content }) => ipcRenderer.invoke('file:save', { filePath, content }),
  saveFileAs: ({ content, defaultName }) => ipcRenderer.invoke('dialog:saveFileAs', { content, defaultName }),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  pickMarkdownFile: (currentFilePath) => ipcRenderer.invoke('dialog:pickMarkdownFile', currentFilePath),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  resolveRelativePath: (data) => ipcRenderer.invoke('app:resolveRelativePath', data),

  // Image pasting and handling
  savePastedImage: ({ buffer, ext, currentFilePath }) =>
    ipcRenderer.invoke('image:savePasted', { buffer, ext, currentFilePath }),
  resolveImagePath: ({ relativePath, currentFilePath }) =>
    ipcRenderer.invoke('app:resolveImagePath', { relativePath, currentFilePath }),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // Export operations
  exportPDF: ({ html, title, defaultName }) =>
    ipcRenderer.invoke('export:pdf', { html, title, defaultName }),
  exportHTML: ({ html, defaultName }) =>
    ipcRenderer.invoke('export:html', { html, defaultName }),
  exportDocx: ({ html, defaultName }) =>
    ipcRenderer.invoke('export:docx', { html, defaultName }),

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
  onMenuExportPDF: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:export-pdf', handler);
    return () => ipcRenderer.removeListener('menu:export-pdf', handler);
  },
  onMenuExportHTML: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:export-html', handler);
    return () => ipcRenderer.removeListener('menu:export-html', handler);
  },
  onMenuExportDocx: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu:export-docx', handler);
    return () => ipcRenderer.removeListener('menu:export-docx', handler);
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
