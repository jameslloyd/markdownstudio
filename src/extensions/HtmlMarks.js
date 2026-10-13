import { Mark, mergeAttributes } from '@tiptap/core';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Underline } from '@tiptap/extension-underline';

export const HtmlKbd = Mark.create({
  name: 'kbd',

  parseHTML() {
    return [{ tag: 'kbd' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['kbd', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleKbd: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '<kbd>',
          close: '</kbd>',
        },
      },
    };
  },
});

export const HtmlUnderline = Underline.extend({
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '<u>',
          close: '</u>',
        },
      },
    };
  },
});

export const HtmlSub = Subscript.extend({
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '<sub>',
          close: '</sub>',
        },
      },
    };
  },
});

export const HtmlSup = Superscript.extend({
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '<sup>',
          close: '</sup>',
        },
      },
    };
  },
});

export const HtmlMark = Mark.create({
  name: 'mark',

  parseHTML() {
    return [{ tag: 'mark' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleHighlight: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '<mark>',
          close: '</mark>',
        },
      },
    };
  },
});
