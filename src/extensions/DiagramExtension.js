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
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid"]',
        getAttrs: (element) => ({
          code: element.getAttribute('data-code') || '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'mermaid', 'data-code': HTMLAttributes.code }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidBlock);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write('```mermaid\n');
          state.text(node.attrs.code || '', false);
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
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="plantuml"]',
        getAttrs: (element) => ({
          code: element.getAttribute('data-code') || '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'plantuml', 'data-code': HTMLAttributes.code }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlantUMLBlock);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write('```plantuml\n');
          state.text(node.attrs.code || '', false);
          state.ensureNewLine();
          state.write('```\n\n');
        },
        parse: {},
      },
    };
  },
});
