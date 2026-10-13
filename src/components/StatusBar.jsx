import React from 'react';
import { FileText, Clock, Type, ShieldCheck, Sun, Moon } from 'lucide-react';

export default function StatusBar({
  filePath,
  isDirty,
  markdown,
  mode,
  theme,
  onToggleTheme,
}) {
  const words = markdown ? markdown.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = markdown ? markdown.length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return (
    <footer className="app-statusbar">
      <div className="statusbar-left">
        <div className="statusbar-item">
          <FileText size={12} />
          <span>{filePath ? filePath : 'Untitled Document'}</span>
          {isDirty && <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>• Unsaved</span>}
        </div>
      </div>

      <div className="statusbar-right">
        <div className="statusbar-item">
          <Type size={12} />
          <span>{words} words</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>{chars} chars</span>
        </div>

        <div className="statusbar-item">
          <Clock size={12} />
          <span>~{readTimeMinutes} min read</span>
        </div>

        <div className="statusbar-item">
          <ShieldCheck size={12} color="#10b981" />
          <span>GFM Compliant</span>
        </div>

        <div
          className="statusbar-item"
          style={{ cursor: 'pointer' }}
          onClick={onToggleTheme}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
          <span style={{ textTransform: 'capitalize' }}>{theme}</span>
        </div>
      </div>
    </footer>
  );
}
