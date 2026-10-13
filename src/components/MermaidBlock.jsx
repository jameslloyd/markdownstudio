import React, { useEffect, useState, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import mermaid from 'mermaid';
import { Code2, Eye, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';

let mermaidIdCounter = 0;

export default function MermaidBlock({ node, updateAttributes }) {
  const code = node.attrs.code || 'graph TD\n  A[Start] --> B[Finish]';
  const [isEditing, setIsEditing] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setLocalCode(node.attrs.code || '');
  }, [node.attrs.code]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
    });
  }, []);

  const renderDiagram = async (diagramCode) => {
    if (!diagramCode || !diagramCode.trim()) {
      setSvgContent('');
      setError(null);
      return;
    }

    const uniqueId = `mermaid-svg-${Date.now()}-${mermaidIdCounter++}`;
    try {
      const { svg } = await mermaid.render(uniqueId, diagramCode);
      setSvgContent(svg);
      setError(null);
    } catch (err) {
      console.warn('Mermaid syntax error:', err);
      // Mermaid appends an error SVG into document.body on error, clean it up if needed
      const errorEl = document.getElementById(uniqueId);
      if (errorEl) errorEl.remove();
      setError(err.message || 'Syntax error in Mermaid diagram');
    }
  };

  useEffect(() => {
    renderDiagram(localCode);
  }, [localCode]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    updateAttributes({ code: newCode });
  };

  const handleCopySvg = async () => {
    if (!svgContent) return;
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG:', err);
    }
  };

  return (
    <NodeViewWrapper className="diagram-block-container" data-type="mermaid">
      <div className="diagram-header">
        <div className="diagram-badge mermaid">
          <span>Mermaid</span>
        </div>
        <div className="diagram-actions">
          <button
            type="button"
            className={`diagram-btn ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'View rendered diagram' : 'Edit diagram code'}
          >
            {isEditing ? <Eye size={13} /> : <Code2 size={13} />}
            <span>{isEditing ? 'Done' : 'Edit'}</span>
          </button>
          {svgContent && !isEditing && (
            <button
              type="button"
              className="diagram-btn"
              onClick={handleCopySvg}
              title="Copy SVG to clipboard"
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'SVG'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Rendered SVG Preview */}
      <div
        className="diagram-render-area"
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {/* In-place Code Editor */}
      {isEditing && (
        <div className="diagram-editor-area">
          <textarea
            className="diagram-code-input"
            value={localCode}
            onChange={handleCodeChange}
            placeholder="Enter Mermaid diagram code..."
            rows={Math.max(5, localCode.split('\n').length + 1)}
            spellCheck="false"
          />
        </div>
      )}

      {/* Syntax Error Notice */}
      {error && isEditing && (
        <div className="diagram-error-banner">
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}
    </NodeViewWrapper>
  );
}
