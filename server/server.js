const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const DOCUMENTS_DIR = path.resolve(process.env.DOCUMENTS_DIR || path.join(__dirname, '../documents'));
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '../data'));
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure persistent folders exist
fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
fs.mkdirSync(path.join(DOCUMENTS_DIR, 'assets'), { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// Seed welcome.md if no markdown documents exist
function seedWelcomeFile() {
  try {
    const existing = fs.readdirSync(DOCUMENTS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.markdown'));
    if (existing.length === 0) {
      const welcomeContent = `# Welcome to Markdown Studio Web 🚀

Markdown Studio is a modern, high-performance **GitHub Flavored Markdown (GFM)** editor running directly in your browser and Docker container.

---

## 🌟 Key Features

- **Split & WYSIWYG Modes**: Seamlessly switch between rich visual editing and raw Markdown source (\`Cmd/Ctrl+E\`).
- **Interactive Document Outline**: Click any heading in the sidebar on the left to smoothly jump to that section with a subtle pulse.
- **GFM Extended HTML Tags**: Full support for \`<div align="center">\`, \`<kbd>\`, \`<details>\`, \`<sub>\`, \`<sup>\`, \`<u>\`, \`<mark>\`, and custom attributes on images.
- **Diagrams as Code**:
  - **Mermaid.js** (Flowcharts, sequence diagrams, git graphs)
  - **PlantUML** (Architecture, class diagrams)
- **Local & Pasted Images**: Paste images directly from your clipboard or upload files; they are stored safely in your workspace \`assets/\` directory.

---

<div align="center">

### 💡 Embedded Centered GFM Section

Here is a centered highlight block using standard \`<div align="center">\`.

| Feature | Desktop App | Docker Web |
| :--- | :---: | :---: |
| WYSIWYG & Source Mode | ✅ | ✅ |
| Mermaid Diagrams | ✅ | ✅ |
| PlantUML Diagrams | ✅ | ✅ |
| Image Pasting | ✅ | ✅ |
| Outline Jump Navigation | ✅ | ✅ |
| Persistent Host Storage | ✅ | ✅ (Volume Mount) |

</div>

---

## 📊 Live Mermaid Diagram

\`\`\`mermaid
flowchart LR
    A[Browser / Client] -->|HTTP / WebSocket| B(Markdown Studio Web)
    B --> C[(Host /app/documents)]
    B --> D[Mermaid / PlantUML Renderers]
\`\`\`

---

## ⚡ Quick Shortcuts

- <kbd>Cmd/Ctrl</kbd> + <kbd>S</kbd> : Save document
- <kbd>Cmd/Ctrl</kbd> + <kbd>O</kbd> : Open file dialog
- <kbd>Cmd/Ctrl</kbd> + <kbd>N</kbd> : New document
- <kbd>Cmd/Ctrl</kbd> + <kbd>E</kbd> : Toggle WYSIWYG / Source view
- <kbd>Cmd/Ctrl</kbd> + <kbd>,</kbd> : Preferences & settings

Enjoy writing in **Markdown Studio**!
`;
      fs.writeFileSync(path.join(DOCUMENTS_DIR, 'welcome.md'), welcomeContent, 'utf8');
      console.log('Seeded initial welcome.md in documents directory');
    }
  } catch (err) {
    console.error('Failed to seed welcome.md:', err);
  }
}

seedWelcomeFile();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper to sanitize paths and prevent directory traversal outside DOCUMENTS_DIR
function safeResolve(userPath) {
  if (!userPath) return null;
  let resolved;
  if (path.isAbsolute(userPath)) {
    if (userPath.startsWith(DOCUMENTS_DIR)) {
      resolved = userPath;
    } else {
      resolved = path.join(DOCUMENTS_DIR, path.basename(userPath));
    }
  } else {
    resolved = path.resolve(DOCUMENTS_DIR, userPath);
  }

  // Ensure resolved path is within DOCUMENTS_DIR
  if (!resolved.startsWith(DOCUMENTS_DIR)) {
    return null;
  }
  return resolved;
}

// Settings management
function loadSettings() {
  const defaultSettings = {
    imageFolder: './assets',
    filenamePattern: 'image-{timestamp}',
    theme: 'dark',
    fontSize: 16,
    autoSave: true,
    autoSaveInterval: 30,
    plantUmlServer: 'https://www.plantuml.com/plantuml/svg',
    recentFiles: ['welcome.md'],
  };

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to read settings:', err);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.1.0',
    documentsDir: DOCUMENTS_DIR,
    uptime: process.uptime(),
  });
});

// Settings API
app.get('/api/settings', (req, res) => {
  res.json(loadSettings());
});

