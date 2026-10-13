import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Link } from '@tiptap/extension-link';

import { MermaidExtension, PlantUMLExtension } from '../extensions/DiagramExtension';
import { CustomImage } from '../extensions/CustomImage';
import Toolbar from './Toolbar';

export default function Editor({
  markdown,
  onChange,
  currentFilePath,
  currentBaseDir,
  settings,
  onSaveRequest,
  onNavigateToFile,
}) {
  const isUpdatingFromProp = useRef(false);

  // Sync globals for custom image resolver
  window.__currentFilePath = currentFilePath;
  window.__currentBaseDir = currentBaseDir;
  window.__appSettings = settings;

  // Convert raw markdown with mermaid/plantuml blocks to HTML tags recognized by extensions
  const prepareContentForEditor = (rawMd) => {
    if (!rawMd) return '';
    let content = rawMd;

    // Replace ```mermaid code fences with custom HTML tags
    content = content.replace(/```mermaid\r?\n([\s\S]*?)```/g, (match, p1) => {
      const encoded = encodeURIComponent(p1.trim());
      return `<div data-type="mermaid" data-code="${encoded}"></div>`;
    });

    // Replace ```plantuml or ```puml code fences
    content = content.replace(/```(?:plantuml|puml)\r?\n([\s\S]*?)```/g, (match, p1) => {
      const encoded = encodeURIComponent(p1.trim());
      return `<div data-type="plantuml" data-code="${encoded}"></div>`;
    });

    return content;
  };

  const serializeContentToMarkdown = (rawEditor) => {
    if (!rawEditor) return '';
    let md = rawEditor.storage.markdown.getMarkdown();

    // Ensure any data-code attributes are decoded properly if needed
    md = md.replace(/<div data-type="mermaid" data-code="([^"]*)"><\/div>/g, (match, p1) => {
      return `\`\`\`mermaid\n${decodeURIComponent(p1)}\n\`\`\`\n\n`;
    });

    md = md.replace(/<div data-type="plantuml" data-code="([^"]*)"><\/div>/g, (match, p1) => {
      return `\`\`\`plantuml\n${decodeURIComponent(p1)}\n\`\`\`\n\n`;
    });

    return md;
  };

  // Image paste & drop handler
  const handleSaveImage = async (file, view) => {
    if (!file || !window.electronAPI) return false;

    try {
      const buffer = await file.arrayBuffer();
      const ext = file.type.split('/')[1] || 'png';

      const res = await window.electronAPI.savePastedImage({
        buffer,
        ext,
        currentFilePath,
      });

      if (res && res.success) {
        // Insert image node in TipTap
        const { state, dispatch } = view;
        const node = view.state.schema.nodes.image.create({
          src: res.relativePath,
          alt: file.name || 'Pasted image',
        });
        const transaction = state.tr.replaceSelectionWith(node);
        dispatch(transaction);
        return true;
      }
    } catch (err) {
      console.error('Failed to save pasted image:', err);
    }
    return false;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use custom code / diagram handling
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CustomImage,
      MermaidExtension,
      PlantUMLExtension,
      Placeholder.configure({
        placeholder: 'Write your story, design with diagrams, or paste images...',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '-',
      }),
    ],
    content: prepareContentForEditor(markdown),
    editorProps: {
      handleClick(view, pos, event) {
        const target = event.target;
        const linkEl = target.tagName === 'A' ? target : target.closest('a');
        if (linkEl) {
          const href = linkEl.getAttribute('href');
          if (href) {
            event.preventDefault();
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
              window.electronAPI?.openExternal(href);
            } else {
              // Local or relative markdown file link
              if (onNavigateToFile) {
                onNavigateToFile(href);
              }
            }
            return true;
          }
        }
        return false;
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleSaveImage(file, view);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleSaveImage(file, view);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate({ editor: currentEditor }) {
      if (isUpdatingFromProp.current) return;
      const newMarkdown = serializeContentToMarkdown(currentEditor);
      onChange(newMarkdown);
    },
  });

  // Keep editor content in sync when markdown prop changes externally (e.g. file open, source mode edit)
  useEffect(() => {
    if (!editor) return;

    const currentEditorMarkdown = serializeContentToMarkdown(editor);
    if (markdown !== currentEditorMarkdown) {
      isUpdatingFromProp.current = true;
      const prepared = prepareContentForEditor(markdown);
      editor.commands.setContent(prepared, false);
      isUpdatingFromProp.current = false;
    }
  }, [markdown, editor]);

  return (
    <div className="editor-wrapper">
      <Toolbar
        editor={editor}
        currentFilePath={currentFilePath}
        onSaveRequest={onSaveRequest}
      />
      <div className="editor-scroll-area">
        <div className="editor-content-area">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
