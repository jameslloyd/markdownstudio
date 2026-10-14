/**
 * Web API Bridge Shim for Markdown Studio
 * Provides a drop-in replacement for window.electronAPI when running in a web browser / Docker container.
 */

const eventListeners = {
  newFile: new Set(),
  openFile: new Set(),
  saveFile: new Set(),
  saveAs: new Set(),
  exportPDF: new Set(),
  exportHTML: new Set(),
  exportDocx: new Set(),
  toggleMode: new Set(),
  openSettings: new Set(),
  settingsUpdated: new Set(),
};

function triggerEvent(name, payload) {
  if (eventListeners[name]) {
    eventListeners[name].forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error(`Error in event listener ${name}:`, e);
      }
    });
  }
}

/**
 * Creates and injects a modern modal dialog into the DOM.
 */
function createModal({ title, subtitle, renderBody, onConfirm, confirmText = 'Confirm', confirmIcon = null, cancelText = 'Cancel' }) {
  return new Promise((resolve) => {
    // Remove any existing web modal
    const existing = document.getElementById('web-dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'web-dialog-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.webkitBackdropFilter = 'blur(8px)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.animation = 'fadeIn 0.15s ease-out';

    const card = document.createElement('div');
    card.style.backgroundColor = '#0f172a';
    card.style.border = '1px solid rgba(255, 255, 255, 0.14)';
    card.style.borderRadius = '14px';
    card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.6)';
    card.style.width = '100%';
    card.style.maxWidth = '540px';
    card.style.maxHeight = '85vh';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.overflow = 'hidden';
    card.style.color = '#f8fafc';
    card.style.fontFamily = "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)";

    // Header
    const header = document.createElement('div');
    header.style.padding = '18px 24px 14px';
    header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';

    const headerText = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = title;
    h3.style.margin = '0 0 4px 0';
    h3.style.fontSize = '17px';
    h3.style.fontWeight = '600';
    h3.style.color = '#f8fafc';
    headerText.appendChild(h3);

    if (subtitle) {
      const p = document.createElement('p');
      p.textContent = subtitle;
      p.style.margin = '0';
      p.style.fontSize = '13px';
      p.style.color = '#94a3b8';
      headerText.appendChild(p);
    }
    header.appendChild(headerText);

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#94a3b8';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.lineHeight = '1';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '4px 8px';
    closeBtn.style.borderRadius = '6px';
    closeBtn.onmouseenter = () => (closeBtn.style.color = '#f8fafc');
    closeBtn.onmouseleave = () => (closeBtn.style.color = '#94a3b8');
    closeBtn.onclick = () => close(null);
    header.appendChild(closeBtn);

    card.appendChild(header);

    // Body container
    const body = document.createElement('div');
    body.style.padding = '20px 24px';
    body.style.overflowY = 'auto';
    body.style.flex = '1';
    card.appendChild(body);

    // Footer container
    const footer = document.createElement('div');
    footer.style.padding = '14px 24px';
    footer.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '10px';
    footer.style.backgroundColor = 'rgba(15, 23, 42, 0.5)';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelText;
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
    cancelBtn.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    cancelBtn.style.borderRadius = '8px';
    cancelBtn.style.color = '#e2e8f0';
    cancelBtn.style.fontSize = '13px';
    cancelBtn.style.fontWeight = '500';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.onclick = () => close(null);
    footer.appendChild(cancelBtn);

    if (onConfirm) {
      const confirmButton = document.createElement('button');
      confirmButton.textContent = confirmText;
      confirmButton.style.padding = '8px 18px';
      confirmButton.style.backgroundColor = '#0284c7';
      confirmButton.style.border = '1px solid rgba(56, 189, 248, 0.3)';
      confirmButton.style.borderRadius = '8px';
      confirmButton.style.color = '#ffffff';
      confirmButton.style.fontSize = '13px';
      confirmButton.style.fontWeight = '600';
      confirmButton.style.cursor = 'pointer';
      confirmButton.onmouseenter = () => (confirmButton.style.backgroundColor = '#0369a1');
      confirmButton.onmouseleave = () => (confirmButton.style.backgroundColor = '#0284c7');
      confirmButton.onclick = async () => {
        const val = await onConfirm();
        if (val !== false) close(val);
      };
      footer.appendChild(confirmButton);
    }

    card.appendChild(footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const close = (result) => {
      window.removeEventListener('keydown', keyHandler);
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.15s ease-out';
      setTimeout(() => overlay.remove(), 150);
      resolve(result);
    };

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(null);
      }
    };
    window.addEventListener('keydown', keyHandler);

    renderBody(body, close);
  });
}

