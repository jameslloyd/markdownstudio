const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const result = await win.webContents.executeJavaScript(`
    (async () => {
      const ed = window.__editor;
      if (!ed) {
        return { success: false, error: 'Editor not found on window.__editor' };
      }

      const inputMarkdown = [
        '<div align="center">',
        '',
        '<img src="docs/screenshots/app-icon.png" alt="Icon" width="128" height="128" />',
        '',
        '# Markdown Studio',
        '',
        'A modern editor for developers.',
        '',
        '</div>',
        '',
        'Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.',
        '',
        'Water formula is H<sub>2</sub>O and exponent is E = mc<sup>2</sup>.',
        '',
        'Here is <u>underlined text</u> and <mark>highlighted text</mark>.',
        '',
        '<details>',
        '<summary>Click to view features</summary>',
        '',
        'Here are hidden details inside accordion.',
        '',
        '</details>'
      ].join('\\n');

      // Set content in editor
      ed.commands.setContent(inputMarkdown);

      // Verify DOM structure
      const prose = document.querySelector('.ProseMirror');
      const hasDivCenter = !!prose.querySelector('div[align="center"]');
      const hasKbd = !!prose.querySelector('kbd');
      const hasDetails = !!prose.querySelector('details');
      const hasSummary = !!prose.querySelector('summary');
      const hasSub = !!prose.querySelector('sub');
      const hasSup = !!prose.querySelector('sup');
      const hasU = !!prose.querySelector('u');
      const hasMark = !!prose.querySelector('mark');
      const img = prose.querySelector('img[width="128"]');
      const hasImgAttrs = !!(img && img.getAttribute('height') === '128');

      // Now serialize back to markdown
      const outputMarkdown = ed.storage.markdown.getMarkdown();

      return {
        success: true,
        domCheck: {
          hasDivCenter,
          hasKbd,
          hasDetails,
          hasSummary,
          hasSub,
          hasSup,
          hasU,
          hasMark,
          hasImgAttrs,
        },
        outputMarkdown,
      };
    })()
  `);

  console.log('=== TEST RESULT ===');
  console.log('DOM Checks:', JSON.stringify(result.domCheck, null, 2));
  console.log('Output Markdown:\n', result.outputMarkdown);

  const checks = result.domCheck;
  const allPassed =
    checks &&
    checks.hasDivCenter &&
    checks.hasKbd &&
    checks.hasDetails &&
    checks.hasSummary &&
    checks.hasSub &&
    checks.hasSup &&
    checks.hasU &&
    checks.hasMark &&
    checks.hasImgAttrs &&
    result.outputMarkdown.includes('<div align="center">') &&
    result.outputMarkdown.includes('<kbd>') &&
    result.outputMarkdown.includes('<sub>') &&
    result.outputMarkdown.includes('<sup>') &&
    result.outputMarkdown.includes('<u>') &&
    result.outputMarkdown.includes('<mark>') &&
    result.outputMarkdown.includes('<details>') &&
    result.outputMarkdown.includes('<summary>');

  console.log('ALL CHECKS PASSED:', allPassed);
  app.quit();
  process.exit(allPassed ? 0 : 1);
});
