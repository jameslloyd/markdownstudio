import React, { useEffect, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import plantumlEncoder from 'plantuml-encoder';
import { Code2, Eye, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';

export default function PlantUMLBlock({ node, updateAttributes, extension }) {
  const code = node.attrs.code || '@startuml\nAlice -> Bob: Hello\n@enduml';
  const [isEditing, setIsEditing] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Default server
  const serverUrl = window.__appSettings?.plantUmlServer || 'https://www.plantuml.com/plantuml/svg';

  useEffect(() => {
    setLocalCode(node.attrs.code || '');
  }, [node.attrs.code]);

  useEffect(() => {
    if (!localCode || !localCode.trim()) {
      setImageUrl('');
      setError(null);
      return;
    }

    try {
      const encoded = plantumlEncoder.encode(localCode.trim());
      const base = serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`;
      const url = `${base}${encoded}`;
      setImageUrl(url);
      setError(null);
    } catch (err) {
      console.error('PlantUML encode error:', err);
      setError(err.message || 'Failed to encode PlantUML');
    }
  }, [localCode, serverUrl]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    updateAttributes({ code: newCode });
  };

  const handleCopyUrl = async () => {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy PlantUML URL:', err);
    }
  };

  return (
    <NodeViewWrapper className="diagram-block-container" data-type="plantuml">
      <div className="diagram-header">
        <div className="diagram-badge plantuml">
          <span>PlantUML</span>
        </div>
        <div className="diagram-actions">
          <button
            type="button"
            className={`diagram-btn ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'View rendered diagram' : 'Edit PlantUML code'}
          >
            {isEditing ? <Eye size={13} /> : <Code2 size={13} />}
            <span>{isEditing ? 'Done' : 'Edit'}</span>
          </button>
          {imageUrl && !isEditing && (
            <button
              type="button"
              className="diagram-btn"
              onClick={handleCopyUrl}
              title="Copy diagram link"
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Link'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Rendered SVG Preview */}
      <div className="diagram-render-area">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="PlantUML Diagram"
            onError={() => setError('Could not load diagram from PlantUML server. Check connection or syntax.')}
            onLoad={() => setError(null)}
          />
        ) : (
          <div className="diagram-loading">
            <span>No diagram code provided</span>
          </div>
        )}
      </div>

      {/* In-place Code Editor */}
      {isEditing && (
        <div className="diagram-editor-area">
          <textarea
            className="diagram-code-input"
            value={localCode}
            onChange={handleCodeChange}
            placeholder="Enter PlantUML diagram code..."
            rows={Math.max(5, localCode.split('\n').length + 1)}
            spellCheck="false"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="diagram-error-banner">
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}
    </NodeViewWrapper>
  );
}
