const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const screenshotsDir = path.join(__dirname, '../docs/screenshots');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);

  // Allow DOM, fonts, and Mermaid rendering to settle
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 1. Capture main WYSIWYG view with rendered Mermaid diagram
  const img1 = await win.capturePage();
  fs.writeFileSync(path.join(screenshotsDir, 'editor-wysiwyg.png'), img1.toPNG());
  console.log('Saved editor-wysiwyg.png');

  // 2. Open diagram modal by clicking diagram button or executing JS
  await win.webContents.executeJavaScript(`
    const diagBtn = document.querySelector('button[title*="Insert Diagram"]');
    if (diagBtn) diagBtn.click();
  `);
  await new Promise((resolve) => setTimeout(resolve, 600));

  const img2 = await win.capturePage();
  fs.writeFileSync(path.join(screenshotsDir, 'diagram-modal.png'), img2.toPNG());
  console.log('Saved diagram-modal.png');

  // Close diagram modal and open settings modal
  await win.webContents.executeJavaScript(`
    const closeBtn = document.querySelector('.modal-dialog .btn-icon');
    if (closeBtn) closeBtn.click();
    setTimeout(() => {
      const settingsBtn = document.querySelector('button[title*="Preferences"]');
      if (settingsBtn) settingsBtn.click();
    }, 200);
  `);
  await new Promise((resolve) => setTimeout(resolve, 600));

  const img3 = await win.capturePage();
  fs.writeFileSync(path.join(screenshotsDir, 'settings-modal.png'), img3.toPNG());
  console.log('Saved settings-modal.png');

  // Copy app icon to docs/screenshots
  const iconSource = path.join(__dirname, '../build/icon.png');
  if (fs.existsSync(iconSource)) {
    fs.copyFileSync(iconSource, path.join(screenshotsDir, 'app-icon.png'));
    console.log('Copied app-icon.png');
  }

  app.quit();
});
