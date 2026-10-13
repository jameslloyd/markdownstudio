import React, { useRef } from 'react';

export default function SourceEditor({
  markdown,
  onChange,
  currentFilePath,
}) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    // Handle tab key indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        markdown.substring(0, start) + '  ' + markdown.substring(end);
      onChange(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items || !window.electronAPI) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        try {
          const buffer = await file.arrayBuffer();
          const ext = file.type.split('/')[1] || 'png';
          const res = await window.electronAPI.savePastedImage({
            buffer,
            ext,
            currentFilePath,
          });

          if (res && res.success) {
            const textarea = textareaRef.current;
            const start = textarea ? textarea.selectionStart : markdown.length;
            const end = textarea ? textarea.selectionEnd : markdown.length;
            const tag = `![${file.name || 'image'}](${res.relativePath})\n`;

            const updated = markdown.substring(0, start) + tag + markdown.substring(end);
            onChange(updated);
          }
        } catch (err) {
          console.error('Failed to paste image in source editor:', err);
        }
        return;
      }
    }
  };

  const handleDrop = async (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') && window.electronAPI) {
        e.preventDefault();
        try {
          const buffer = await file.arrayBuffer();
          const ext = file.type.split('/')[1] || 'png';
          const res = await window.electronAPI.savePastedImage({
            buffer,
            ext,
            currentFilePath,
          });

          if (res && res.success) {
            const textarea = textareaRef.current;
            const start = textarea ? textarea.selectionStart : markdown.length;
            const end = textarea ? textarea.selectionEnd : markdown.length;
            const tag = `![${file.name || 'image'}](${res.relativePath})\n`;

            const updated = markdown.substring(0, start) + tag + markdown.substring(end);
            onChange(updated);
          }
        } catch (err) {
          console.error('Failed to drop image:', err);
        }
      }
    }
  };

  return (
    <div className="source-editor-container" onDrop={handleDrop}>
      <textarea
        ref={textareaRef}
        className="source-textarea"
        value={markdown}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="# Type your markdown here..."
        spellCheck="false"
      />
    </div>
  );
}
