import { Paragraph as TiptapParagraph } from '@tiptap/extension-paragraph';

export const CustomParagraph = TiptapParagraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: null,
        parseHTML: (element) => {
          const align = element.getAttribute('align') || element.style.textAlign;
          return align && align !== 'left' ? align : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.textAlign) return {};
          return {
            align: attributes.textAlign,
            style: `text-align: ${attributes.textAlign};`,
          };
        },
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const align = node.attrs.textAlign;
          if (align && align !== 'left') {
            state.write(`<p align="${align}">`);
            state.renderInline(node);
            state.write('</p>\n\n');
          } else {
            state.renderInline(node);
            state.closeBlock(node);
          }
        },
      },
    };
  },
});