app.post('/api/settings', (req, res) => {
  const success = saveSettings(req.body);
  res.json({ success, settings: loadSettings() });
});

// Recursively list markdown files in DOCUMENTS_DIR
function getFilesRecursively(dir, base = '') {
  let results = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name.startsWith('.')) continue; // ignore hidden
      const relPath = base ? `${base}/${item.name}` : item.name;
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        if (item.name !== 'node_modules' && item.name !== 'assets') {
          results = results.concat(getFilesRecursively(fullPath, relPath));
        }
      } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.markdown') || item.name.endsWith('.txt'))) {
        const stats = fs.statSync(fullPath);
        results.push({
          path: relPath,
          name: item.name,
          size: stats.size,
          modified: stats.mtimeMs,
        });
      }
    }
  } catch (err) {
    console.error(`Error scanning dir ${dir}:`, err);
  }
  return results;
}

// Files listing API
app.get('/api/files', (req, res) => {
  const files = getFilesRecursively(DOCUMENTS_DIR);
  res.json(files);
});

// Read file API
app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
  const target = safeResolve(filePath);
  if (!target || !fs.existsSync(target)) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  try {
    const content = fs.readFileSync(target, 'utf8');
    const rel = path.relative(DOCUMENTS_DIR, target).split(path.sep).join('/');
    res.json({
      success: true,
      filePath: rel,
      fileName: path.basename(target),
      content,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save file API
app.post('/api/file', (req, res) => {
  const { filePath, content } = req.body;
  const target = safeResolve(filePath);
  if (!target) {
    return res.status(400).json({ success: false, error: 'Invalid file path' });
  }

  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content || '', 'utf8');
    const rel = path.relative(DOCUMENTS_DIR, target).split(path.sep).join('/');
    res.json({
      success: true,
      filePath: rel,
      fileName: path.basename(target),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save file as API
app.post('/api/file/save-as', (req, res) => {
  let { defaultName, content } = req.body;
  if (!defaultName) defaultName = 'Untitled.md';
  if (!defaultName.endsWith('.md') && !defaultName.endsWith('.markdown')) {
    defaultName += '.md';
  }

  const target = safeResolve(defaultName);
  if (!target) {
    return res.status(400).json({ success: false, error: 'Invalid file path' });
  }

  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content || '', 'utf8');
    const rel = path.relative(DOCUMENTS_DIR, target).split(path.sep).join('/');
    res.json({
      canceled: false,
      filePath: rel,
      fileName: path.basename(target),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Image paste API: Receives binary raw body
app.post('/api/image/paste', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  try {
    const ext = req.query.ext || 'png';
    const currentFilePath = req.query.currentFilePath;
    const settings = loadSettings();
    const folderSetting = settings.imageFolder || './assets';

    let baseDir = DOCUMENTS_DIR;
    if (currentFilePath) {
      const resolvedDoc = safeResolve(currentFilePath);
      if (resolvedDoc) {
        baseDir = path.dirname(resolvedDoc);
      }
    }

    let targetDir = path.resolve(baseDir, folderSetting);
    if (!targetDir.startsWith(DOCUMENTS_DIR)) {
      targetDir = path.join(DOCUMENTS_DIR, 'assets');
    }
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
    fs.writeFileSync(absolutePath, req.body);

    // Compute relative path from document
    let relativePath = path.relative(baseDir, absolutePath).split(path.sep).join('/');
    if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
      relativePath = `./${relativePath}`;
    }

    const docRelPath = path.relative(DOCUMENTS_DIR, absolutePath).split(path.sep).join('/');

    res.json({
      success: true,
      relativePath,
      absolutePath: docRelPath,
      fileName: filename,
      baseDir: path.relative(DOCUMENTS_DIR, baseDir).split(path.sep).join('/'),
    });
  } catch (err) {
    console.error('Error saving image:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Raw file streaming (for images, relative links, assets)
app.get('/api/raw', (req, res) => {
  const filePath = req.query.path;
  const target = safeResolve(filePath);
  if (!target || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    return res.status(404).send('Asset not found');
  }

  res.sendFile(target);
});

// Serve static frontend assets from dist/
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.send('Markdown Studio Web Server running. Frontend build not found. Run `npm run build` first.');
  });
}

// Start HTTP server
const server = app.listen(PORT, HOST, () => {
  console.log(`Markdown Studio Web running at http://${HOST}:${PORT}`);
  console.log(`Documents Directory: ${DOCUMENTS_DIR}`);
  console.log(`Data Directory:      ${DATA_DIR}`);
});

// Graceful termination
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
