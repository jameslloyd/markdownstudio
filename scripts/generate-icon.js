const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      offscreen: true,
    },
  });

  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <!-- Gradient for squircle -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#090d16" />
      </linearGradient>

      <!-- Glow radial gradient -->
      <radialGradient id="glowGrad" cx="30%" cy="20%" r="70%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
        <stop offset="60%" stop-color="#818cf8" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>

      <!-- Accent gradient for emblem -->
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>

      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
      </linearGradient>

      <!-- Drop shadow -->
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.55" />
      </filter>
      <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#38bdf8" flood-opacity="0.4" />
      </filter>
    </defs>

    <!-- macOS App Squircle Shape (width 820, height 820, centered at x: 102, y: 102) -->
    <rect x="112" y="112" width="800" height="800" rx="180" ry="180" fill="url(#bgGrad)" filter="url(#shadow)" />
    <rect x="112" y="112" width="800" height="800" rx="180" ry="180" fill="url(#glowGrad)" />
    <rect x="112" y="112" width="800" height="800" rx="180" ry="180" fill="none" stroke="url(#borderGrad)" stroke-width="4" />

    <!-- Stylized Markdown GFM Logo -->
    <g transform="translate(192, 290)">
      <!-- Outline container -->
      <rect x="0" y="0" width="640" height="400" rx="48" fill="none" stroke="url(#brandGrad)" stroke-width="28" opacity="0.9" filter="url(#innerShadow)" />

      <!-- The 'M' Letter -->
      <path d="M 90 290 L 90 110 L 190 210 L 290 110 L 290 290" fill="none" stroke="url(#brandGrad)" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />

      <!-- The Down Arrow '↓' Letter -->
      <path d="M 450 110 L 450 290" fill="none" stroke="url(#brandGrad)" stroke-width="36" stroke-linecap="round" />
      <path d="M 370 210 L 450 290 L 530 210" fill="none" stroke="url(#brandGrad)" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Subtle Diagram Flow / Spark Accent at bottom -->
    <g transform="translate(512, 750)">
      <circle cx="-120" cy="0" r="14" fill="#38bdf8" opacity="0.8" />
      <line x1="-106" y1="0" x2="-20" y2="0" stroke="#38bdf8" stroke-width="4" stroke-dasharray="6,6" opacity="0.6" />
      <circle cx="0" cy="0" r="18" fill="#818cf8" />
      <line x1="18" y1="0" x2="106" y2="0" stroke="#818cf8" stroke-width="4" stroke-dasharray="6,6" opacity="0.6" />
      <circle cx="120" cy="0" r="14" fill="#f472b6" opacity="0.8" />
    </g>
  </svg>
  `;

  const html = `<!DOCTYPE html><html><body style="margin:0;overflow:hidden;background:transparent;">${svgContent}</body></html>`;
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  // Wait a moment for layout
  await new Promise((resolve) => setTimeout(resolve, 500));

  const image = await win.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
  const pngBuffer = image.toPNG();

  const buildDir = path.join(__dirname, '../build');
  fs.mkdirSync(buildDir, { recursive: true });

  const iconPath = path.join(buildDir, 'icon.png');
  fs.writeFileSync(iconPath, pngBuffer);
  console.log('App icon generated successfully at:', iconPath);

  app.quit();
});
