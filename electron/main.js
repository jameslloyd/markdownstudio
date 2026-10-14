const { app, BrowserWindow, ipcMain, dialog, Menu, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Register custom protocol for local image loading in WYSIWYG
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'md-local',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  const settingsPath = getSettingsPath();
  const defaultSettings = {
    imageFolder: './assets',
    filenamePattern: 'image-{timestamp}',
    theme: 'dark',
    fontSize: 16,
    autoSave: true,
    autoSaveInterval: 30,
    plantUmlServer: 'https://www.plantuml.com/plantuml/svg',
    recentFiles: [],
  };

  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  try {
    const settingsPath = getSettingsPath();
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
}

function addRecentFile(filePath) {
  if (!filePath) return;
  const settings = loadSettings();
  let recents = settings.recentFiles || [];
  recents = [filePath, ...recents.filter((p) => p !== filePath)].slice(0, 10);
  settings.recentFiles = recents;
  saveSettings(settings);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings:updated', settings);
  }
}

function createWindow() {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 860,
    minHeight: 580,
    title: 'Markdown Studio',
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    titleBarOverlay: !isMac
      ? {
          color: '#0f172a',
          symbolColor: '#94a3b8',
          height: 44,
        }
      : undefined,
    trafficLightPosition: isMac ? { x: 18, y: 16 } : undefined,
    vibrancy: isMac ? 'under-window' : undefined,
    visualEffectState: isMac ? 'active' : undefined,
    backgroundColor: '#0f172a',
    icon: isMac ? path.join(__dirname, '../build/icon.icns') : path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  setupMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              {
                label: 'Preferences...',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                  if (mainWindow) mainWindow.webContents.send('menu:open-settings');
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu:new-file');
          },
        },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (mainWindow) mainWindow.webContents.send('menu:open-file');
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu:save-file');
          },
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu:save-as');
          },
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as PDF...',
              accelerator: 'CmdOrCtrl+P',
              click: () => {
                if (mainWindow) mainWindow.webContents.send('menu:export-pdf');
              },
            },
            {
              label: 'Export as Standalone HTML...',
              accelerator: 'CmdOrCtrl+Shift+H',
              click: () => {
                if (mainWindow) mainWindow.webContents.send('menu:export-html');
              },
            },
            {
              label: 'Export as Word Document (.docx)...',
              accelerator: 'CmdOrCtrl+Shift+D',
              click: () => {
                if (mainWindow) mainWindow.webContents.send('menu:export-docx');
              },
            },
          ],
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Source / WYSIWYG Mode',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu:toggle-mode');
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(() => {
  // Register custom protocol handler to stream local image files to the renderer safely
  protocol.handle('md-local', (request) => {
    try {
      const urlObj = new URL(request.url);
      let filePath = decodeURIComponent(urlObj.pathname);
      if (urlObj.host && urlObj.host !== 'local') {
        filePath = `/${urlObj.host}${filePath}`;
      }
      if (process.platform === 'win32' && filePath.startsWith('/')) {
        filePath = filePath.slice(1);
      }
      const { pathToFileURL } = require('url');
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (err) {
      console.error('md-local protocol error:', err);
      return new Response('File not found', { status: 404 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Markdown File',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    addRecentFile(filePath);
    return {
      canceled: false,
      filePath,
      fileName: path.basename(filePath),
      content,
    };
  } catch (err) {
    return { canceled: false, error: err.message };
  }
});

ipcMain.handle('dialog:saveFileAs', async (event, { content, defaultName = 'Untitled.md' }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Markdown File',
    defaultPath: defaultName,
    filters: [
      { name: 'Markdown File', extensions: ['md', 'markdown'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  const filePath = result.filePath;
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    addRecentFile(filePath);
    return {
      canceled: false,
      filePath,
      fileName: path.basename(filePath),
    };
  } catch (err) {
    return { canceled: false, error: err.message };
  }
});

ipcMain.handle('file:save', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    addRecentFile(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content, fileName: path.basename(filePath) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('image:savePasted', async (event, { buffer, ext = 'png', currentFilePath }) => {
  try {
    const settings = loadSettings();
    const folderSetting = settings.imageFolder || './assets';

    // Determine base directory
    let baseDir;
    if (currentFilePath) {
      baseDir = path.dirname(currentFilePath);
    } else {
      // For unsaved documents, store in default Documents/MarkdownNotes/assets
      baseDir = path.join(app.getPath('documents'), 'MarkdownNotes');
    }

    const targetDir = path.resolve(baseDir, folderSetting);
    fs.mkdirSync(targetDir, { recursive: true });

    // Generate filename based on pattern and timestamp
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const timestamp = `${dateStr}-${timeStr}-${Math.floor(Math.random() * 1000)}`;

    let filename = (settings.filenamePattern || 'image-{timestamp}')
      .replace('{timestamp}', timestamp)
      .replace('{date}', dateStr)
      .replace('{time}', timeStr);

    if (!filename.endsWith(`.${ext}`)) {
      filename += `.${ext}`;
    }

    const absolutePath = path.join(targetDir, filename);
    const dataBuffer = Buffer.from(buffer);
    fs.writeFileSync(absolutePath, dataBuffer);

    // Compute relative path
    let relativePath = path.relative(baseDir, absolutePath);
    // Standardize path with forward slashes for Markdown compatibility
    relativePath = relativePath.split(path.sep).join('/');
    if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
      relativePath = `./${relativePath}`;
    }

    return {
      success: true,
      relativePath,
      absolutePath,
      fileName: filename,
      baseDir,
    };
  } catch (err) {
    console.error('Error saving image:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('settings:get', async () => {
  return loadSettings();
});

ipcMain.handle('settings:save', async (event, newSettings) => {
  const success = saveSettings(newSettings);
  return { success, settings: loadSettings() };
});

ipcMain.handle('app:resolveImagePath', async (event, { relativePath, currentFilePath }) => {
  try {
    let baseDir = currentFilePath
      ? path.dirname(currentFilePath)
      : path.join(app.getPath('documents'), 'MarkdownNotes');
    const absolutePath = path.resolve(baseDir, relativePath);
    return { exists: fs.existsSync(absolutePath), absolutePath };
  } catch (err) {
    return { exists: false, error: err.message };
  }
});

ipcMain.handle('dialog:pickMarkdownFile', async (event, currentFilePath) => {
  let defaultDir = currentFilePath
    ? path.dirname(currentFilePath)
    : app.getPath('documents');

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Markdown File to Link',
    defaultPath: defaultDir,
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const targetFilePath = result.filePaths[0];
  let relativePath = targetFilePath;
  if (currentFilePath) {
    const baseDir = path.dirname(currentFilePath);
    let rel = path.relative(baseDir, targetFilePath);
    rel = rel.split(path.sep).join('/');
    if (!rel.startsWith('.') && !rel.startsWith('/')) {
      rel = `./${rel}`;
    }
    relativePath = rel;
  }

  const ext = path.extname(targetFilePath);
  const baseName = path.basename(targetFilePath, ext);

  return {
    canceled: false,
    targetFilePath,
    relativePath,
    displayName: baseName,
  };
});

ipcMain.handle('app:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:resolveRelativePath', async (event, { relativePath, currentFilePath }) => {
  try {
    let baseDir = currentFilePath
      ? path.dirname(currentFilePath)
      : app.getPath('documents');
    const resolved = path.resolve(baseDir, relativePath);
    return { exists: fs.existsSync(resolved), absolutePath: resolved };
  } catch (err) {
    return { exists: false, error: err.message };
  }
});

// Export operations
ipcMain.handle('export:pdf', async (event, { html, title = 'Document', defaultName = 'Untitled.pdf' }) => {
  let targetDefault = defaultName.replace(/\.[^/.]+$/, '') + '.pdf';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export as PDF',
    defaultPath: targetDefault,
    filters: [
      { name: 'PDF Document', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  const printWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    // Allow brief time for fonts and layout to settle
    await new Promise((r) => setTimeout(r, 600));

    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'custom',
        top: 0.6,
        bottom: 0.6,
        left: 0.6,
        right: 0.6,
      },
    });

    fs.writeFileSync(result.filePath, pdfBuffer);
    printWindow.destroy();

    return { canceled: false, filePath: result.filePath };
  } catch (err) {
    console.error('PDF export error:', err);
    if (!printWindow.isDestroyed()) printWindow.destroy();
    return { canceled: false, error: err.message };
  }
});

ipcMain.handle('export:html', async (event, { html, defaultName = 'Untitled.html' }) => {
  let targetDefault = defaultName.replace(/\.[^/.]+$/, '') + '.html';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export as Standalone HTML',
    defaultPath: targetDefault,
    filters: [
      { name: 'HTML Document', extensions: ['html', 'htm'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  try {
    fs.writeFileSync(result.filePath, html, 'utf8');
    return { canceled: false, filePath: result.filePath };
  } catch (err) {
    return { canceled: false, error: err.message };
  }
});

ipcMain.handle('export:docx', async (event, { html, defaultName = 'Untitled.docx' }) => {
  let targetDefault = defaultName.replace(/\.[^/.]+$/, '') + '.docx';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export as Word Document',
    defaultPath: targetDefault,
    filters: [
      { name: 'Word Document', extensions: ['docx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  try {
    const HTMLtoDOCX = require('html-to-docx');
    const docxBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });
    fs.writeFileSync(result.filePath, docxBuffer);
    return { canceled: false, filePath: result.filePath };
  } catch (err) {
    console.error('DOCX export error:', err);
    return { canceled: false, error: err.message };
  }
});


