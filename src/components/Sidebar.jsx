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
  onJumpToHeading,
}) {
  if (!isOpen) return null;

  // Extract headings for outline (supporting # to ###### and <h1-6>)
  const headings = [];
  const lines = markdown.split('\n');
  lines.forEach((line, index) => {
    // Markdown headings: # ... to ###### ...
    const mdMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (mdMatch) {
      headings.push({
        level: mdMatch[1].length,
        text: mdMatch[2].replace(/[#*`_~]/g, '').trim(),
        line: index + 1,
      });
      return;
    }

    // HTML headings: <h1 ...>...</h1>
    const htmlMatch = line.match(/<h([1-6])(?:[^>]*)>(.*?)<\/h\1>/i);
    if (htmlMatch) {
      headings.push({
        level: parseInt(htmlMatch[1], 10),
        text: htmlMatch[2].replace(/<[^>]+>/g, '').trim(),
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
              className="sidebar-item outline-heading-item"
              style={{
                paddingLeft: `${10 + (h.level - 1) * 10}px`,
                fontSize: h.level === 1 ? '13px' : '12px',
                fontWeight: h.level <= 2 ? 600 : 400,
              }}
              onClick={() => onJumpToHeading && onJumpToHeading(h, i)}
              title={`Jump to: ${h.text}`}
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
