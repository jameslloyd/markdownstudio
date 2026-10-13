import { Image } from '@tiptap/extension-image';

export const CustomImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width') || element.style.width || null,
        renderHTML: (attributes) => (attributes.width ? { width: attributes.width } : {}),
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height') || element.style.height || null,
        renderHTML: (attributes) => (attributes.height ? { height: attributes.height } : {}),
      },
      align: {
        default: null,
        parseHTML: (element) => element.getAttribute('align') || null,
        renderHTML: (attributes) => (attributes.align ? { align: attributes.align } : {}),
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style') || null,
        renderHTML: (attributes) => (attributes.style ? { style: attributes.style } : {}),
      },
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class') || null,
        renderHTML: (attributes) => (attributes.class ? { class: attributes.class } : {}),
      },
      'data-relative-src': {
        default: null,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { src, 'data-relative-src': relSrc, ...rest } = HTMLAttributes;
    let displaySrc = src;

    // If relative path and electron is present, we can map to md-local protocol
    const activePath = window.__currentFilePath;
    const baseDir = window.__currentBaseDir;

    if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('md-local:')) {
      if (baseDir) {
        // Build clean path for md-local protocol
        const cleanRel = src.startsWith('./') ? src.slice(2) : src;
        const normalized = `${baseDir}/${cleanRel}`.replace(/\\/g, '/');
        const absPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
        displaySrc = `md-local://local${absPath}`;
      }
    }

    return [
      'img',
      {
        ...rest,
        src: displaySrc,
        'data-relative-src': relSrc || src,
      },
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const src = node.attrs['data-relative-src'] || node.attrs.src || '';
          const alt = node.attrs.alt || '';
          const width = node.attrs.width;
          const height = node.attrs.height;
          const align = node.attrs.align;
          const style = node.attrs.style;
          const className = node.attrs.class;

          // If HTML-specific attributes are used, serialize as <img> tag
          if (width || height || align || style || className) {
            let imgTag = `<img src="${src}"`;
            if (alt) imgTag += ` alt="${alt}"`;
            if (width) imgTag += ` width="${width}"`;
            if (height) imgTag += ` height="${height}"`;
            if (align) imgTag += ` align="${align}"`;
            if (className) imgTag += ` class="${className}"`;
            if (style) imgTag += ` style="${style}"`;
            imgTag += ' />';
            state.write(imgTag);
          } else {
            // Standard Markdown image tag
            state.write(`![${alt}](${src})`);
          }
        },
      },
    };
  },
});
