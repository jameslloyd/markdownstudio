import { Heading as TiptapHeading } from '@tiptap/extension-heading';

export const CustomHeading = TiptapHeading.extend({
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
            const tag = `h${node.attrs.level}`;
            state.write(`<${tag} align="${align}">`);
            state.renderInline(node);
            state.write(`</${tag}>\n\n`);
          } else {
            state.write(state.repeat('#', node.attrs.level) + ' ');
            state.renderInline(node);
            state.closeBlock(node);
          }
        },
      },
    };
  },
});
