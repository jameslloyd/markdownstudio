import { Node, mergeAttributes } from '@tiptap/core';

export const HtmlDiv = Node.create({
  name: 'htmlDiv',
  group: 'block',
  content: 'block*',
  defining: true,

  addAttributes() {
    return {
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('align') || element.style.textAlign || null,
        renderHTML: (attributes) => {
          if (!attributes.align) return {};
          return {
            align: attributes.align,
            style: `text-align: ${attributes.align};`,
          };
        },
      },
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class') || null,
        renderHTML: (attributes) => (attributes.class ? { class: attributes.class } : {}),
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style') || null,
        renderHTML: (attributes) => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[align]',
      },
      {
        tag: 'div[style*="text-align"]',
      },
      {
        tag: 'div.center',
      },
      {
        tag: 'center',
        getAttrs: () => ({ align: 'center' }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const align = node.attrs.align || 'center';
          const className = node.attrs.class;
          let openTag = `<div align="${align}"`;
          if (className) openTag += ` class="${className}"`;
          openTag += '>\n\n';

          state.write(openTag);
          state.renderContent(node);
          state.ensureNewLine();
          state.write('</div>\n\n');
        },
      },
    };
  },
});
