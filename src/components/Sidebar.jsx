import React from 'react';
import {
  ListTree,
  FileCode,
  Clock,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  markdown,
  recentFiles,
  onOpenFileByPath,
  onLoadTemplate,
}) {
  if (!isOpen) return null;

  // Extract headings for outline
  const headings = [];
  const lines = markdown.split('\n');
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,3})\s+(.*)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: index + 1,
      });
    }
  });

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={14} color="#38bdf8" />
          <span>Explorer</span>
        </span>
      </div>

      <div className="sidebar-section">
        {/* Table of contents outline */}
        <div className="sidebar-section-title">
          <ListTree size={12} />
          <span>Document Outline</span>
        </div>
        {headings.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', padding: '6px 10px' }}>
            No headings found. Add # Heading in document.
          </div>
        ) : (
          headings.map((h, i) => (
            <div
              key={i}
              className="sidebar-item"
              style={{
                paddingLeft: `${10 + (h.level - 1) * 12}px`,
                fontSize: h.level === 1 ? '13px' : '12px',
                fontWeight: h.level === 1 ? 600 : 400,
              }}
              title={h.text}
            >
              <ChevronRight size={11} style={{ opacity: 0.6 }} />
              <span>{h.text}</span>
            </div>
          ))
        )}

        <div style={{ height: 16 }} />

        {/* Quick Sample Documents */}
        <div className="sidebar-section-title">
          <Sparkles size={12} color="#f472b6" />
          <span>Starter Templates</span>
        </div>
        <div
          className="sidebar-item"
          onClick={() => onLoadTemplate('architecture')}
          title="Architecture Spec with Mermaid"
        >
          <FileCode size={14} />
          <span>Architecture Spec</span>
        </div>
        <div
          className="sidebar-item"
          onClick={() => onLoadTemplate('gfm')}
          title="Full GitHub Markdown Tour"
        >
          <FileCode size={14} />
          <span>GFM Feature Tour</span>
        </div>
        <div
          className="sidebar-item"
          onClick={() => onLoadTemplate('plantuml')}
          title="PlantUML Microservices Flow"
        >
          <FileCode size={14} />
          <span>PlantUML Sequence</span>
        </div>

        {recentFiles && recentFiles.length > 0 && (
          <>
            <div style={{ height: 16 }} />
            <div className="sidebar-section-title">
              <Clock size={12} />
              <span>Recent Files</span>
            </div>
            {recentFiles.map((file, i) => (
              <div
                key={i}
                className="sidebar-item"
                onClick={() => onOpenFileByPath(file)}
                title={file}
              >
                <FileCode size={13} />
                <span>{file.split('/').pop()}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
