import { Node, mergeAttributes } from '@tiptap/core';

export const HtmlSummary = Node.create({
  name: 'summary',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'summary' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        return this.editor.commands.createParagraphNear();
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write('<summary>');
          state.renderInline(node);
          state.write('</summary>\n\n');
        },
      },
    };
  },
});

export const HtmlDetails = Node.create({
  name: 'details',
  group: 'block',
  content: 'summary? block*',
  defining: true,

  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: (element) => element.hasAttribute('open'),
        renderHTML: (attributes) => (attributes.open ? { open: 'open' } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes), 0];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const openAttr = node.attrs.open ? ' open' : '';
          state.write(`<details${openAttr}>\n\n`);
          state.renderContent(node);
          state.ensureNewLine();
          state.write('</details>\n\n');
        },
      },
    };
  },
});
