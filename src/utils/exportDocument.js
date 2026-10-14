/**
 * Document Export Utility
 * Generates standalone, styled HTML and DOCX-compatible payloads from the editor content.
 */

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts an SVG element to a high-DPI base64 PNG data URL
 */
export async function svgToPngDataUrl(svgEl) {
  return new Promise((resolve) => {
    try {
      const svgString = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobUrl = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const bbox = svgEl.getBoundingClientRect();
        const width = bbox.width || 640;
        const height = bbox.height || 360;

        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);

        // Fill clean background behind diagram
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(blobUrl);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(null);
      };

      img.src = blobUrl;
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Generates standalone HTML document with embedded CSS, ready for offline viewing or PDF printing.
 */
export async function prepareHtmlForExport({ title = 'Document', theme = 'light' }) {
  const editorEl = document.querySelector('.ProseMirror');
  if (!editorEl) {
    throw new Error('Editor element not found');
  }

  // Clone editor to avoid mutating live view
  const clone = editorEl.cloneNode(true);

  // Clean editor-only interactive chrome
  clone.querySelectorAll('.diagram-actions').forEach((el) => el.remove());
  clone.querySelectorAll('.diagram-editor-area').forEach((el) => el.remove());
  clone.querySelectorAll('.diagram-error-banner').forEach((el) => el.remove());
  clone.querySelectorAll('.diagram-badge').forEach((el) => el.remove());
  clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));

  // Ensure task list checkboxes retain checked state
  clone.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    if (box.checked) {
      box.setAttribute('checked', 'checked');
    } else {
      box.removeAttribute('checked');
    }
    box.setAttribute('disabled', 'disabled');
  });

  const contentHtml = clone.innerHTML;
  const isDark = theme === 'dark';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${getExportStyles(isDark)}
  </style>
</head>
<body class="${isDark ? 'dark-mode' : 'light-mode'}">
  <div class="export-container">
    <article class="markdown-body">
      ${contentHtml}
    </article>
  </div>
</body>
</html>`;
}

/**
 * Prepares clean HTML suitable for Word (.docx) generation,
 * replacing inline SVGs with base64 PNG images.
 */
export async function prepareDocxHtmlForExport({ title = 'Document' }) {
  const editorEl = document.querySelector('.ProseMirror');
  if (!editorEl) {
    throw new Error('Editor element not found');
  }

  const clone = editorEl.cloneNode(true);

  // Clean editor UI
  clone.querySelectorAll('.diagram-actions').forEach((el) => el.remove());
  clone.querySelectorAll('.diagram-editor-area').forEach((el) => el.remove());
  clone.querySelectorAll('.diagram-error-banner').forEach((el) => el.remove());
  clone.querySelectorAll('.diagram-badge').forEach((el) => el.remove());
  clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));

  // Convert Mermaid SVGs to high-res PNG image tags
  const svgs = Array.from(clone.querySelectorAll('svg'));
  for (const svg of svgs) {
    const png = await svgToPngDataUrl(svg);
    if (png) {
      const img = document.createElement('img');
      img.src = png;
      const bbox = svg.getBoundingClientRect();
      img.width = Math.min(bbox.width || 600, 650);
      img.alt = 'Mermaid Diagram';
      svg.parentNode.replaceChild(img, svg);
    }
  }

  // Ensure tables have standard Word attributes
  clone.querySelectorAll('table').forEach((table) => {
    table.setAttribute('border', '1');
    table.setAttribute('cellpadding', '6');
    table.setAttribute('cellspacing', '0');
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  ${clone.innerHTML}
</body>
</html>`;
}

/**
 * Complete standalone GitHub Markdown stylesheet for HTML and PDF printing
 */
function getExportStyles(isDark = false) {
  const bg = isDark ? '#0b0f19' : '#ffffff';
  const text = isDark ? '#f8fafc' : '#1e293b';
  const border = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
  const codeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc';
  const tableAlt = isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc';
  const linkColor = isDark ? '#38bdf8' : '#0284c7';
  const quoteBorder = isDark ? '#38bdf8' : '#0284c7';

  return `
    :root {
      color-scheme: ${isDark ? 'dark' : 'light'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      background-color: ${bg};
      color: ${text};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .export-container {
      max-width: 860px;
      margin: 0 auto;
      padding: 40px 32px;
    }
    .markdown-body {
      width: 100%;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.6em;
      font-weight: 600;
      line-height: 1.25;
      color: ${text};
      page-break-after: avoid;
      break-after: avoid;
    }
    h1 {
      font-size: 2em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid ${border};
      margin-top: 0;
    }
    h2 {
      font-size: 1.5em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid ${border};
    }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    p, blockquote, ul, ol, dl, table, pre {
      margin-top: 0;
      margin-bottom: 16px;
    }
    hr {
      height: 1px;
      padding: 0;
      margin: 24px 0;
      background-color: ${border};
      border: 0;
    }
    blockquote {
      padding: 8px 16px;
      color: ${isDark ? '#94a3b8' : '#64748b'};
      border-left: 4px solid ${quoteBorder};
      background: ${codeBg};
      border-radius: 0 6px 6px 0;
    }
    ul, ol {
      padding-left: 2em;
    }
    li {
      margin-top: 0.25em;
    }
    ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }
    ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    ul[data-type="taskList"] input[type="checkbox"] {
      margin-top: 4px;
      accent-color: ${linkColor};
    }
    a {
      color: ${linkColor};
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: ${codeBg};
      border-radius: 4px;
      font-family: 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
    }
    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: ${codeBg};
      border: 1px solid ${border};
      border-radius: 8px;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      font-size: 100%;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    table th, table td {
      padding: 10px 14px;
      border: 1px solid ${border};
    }
    table th {
      font-weight: 600;
      background-color: ${codeBg};
    }
    table tr:nth-child(2n) {
      background-color: ${tableAlt};
    }
    img {
      max-width: 100%;
      box-sizing: content-box;
      border-radius: 6px;
    }
    kbd {
      display: inline-block;
      padding: 2px 6px;
      font-size: 11px;
      line-height: 14px;
      color: ${text};
      vertical-align: middle;
      background-color: ${codeBg};
      border: 1px solid ${border};
      border-radius: 4px;
      box-shadow: inset 0 -1px 0 ${border};
      font-family: inherit;
    }
    mark {
      background-color: rgba(250, 204, 21, 0.35);
      color: inherit;
      padding: 1px 4px;
      border-radius: 3px;
    }
    .diagram-block-container {
      margin: 24px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .diagram-render-area {
      display: flex;
      justify-content: center;
      padding: 16px;
      background: ${isDark ? '#0f172a' : '#f8fafc'};
      border: 1px solid ${border};
      border-radius: 8px;
      overflow-x: auto;
    }
    .diagram-render-area svg {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    [align="center"] {
      text-align: center;
    }

    @media print {
      @page {
        margin: 15mm 15mm 15mm 15mm;
        size: auto;
      }
      body {
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
      .export-container {
        padding: 0;
        max-width: 100%;
      }
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        break-after: avoid;
      }
      table, pre, .diagram-block-container {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .diagram-render-area {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
      }
    }
  `;
}
