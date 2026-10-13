import React, { useState } from 'react';
import { DIAGRAM_TEMPLATES } from '../utils/diagramTemplates';
import { X, GitBranch, Search, Sparkles } from 'lucide-react';

export default function DiagramModal({ onClose, onSelect }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredTemplates = DIAGRAM_TEMPLATES.filter((tpl) => {
    const matchesType = filter === 'all' || tpl.type === filter;
    const matchesSearch =
      tpl.title.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <GitBranch size={18} color="#38bdf8" />
            <span>Insert Diagram</span>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={15}
                style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-subtle)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', width: '100%' }}
                placeholder="Search diagrams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="mode-pill-toggle">
              <button
                type="button"
                className={`mode-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`mode-btn ${filter === 'mermaid' ? 'active' : ''}`}
                onClick={() => setFilter('mermaid')}
              >
                Mermaid
              </button>
              <button
                type="button"
                className={`mode-btn ${filter === 'plantuml' ? 'active' : ''}`}
                onClick={() => setFilter('plantuml')}
              >
                PlantUML
              </button>
            </div>
          </div>

          {/* List of Templates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => onSelect(tpl.type, tpl.code)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.background = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {tpl.title}
                    </span>
                    <span
                      className={`diagram-badge ${tpl.type}`}
                      style={{ fontSize: '10px', padding: '1px 6px' }}
                    >
                      {tpl.type}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {tpl.description}
                  </p>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-action btn-primary"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(tpl.type, tpl.code);
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Insert</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
