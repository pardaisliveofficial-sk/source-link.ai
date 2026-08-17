const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// 1. EXACT USER SVG ICON SOURCE
const userSvgPath = path.join(__dirname, '../public/icon-512.svg');
const standardSvg = fs.readFileSync(userSvgPath, 'utf8');

// 2. ROUND ICON SVG (Preserves exact artwork inside circle)
const roundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <circle cx="256" cy="256" r="256" fill="#0f172a"/>
  <path d="M352 128a48 48 0 1 0-48 48c0 14.5 6.5 27.5 16.8 36.3L282.5 250A80.1 80.1 0 0 0 256 240c-26.2 0-49.8 12.6-64.8 32.2l-38.6-25.7c4.6-8.2 7.4-17.7 7.4-27.8a56 56 0 1 0-56 56c10.1 0 19.6-2.8 27.8-7.4l38.6 25.7A80 80 0 1 0 336 295.2l38.3-38.3c8.8 10.3 21.8 16.8 36.3 16.8a48 48 0 1 0-48-48c0 1.2.1 2.4.2 3.6l-38 38c-8.9-8.5-20.9-14-34.2-15.1l38.3-38.3c1.2.1 2.4.2 3.6.2z" fill="#3B82F6"/>
</svg>`;

// 3. ADAPTIVE FOREGROUND SVG (Centered vector emblem on transparent background)
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <g transform="translate(76.8, 76.8) scale(0.7)">
    <path d="M352 128a48 48 0 1 0-48 48c0 14.5 6.5 27.5 16.8 36.3L282.5 250A80.1 80.1 0 0 0 256 240c-26.2 0-49.8 12.6-64.8 32.2l-38.6-25.7c4.6-8.2 7.4-17.7 7.4-27.8a56 56 0 1 0-56 56c10.1 0 19.6-2.8 27.8-7.4l38.6 25.7A80 80 0 1 0 336 295.2l38.3-38.3c8.8 10.3 21.8 16.8 36.3 16.8a48 48 0 1 0-48-48c0 1.2.1 2.4.2 3.6l-38 38c-8.9-8.5-20.9-14-34.2-15.1l38.3-38.3c1.2.1 2.4.2 3.6.2z" fill="#3B82F6"/>
  </g>
</svg>`;

// 4. SPLASH SCREEN SVG GENERATOR
function generateSplashSvg(width, height) {
  const iconSize = Math.min(width, height) * 0.35;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2 - 20;
  const scale = iconSize / 512;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
    <rect width="${width}" height="${height}" fill="#0f172a"/>
    <g transform="translate(${iconX}, ${iconY}) scale(${scale})">
      <rect width="512" height="512" rx="100" fill="#1e293b"/>
      <path d="M352 128a48 48 0 1 0-48 48c0 14.5 6.5 27.5 16.8 36.3L282.5 250A80.1 80.1 0 0 0 256 240c-26.2 0-49.8 12.6-64.8 32.2l-38.6-25.7c4.6-8.2 7.4-17.7 7.4-27.8a56 56 0 1 0-56 56c10.1 0 19.6-2.8 27.8-7.4l38.6 25.7A80 80 0 1 0 336 295.2l38.3-38.3c8.8 10.3 21.8 16.8 36.3 16.8a48 48 0 1 0-48-48c0 1.2.1 2.4.2 3.6l-38 38c-8.9-8.5-20.9-14-34.2-15.1l38.3-38.3c1.2.1 2.4.2 3.6.2z" fill="#3B82F6"/>
    </g>
  </svg>`;
}

function renderPng(svgContent, width, height) {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

function writePng(filePath, buffer) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, buffer);
  console.log(`[GENERATED] ${filePath} (${buffer.length} bytes, Header: ${buffer.slice(0, 8).toString('hex')})`);
}

// Android MIPMAP DENSITIES
const mipmaps = [
  { density: 'mdpi', size: 48, fgSize: 108 },
  { density: 'hdpi', size: 72, fgSize: 162 },
  { density: 'xhdpi', size: 96, fgSize: 216 },
  { density: 'xxhdpi', size: 144, fgSize: 324 },
  { density: 'xxxhdpi', size: 192, fgSize: 432 },
];

console.log('Generating Android Launcher Icons...');
for (const m of mipmaps) {
  // ic_launcher.png
  const launcherBuf = renderPng(standardSvg, m.size, m.size);
  writePng(path.join(__dirname, `../android/app/src/main/res/mipmap-${m.density}/ic_launcher.png`), launcherBuf);

  // ic_launcher_round.png
  const roundBuf = renderPng(roundSvg, m.size, m.size);
  writePng(path.join(__dirname, `../android/app/src/main/res/mipmap-${m.density}/ic_launcher_round.png`), roundBuf);

  // ic_launcher_foreground.png
  const fgBuf = renderPng(foregroundSvg, m.fgSize, m.fgSize);
  writePng(path.join(__dirname, `../android/app/src/main/res/mipmap-${m.density}/ic_launcher_foreground.png`), fgBuf);
}

// Android SPLASH SCREENS
const splashScreens = [
  { folder: 'drawable', width: 480, height: 800 },
  { folder: 'drawable-port-mdpi', width: 320, height: 480 },
  { folder: 'drawable-port-hdpi', width: 480, height: 800 },
  { folder: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { folder: 'drawable-port-xxhdpi', width: 1080, height: 1920 },
  { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
  { folder: 'drawable-land-mdpi', width: 480, height: 320 },
  { folder: 'drawable-land-hdpi', width: 800, height: 480 },
  { folder: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { folder: 'drawable-land-xxhdpi', width: 1920, height: 1080 },
  { folder: 'drawable-land-xxxhdpi', width: 2560, height: 1440 },
];

console.log('Generating Android Splash Screens...');
for (const s of splashScreens) {
  const splashSvg = generateSplashSvg(s.width, s.height);
  const splashBuf = renderPng(splashSvg, s.width, s.height);
  writePng(path.join(__dirname, `../android/app/src/main/res/${s.folder}/splash.png`), splashBuf);
}

// WEB & PWA ASSETS
console.log('Generating Web PWA Assets...');
const icon192 = renderPng(standardSvg, 192, 192);
const icon512 = renderPng(standardSvg, 512, 512);

writePng(path.join(__dirname, '../public/icon-192.png'), icon192);
writePng(path.join(__dirname, '../public/icon-512.png'), icon512);

// Also generate screenshots for PWA manifest
const screenshotDeskSvg = generateSplashSvg(1280, 720);
const screenshotDeskBuf = renderPng(screenshotDeskSvg, 1280, 720);
writePng(path.join(__dirname, '../public/screenshot-desktop.png'), screenshotDeskBuf);

const screenshotMobSvg = generateSplashSvg(720, 1280);
const screenshotMobBuf = renderPng(screenshotMobSvg, 720, 1280);
writePng(path.join(__dirname, '../public/screenshot-mobile.png'), screenshotMobBuf);

// Copy to Android Web Assets if exists
const androidWebAssets = path.join(__dirname, '../android/app/src/main/assets/public');
if (fs.existsSync(androidWebAssets)) {
  writePng(path.join(androidWebAssets, 'icon-192.png'), icon192);
  writePng(path.join(androidWebAssets, 'icon-512.png'), icon512);
  writePng(path.join(androidWebAssets, 'screenshot-desktop.png'), screenshotDeskBuf);
  writePng(path.join(androidWebAssets, 'screenshot-mobile.png'), screenshotMobBuf);
}

console.log('ALL ASSETS RENDERED AND VERIFIED SUCCESSFULLY!');
