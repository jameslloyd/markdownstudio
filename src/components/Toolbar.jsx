import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table as TableIcon,
  Plus,
  Minus,
  Trash2,
  Image as ImageIcon,
  GitBranch,
  FileCode,
  MinusSquare,
  Undo2,
  Redo2,
  Sparkles,
  FileSymlink,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import DiagramModal from './DiagramModal';

export default function Toolbar({ editor, currentFilePath, onSaveRequest }) {
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);

  if (!editor) return null;

  const insertDiagram = (type, code) => {
    if (type === 'mermaid') {
      editor.chain().focus().insertContent({
        type: 'mermaidDiagram',
        attrs: { code },
      }).run();
    } else {
      editor.chain().focus().insertContent({
        type: 'plantumlDiagram',
        attrs: { code },
      }).run();
    }
  };

  const handlePickImage = async () => {
    // Allows picking an image file from disk to embed
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file || !window.electronAPI) return;

      const buffer = await file.arrayBuffer();
      const ext = file.type.split('/')[1] || 'png';
      const res = await window.electronAPI.savePastedImage({
        buffer,
        ext,
        currentFilePath: window.__currentFilePath,
      });

      if (res && res.success) {
        editor.chain().focus().setImage({ src: res.relativePath, alt: file.name }).run();
      }
    };
    input.click();
  };

  const handleLinkMarkdownFile = async () => {
    if (!window.electronAPI) return;
    try {
      const res = await window.electronAPI.pickMarkdownFile(currentFilePath);
      if (res && !res.canceled && res.relativePath) {
        const { state } = editor.view;
        const { empty } = state.selection;

        if (empty) {
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'text',
              text: res.displayName,
              marks: [{ type: 'link', attrs: { href: res.relativePath } }],
            })
            .run();
        } else {
          editor.chain().focus().setLink({ href: res.relativePath }).run();
        }
      }
    } catch (err) {
      console.error('Failed to link markdown file:', err);
    }
  };

  const handleToggleWebLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter link URL (web address or path):', previousUrl || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url.trim() }).run();
    }
  };

  return (
    <>
      <div className="editor-toolbar">
        {/* Undo / Redo */}
        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Cmd+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 size={15} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Headings */}
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 size={15} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 size={15} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            <Heading3 size={15} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Inline Formatting */}
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Cmd+B)"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Cmd+I)"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('code') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline Code"
          >
            <Code size={15} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Links & Document Linking */}
        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleLinkMarkdownFile}
            title="Link to Markdown Document (.md)"
          >
            <FileSymlink size={15} color="#818cf8" />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
            onClick={handleToggleWebLink}
            title={editor.isActive('link') ? 'Remove Link' : 'Insert Web Link'}
          >
            {editor.isActive('link') ? <Unlink size={15} /> : <LinkIcon size={15} />}
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Lists & Callouts */}
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('taskList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Task List / Checklist"
          >
            <CheckSquare size={15} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <Quote size={15} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Tables */}
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive('table') ? 'active' : ''}`}
            onClick={() => {
              if (editor.isActive('table')) {
                setIsTableMenuOpen(!isTableMenuOpen);
              } else {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              }
            }}
            title="Insert Table (3x3)"
          >
            <TableIcon size={15} />
          </button>

          {editor.isActive('table') && (
            <>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add Row"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add Column"
              >
                <Plus size={13} style={{ transform: 'rotate(90deg)' }} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Delete Row"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Delete Column"
              >
                <Minus size={13} style={{ transform: 'rotate(90deg)' }} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Delete Table"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>

        <div className="toolbar-divider" />

        {/* Diagrams & Visuals */}
        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsDiagramModalOpen(true)}
            title="Insert Diagram (Mermaid / PlantUML)"
          >
            <GitBranch size={15} color="#38bdf8" />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handlePickImage}
            title="Insert Image (or paste from clipboard)"
          >
            <ImageIcon size={15} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Divider"
          >
            <MinusSquare size={15} />
          </button>
        </div>
      </div>

      {/* Diagrams Picker Modal */}
      {isDiagramModalOpen && (
        <DiagramModal
          onClose={() => setIsDiagramModalOpen(false)}
          onSelect={(type, code) => {
            insertDiagram(type, code);
            setIsDiagramModalOpen(false);
          }}
        />
      )}
    </>
  );
}
