import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Globe, FileCode, Loader2, Check } from 'lucide-react';
import { prepareHtmlForExport, prepareDocxHtmlForExport } from '../utils/exportDocument';

export default function ExportDropdown({ fileName, theme = 'dark', onExportSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null); // 'pdf' | 'html' | 'docx' | null
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleExport = async (format) => {
    if (!window.electronAPI || exportingFormat) return;

    setExportingFormat(format);
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Document';

    try {
      if (format === 'html') {
        const fullHtml = await prepareHtmlForExport({ title: baseName, theme });
        const res = await window.electronAPI.exportHTML({
          html: fullHtml,
          defaultName: `${baseName}.html`,
        });
        if (res && res.canceled) return;
        if (onExportSuccess) onExportSuccess('HTML');
      } else if (format === 'pdf') {
        const printHtml = await prepareHtmlForExport({ title: baseName, theme: 'light' });
        const res = await window.electronAPI.exportPDF({
          html: printHtml,
          title: baseName,
          defaultName: `${baseName}.pdf`,
        });
        if (res && res.canceled) return;
        if (onExportSuccess) onExportSuccess('PDF');
      } else if (format === 'docx') {
        const docxHtml = await prepareDocxHtmlForExport({ title: baseName });
        const res = await window.electronAPI.exportDocx({
          html: docxHtml,
          defaultName: `${baseName}.docx`,
        });
        if (res && res.canceled) return;
        if (onExportSuccess) onExportSuccess('Word DOCX');
      }
    } catch (err) {
      console.error(`Export to ${format} failed:`, err);
      alert(`Export to ${format.toUpperCase()} failed: ${err.message || 'Unknown error'}`);
    } finally {
      setExportingFormat(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="export-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`btn-action btn-export ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={!!exportingFormat}
        title="Export document to PDF, HTML, or Word DOCX"
      >
        {exportingFormat ? (
          <Loader2 size={13} className="spin-icon" />
        ) : (
          <Download size={13} />
        )}
        <span>{exportingFormat ? `Exporting...` : 'Export'}</span>
        <ChevronDown size={11} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="export-menu-dropdown">
          <div className="export-menu-header">
            <span>Export Document</span>
          </div>

          <div className="export-menu-items">
            {/* PDF Option */}
            <button
              type="button"
              className="export-menu-item"
              onClick={() => handleExport('pdf')}
              disabled={!!exportingFormat}
            >
              <div className="export-item-icon pdf">
                <FileText size={15} />
              </div>
              <div className="export-item-info">
                <div className="export-item-title-row">
                  <span className="export-item-title">PDF Document</span>
                  <span className="export-badge">.pdf</span>
                </div>
                <span className="export-item-desc">Vector print-ready with diagrams</span>
              </div>
              <span className="export-shortcut">⌘P</span>
            </button>

            {/* HTML Option */}
            <button
              type="button"
              className="export-menu-item"
              onClick={() => handleExport('html')}
              disabled={!!exportingFormat}
            >
              <div className="export-item-icon html">
                <Globe size={15} />
              </div>
              <div className="export-item-info">
                <div className="export-item-title-row">
                  <span className="export-item-title">Standalone HTML</span>
                  <span className="export-badge">.html</span>
                </div>
                <span className="export-item-desc">Self-contained with embedded SVGs</span>
              </div>
              <span className="export-shortcut">⇧⌘H</span>
            </button>

            {/* DOCX Option */}
            <button
              type="button"
              className="export-menu-item"
              onClick={() => handleExport('docx')}
              disabled={!!exportingFormat}
            >
              <div className="export-item-icon docx">
                <FileCode size={15} />
              </div>
              <div className="export-item-info">
                <div className="export-item-title-row">
                  <span className="export-item-title">Microsoft Word</span>
                  <span className="export-badge">.docx</span>
                </div>
                <span className="export-item-desc">Formatted tables, lists & images</span>
              </div>
              <span className="export-shortcut">⇧⌘D</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
