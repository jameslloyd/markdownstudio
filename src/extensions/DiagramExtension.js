import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MermaidBlock from '../components/MermaidBlock';
import PlantUMLBlock from '../components/PlantUMLBlock';

export const MermaidExtension = Node.create({
  name: 'mermaidDiagram',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: 'graph TD\n  A[Start] --> B[Process]\n  B --> C[Finish]',
        parseHTML: (element) => {
          const raw = element.getAttribute('data-code') || element.getAttribute('code') || '';
          try {
            return decodeURIComponent(raw);
          } catch (_) {
            return raw;
          }
        },
        renderHTML: (attributes) => ({
          'data-code': encodeURIComponent(attributes.code || ''),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const raw = HTMLAttributes.code || '';
    const encoded = encodeURIComponent(raw);
    return ['div', { 'data-type': 'mermaid', 'data-code': encoded }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidBlock);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write('```mermaid\n');
          let code = node.attrs.code || '';
          if (code.includes('%20') || code.includes('%0A') || code.includes('%2F') || code.includes('%3E')) {
            try {
              code = decodeURIComponent(code);
            } catch (_) {}
          }
          state.text(code, false);
          state.ensureNewLine();
          state.write('```\n\n');
        },
        parse: {
          // Custom parse handled in markdown pre/post hook
        },
      },
    };
  },
});

export const PlantUMLExtension = Node.create({
  name: 'plantumlDiagram',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: '@startuml\nAlice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n@enduml',
        parseHTML: (element) => {
          const raw = element.getAttribute('data-code') || element.getAttribute('code') || '';
          try {
            return decodeURIComponent(raw);
          } catch (_) {
            return raw;
          }
        },
        renderHTML: (attributes) => ({
          'data-code': encodeURIComponent(attributes.code || ''),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="plantuml"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const raw = HTMLAttributes.code || '';
    const encoded = encodeURIComponent(raw);
    return ['div', { 'data-type': 'plantuml', 'data-code': encoded }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlantUMLBlock);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write('```plantuml\n');
          let code = node.attrs.code || '';
          if (code.includes('%20') || code.includes('%0A') || code.includes('%2F') || code.includes('%3E')) {
            try {
              code = decodeURIComponent(code);
            } catch (_) {}
          }
          state.text(code, false);
          state.ensureNewLine();
          state.write('```\n\n');
        },
        parse: {},
      },
    };
  },
});