export function initWebApi() {
  if (window.electronAPI && window.electronAPI.isElectron) {
    return; // Already in Electron desktop environment
  }

  const webApi = {
    isElectron: false,
    platform: 'web',

    // Settings
    getSettings: async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.warn('Web backend unreachable, reading settings from localStorage');
      }

      const cached = localStorage.getItem('markdown_studio_settings');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }

      return {
        imageFolder: './assets',
        filenamePattern: 'image-{timestamp}',
        theme: 'dark',
        fontSize: 16,
        autoSave: true,
        autoSaveInterval: 30,
        plantUmlServer: 'https://www.plantuml.com/plantuml/svg',
        recentFiles: [],
      };
    },

    saveSettings: async (settings) => {
      localStorage.setItem('markdown_studio_settings', JSON.stringify(settings));
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
        if (res.ok) {
          const data = await res.json();
          triggerEvent('settingsUpdated', data.settings || settings);
          return { success: true, settings: data.settings || settings };
        }
      } catch (err) {
        console.warn('Web backend unreachable, saved settings to localStorage only');
      }
      triggerEvent('settingsUpdated', settings);
      return { success: true, settings };
    },

    // File operations
    openFile: async () => {
      // Fetch server files list
      let serverFiles = [];
      try {
        const res = await fetch('/api/files');
        if (res.ok) {
          serverFiles = await res.json();
        }
      } catch (e) {
        console.warn('Failed to fetch file list from server:', e);
      }

      const selected = await createModal({
        title: 'Open Markdown File',
        subtitle: 'Select a document from the workspace or open from your computer',
        cancelText: 'Cancel',
        renderBody: (body, close) => {
          // Upload from computer button
          const uploadRow = document.createElement('div');
          uploadRow.style.marginBottom = '16px';
          uploadRow.style.display = 'flex';
          uploadRow.style.alignItems = 'center';
          uploadRow.style.justifyContent = 'space-between';

          const uploadBtn = document.createElement('button');
          uploadBtn.innerHTML = '📁 Open File from Local Computer';
          uploadBtn.style.padding = '9px 14px';
          uploadBtn.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
          uploadBtn.style.border = '1px solid rgba(56, 189, 248, 0.3)';
          uploadBtn.style.borderRadius = '8px';
          uploadBtn.style.color = '#38bdf8';
          uploadBtn.style.fontSize = '13px';
          uploadBtn.style.fontWeight = '500';
          uploadBtn.style.cursor = 'pointer';
          uploadBtn.style.width = '100%';
          uploadBtn.style.transition = 'all 0.15s ease';
          uploadBtn.onmouseenter = () => (uploadBtn.style.backgroundColor = 'rgba(56, 189, 248, 0.25)');
          uploadBtn.onmouseleave = () => (uploadBtn.style.backgroundColor = 'rgba(56, 189, 248, 0.15)');

          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.md,.markdown,.mdown,.mkd,.txt';
          fileInput.style.display = 'none';
          fileInput.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              close({
                canceled: false,
                filePath: file.name,
                fileName: file.name,
                content: reader.result,
              });
            };
            reader.readAsText(file);
          };
          uploadBtn.onclick = () => fileInput.click();
          uploadRow.appendChild(uploadBtn);
          uploadRow.appendChild(fileInput);
          body.appendChild(uploadRow);

          // Divider
          const divLabel = document.createElement('div');
          divLabel.textContent = 'Or select from Workspace Documents:';
          divLabel.style.fontSize = '12px';
          divLabel.style.color = '#94a3b8';
          divLabel.style.marginBottom = '8px';
          divLabel.style.fontWeight = '500';
          body.appendChild(divLabel);

          // Search input
          const searchInput = document.createElement('input');
          searchInput.placeholder = 'Search markdown documents...';
          searchInput.style.width = '100%';
          searchInput.style.boxSizing = 'border-box';
          searchInput.style.padding = '8px 12px';
          searchInput.style.marginBottom = '12px';
          searchInput.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
          searchInput.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          searchInput.style.borderRadius = '6px';
          searchInput.style.color = '#f8fafc';
          searchInput.style.fontSize = '13px';
          searchInput.style.outline = 'none';
          body.appendChild(searchInput);

          // Files list
          const listContainer = document.createElement('div');
          listContainer.style.maxHeight = '240px';
          listContainer.style.overflowY = 'auto';
          listContainer.style.display = 'flex';
          listContainer.style.flexDirection = 'column';
          listContainer.style.gap = '4px';

          function renderList(filter = '') {
            listContainer.innerHTML = '';
            const filtered = serverFiles.filter((f) =>
              (f.name || f.path || '').toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
              const empty = document.createElement('div');
              empty.textContent = serverFiles.length === 0 ? 'No files found in workspace' : 'No matching files';
              empty.style.padding = '18px';
              empty.style.textAlign = 'center';
              empty.style.fontSize = '13px';
              empty.style.color = '#64748b';
              listContainer.appendChild(empty);
              return;
            }

            filtered.forEach((file) => {
              const item = document.createElement('div');
              item.style.padding = '10px 14px';
              item.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              item.style.border = '1px solid rgba(255, 255, 255, 0.06)';
              item.style.borderRadius = '6px';
              item.style.display = 'flex';
              item.style.alignItems = 'center';
              item.style.justifyContent = 'space-between';
              item.style.cursor = 'pointer';
              item.style.transition = 'background 0.15s ease';

              item.onmouseenter = () => (item.style.backgroundColor = 'rgba(56, 189, 248, 0.12)');
              item.onmouseleave = () => (item.style.backgroundColor = 'rgba(255, 255, 255, 0.03)');

              item.onclick = async () => {
                try {
                  const res = await fetch(`/api/file?path=${encodeURIComponent(file.path)}`);
                  if (res.ok) {
                    const data = await res.json();
                    close({
                      canceled: false,
                      filePath: data.filePath,
                      fileName: data.fileName,
                      content: data.content,
                    });
                  }
                } catch (err) {
                  alert(`Failed to load file: ${err.message}`);
                }
              };

              const nameSpan = document.createElement('div');
              nameSpan.innerHTML = `<span style="margin-right: 8px;">📄</span><span style="font-weight: 500;">${file.name}</span>`;
              nameSpan.style.fontSize = '13px';

              const metaSpan = document.createElement('span');
              metaSpan.textContent = file.size ? `${(file.size / 1024).toFixed(1)} KB` : '';
              metaSpan.style.fontSize = '11px';
              metaSpan.style.color = '#64748b';

              item.appendChild(nameSpan);
              item.appendChild(metaSpan);
              listContainer.appendChild(item);
            });
          }

          searchInput.oninput = (e) => renderList(e.target.value);
          renderList();
          body.appendChild(listContainer);
        },
      });

      return selected || { canceled: true };
    },

    saveFile: async ({ filePath, content }) => {
      try {
        const res = await fetch('/api/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath, content }),
        });
        if (res.ok) {
          return { success: true };
        }
      } catch (err) {
        console.warn('Failed to save file on server:', err);
      }

      // Fallback: download to browser if server error
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath ? filePath.split('/').pop() : 'document.md';
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    },

    saveFileAs: async ({ content, defaultName = 'Untitled.md' }) => {
      let enteredName = defaultName;
      let shouldDownload = false;

      const result = await createModal({
        title: 'Save Markdown Document',
        subtitle: 'Save to workspace container or download to your machine',
        confirmText: 'Save to Workspace',
        renderBody: (body, close) => {
          const label = document.createElement('label');
          label.textContent = 'Document File Name:';
          label.style.display = 'block';
          label.style.fontSize = '13px';
          label.style.marginBottom = '6px';
          label.style.color = '#cbd5e1';
          body.appendChild(label);

          const input = document.createElement('input');
          input.value = defaultName;
          input.style.width = '100%';
          input.style.boxSizing = 'border-box';
          input.style.padding = '9px 12px';
          input.style.marginBottom = '18px';
          input.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
          input.style.border = '1px solid rgba(56, 189, 248, 0.4)';
          input.style.borderRadius = '6px';
          input.style.color = '#f8fafc';
          input.style.fontSize = '14px';
          input.style.outline = 'none';
          input.oninput = (e) => (enteredName = e.target.value.trim());
          body.appendChild(input);

          // Download directly button option
          const downloadBtn = document.createElement('button');
          downloadBtn.innerHTML = '⬇️ Download .md to Computer Directly';
          downloadBtn.style.width = '100%';
          downloadBtn.style.padding = '8px 14px';
          downloadBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          downloadBtn.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          downloadBtn.style.borderRadius = '6px';
          downloadBtn.style.color = '#94a3b8';
          downloadBtn.style.fontSize = '12px';
          downloadBtn.style.cursor = 'pointer';
          downloadBtn.style.transition = 'all 0.15s ease';
          downloadBtn.onmouseenter = () => {
            downloadBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            downloadBtn.style.color = '#f8fafc';
          };
          downloadBtn.onmouseleave = () => {
            downloadBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            downloadBtn.style.color = '#94a3b8';
          };
          downloadBtn.onclick = () => {
            const finalName = enteredName || 'document.md';
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = finalName.endsWith('.md') ? finalName : `${finalName}.md`;
            a.click();
            URL.revokeObjectURL(url);
            close({
              canceled: false,
              filePath: finalName,
              fileName: finalName,
            });
          };
          body.appendChild(downloadBtn);

          setTimeout(() => {
            input.focus();
            input.select();
          }, 50);
        },
        onConfirm: async () => {
          let name = enteredName || defaultName;
          if (!name.endsWith('.md') && !name.endsWith('.markdown')) {
            name += '.md';
          }
          try {
            const res = await fetch('/api/file/save-as', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ defaultName: name, content }),
            });
            if (res.ok) {
              const data = await res.json();
              return {
                canceled: false,
                filePath: data.filePath,
                fileName: data.fileName,
              };
            }
          } catch (err) {
            console.warn('Save As failed via API, triggering local download:', err);
          }

          // Fallback download
          const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
          return { canceled: false, filePath: name, fileName: name };
        },
      });

      return result || { canceled: true };
    },

    readFile: async (filePath) => {
      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
        if (res.ok) {
          const data = await res.json();
          return { success: true, content: data.content, fileName: data.fileName };
        }
      } catch (err) {
        console.error('Failed to read file:', err);
      }
      return { success: false, error: 'Could not read file' };
    },

    pickMarkdownFile: async (currentFilePath) => {
      let serverFiles = [];
      try {
        const res = await fetch('/api/files');
        if (res.ok) serverFiles = await res.json();
      } catch (e) {}

      const selected = await createModal({
        title: 'Select Markdown File to Link',
        subtitle: 'Choose a document to link into the current file',
        renderBody: (body, close) => {
          const searchInput = document.createElement('input');
          searchInput.placeholder = 'Search documents...';
          searchInput.style.width = '100%';
          searchInput.style.boxSizing = 'border-box';
          searchInput.style.padding = '8px 12px';
          searchInput.style.marginBottom = '12px';
          searchInput.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
          searchInput.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          searchInput.style.borderRadius = '6px';
          searchInput.style.color = '#f8fafc';
          searchInput.style.fontSize = '13px';
          searchInput.style.outline = 'none';
          body.appendChild(searchInput);

          const listContainer = document.createElement('div');
          listContainer.style.maxHeight = '240px';
          listContainer.style.overflowY = 'auto';
          listContainer.style.display = 'flex';
          listContainer.style.flexDirection = 'column';
          listContainer.style.gap = '4px';

          function renderList(filter = '') {
            listContainer.innerHTML = '';
            const filtered = serverFiles.filter((f) =>
              (f.name || f.path || '').toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
              const empty = document.createElement('div');
              empty.textContent = 'No markdown files found';
              empty.style.padding = '18px';
              empty.style.textAlign = 'center';
              empty.style.fontSize = '13px';
              empty.style.color = '#64748b';
              listContainer.appendChild(empty);
              return;
            }

            filtered.forEach((file) => {
              const item = document.createElement('div');
              item.style.padding = '10px 14px';
              item.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              item.style.border = '1px solid rgba(255, 255, 255, 0.06)';
              item.style.borderRadius = '6px';
              item.style.cursor = 'pointer';
              item.style.fontSize = '13px';
              item.innerHTML = `📄 <span style="font-weight: 500;">${file.name}</span>`;

              item.onmouseenter = () => (item.style.backgroundColor = 'rgba(56, 189, 248, 0.12)');
              item.onmouseleave = () => (item.style.backgroundColor = 'rgba(255, 255, 255, 0.03)');

              item.onclick = () => {
                let rel = file.path;
                if (!rel.startsWith('.') && !rel.startsWith('/')) {
                  rel = `./${rel}`;
                }
                close({
                  canceled: false,
                  targetFilePath: file.path,
                  relativePath: rel,
                  displayName: file.name.replace(/\.[^/.]+$/, ''),
                });
              };
              listContainer.appendChild(item);
            });
          }

          searchInput.oninput = (e) => renderList(e.target.value);
          renderList();
          body.appendChild(listContainer);
        },
      });

      return selected || { canceled: true };
    },

    savePastedImage: async ({ buffer, ext = 'png', currentFilePath }) => {
      try {
        const query = new URLSearchParams({
          ext,
          currentFilePath: currentFilePath || '',
        });
        const res = await fetch(`/api/image/paste?${query.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: buffer,
        });

        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.warn('API image paste failed, falling back to data URL:', err);
      }

      // Standalone fallback: convert ArrayBuffer to base64 Data URL
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:image/${ext};base64,${base64}`;

      return {
        success: true,
        relativePath: dataUrl,
        absolutePath: dataUrl,
        fileName: `image-${Date.now()}.${ext}`,
      };
    },

    resolveImagePath: async ({ relativePath, currentFilePath }) => {
      return { exists: true, absolutePath: relativePath };
    },

    resolveRelativePath: async ({ relativePath, currentFilePath }) => {
      return { exists: true, absolutePath: relativePath };
    },

    openExternal: async (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      return { success: true };
    },

    // Export operations
    exportPDF: async ({ html, title = 'Document', defaultName = 'Untitled.pdf' }) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      await new Promise((r) => setTimeout(r, 500));
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1200);

      return { canceled: false };
    },

    exportHTML: async ({ html, defaultName = 'Untitled.html' }) => {
      const filename = defaultName.replace(/\.[^/.]+$/, '') + '.html';
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return { canceled: false, fileName: filename };
    },

    exportDocx: async ({ html, defaultName = 'Untitled.docx' }) => {
      const filename = defaultName.replace(/\.[^/.]+$/, '') + '.docx';
      try {
        const res = await fetch('/api/export/docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, filename }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          return { canceled: false, fileName: filename };
        }
      } catch (err) {
        console.error('Failed to export DOCX via API:', err);
      }

      // Standalone client fallback if backend unreachable
      try {
        const HTMLtoDOCX = (await import('html-to-docx')).default;
        const docxBuffer = await HTMLtoDOCX(html, null, {
          table: { row: { cantSplit: true } },
          footer: true,
          pageNumber: true,
        });
        const blob = new Blob([docxBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return { canceled: false, fileName: filename };
      } catch (clientErr) {
        console.error('Client-side DOCX generation failed:', clientErr);
        throw clientErr;
      }
    },

    // Event listeners
    onMenuNewFile: (callback) => {
      eventListeners.newFile.add(callback);
      return () => eventListeners.newFile.delete(callback);
    },
    onMenuOpenFile: (callback) => {
      eventListeners.openFile.add(callback);
      return () => eventListeners.openFile.delete(callback);
    },
    onMenuSaveFile: (callback) => {
      eventListeners.saveFile.add(callback);
      return () => eventListeners.saveFile.delete(callback);
    },
    onMenuSaveAs: (callback) => {
      eventListeners.saveAs.add(callback);
      return () => eventListeners.saveAs.delete(callback);
    },
    onMenuExportPDF: (callback) => {
      eventListeners.exportPDF.add(callback);
      return () => eventListeners.exportPDF.delete(callback);
    },
    onMenuExportHTML: (callback) => {
      eventListeners.exportHTML.add(callback);
      return () => eventListeners.exportHTML.delete(callback);
    },
    onMenuExportDocx: (callback) => {
      eventListeners.exportDocx.add(callback);
      return () => eventListeners.exportDocx.delete(callback);
    },
    onMenuToggleMode: (callback) => {
      eventListeners.toggleMode.add(callback);
      return () => eventListeners.toggleMode.delete(callback);
    },
    onMenuOpenSettings: (callback) => {
      eventListeners.openSettings.add(callback);
      return () => eventListeners.openSettings.delete(callback);
    },
    onSettingsUpdated: (callback) => {
      eventListeners.settingsUpdated.add(callback);
      return () => eventListeners.settingsUpdated.delete(callback);
    },
  };

  window.electronAPI = webApi;
}
