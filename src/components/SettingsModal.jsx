import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Save, Folder, Image, Sliders, Server, SunMoon } from 'lucide-react';

export default function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState({
    imageFolder: settings.imageFolder || './assets',
    filenamePattern: settings.filenamePattern || 'image-{timestamp}',
    theme: settings.theme || 'dark',
    fontSize: settings.fontSize || 16,
    autoSave: settings.autoSave !== undefined ? settings.autoSave : true,
    autoSaveInterval: settings.autoSaveInterval || 30,
    plantUmlServer: settings.plantUmlServer || 'https://www.plantuml.com/plantuml/svg',
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <SettingsIcon size={18} color="#38bdf8" />
            <span>Application Settings</span>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Image Pasting Settings */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Folder size={14} color="#38bdf8" />
              <span>Image Save Location (Relative Path)</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={form.imageFolder}
              onChange={(e) => handleChange('imageFolder', e.target.value)}
              placeholder="./assets"
            />
            <span className="form-hint">
              Images pasted into your document will be saved relative to the markdown file (e.g.
              <code>./assets</code>, <code>./images</code>, <code>attachments</code>).
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Image size={14} color="#38bdf8" />
              <span>Image Filename Pattern</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={form.filenamePattern}
              onChange={(e) => handleChange('filenamePattern', e.target.value)}
              placeholder="image-{timestamp}"
            />
            <span className="form-hint">
              Tokens available: <code>{'{timestamp}'}</code>, <code>{'{date}'}</code>, <code>{'{time}'}</code>.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Server size={14} color="#38bdf8" />
              <span>PlantUML Rendering Server</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={form.plantUmlServer}
              onChange={(e) => handleChange('plantUmlServer', e.target.value)}
              placeholder="https://www.plantuml.com/plantuml/svg"
            />
            <span className="form-hint">
              URL endpoint for fetching PlantUML SVG diagrams. Default: official PlantUML server or local docker instance.
            </span>
          </div>

          {/* Theme & Appearance */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SunMoon size={14} color="#38bdf8" />
              <span>Interface Theme</span>
            </label>
            <div className="mode-pill-toggle" style={{ width: 'fit-content' }}>
              <button
                type="button"
                className={`mode-btn ${form.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleChange('theme', 'dark')}
              >
                Dark (macOS Glass)
              </button>
              <button
                type="button"
                className={`mode-btn ${form.theme === 'light' ? 'active' : ''}`}
                onClick={() => handleChange('theme', 'light')}
              >
                Light
              </button>
            </div>
          </div>

          {/* Auto-save */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
            <div>
              <div className="form-label">Auto-save Enabled</div>
              <div className="form-hint">Automatically save changes to disk</div>
            </div>
            <input
              type="checkbox"
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              checked={form.autoSave}
              onChange={(e) => handleChange('autoSave', e.target.checked)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-action" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-action btn-primary" onClick={handleSave}>
            <Save size={14} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
