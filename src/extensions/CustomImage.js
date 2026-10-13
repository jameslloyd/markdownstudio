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
});
