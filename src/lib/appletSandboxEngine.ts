import * as Babel from '@babel/standalone';
import { ExtractedFile } from '../types';

export interface SandboxLogEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  details?: string | null;
  timestamp: string;
}

export interface BuildDiagnostic {
  file: string;
  line?: number;
  column?: number;
  message: string;
  type: 'error' | 'warning';
}

export interface SandboxBundleResult {
  htmlUrl: string;
  htmlContent: string;
  diagnostics: BuildDiagnostic[];
  entryPoint: string;
  projectType: 'react-vite' | 'react-spa' | 'vanilla-html' | 'empty';
  totalTranspiled: number;
}

/**
 * Normalizes file path to forward slashes with no leading slash
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Resolves a relative import path (e.g. "./components/Header" from "src/App.tsx")
 */
export function resolveRelativePath(fromPath: string, importPath: string, files: Map<string, ExtractedFile>): string | null {
  const fromParts = fromPath.split('/');
  fromParts.pop(); // remove filename

  const importParts = importPath.split('/');
  const resolvedParts: string[] = [...fromParts];

  for (const part of importParts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (resolvedParts.length > 0) resolvedParts.pop();
    } else {
      resolvedParts.push(part);
    }
  }

  const basePath = resolvedParts.join('/');

  // Potential extensions to check
  const candidateExtensions = [
    '',
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '.json',
    '.css',
    '/index.tsx',
    '/index.ts',
    '/index.jsx',
    '/index.js'
  ];

  for (const ext of candidateExtensions) {
    const testPath = normalizePath(basePath + ext);
    if (files.has(testPath)) {
      return testPath;
    }
  }

  // Case-insensitive search fallback
  for (const [filePath] of files.entries()) {
    const norm = normalizePath(filePath);
    for (const ext of candidateExtensions) {
      if (norm.toLowerCase() === normalizePath(basePath + ext).toLowerCase()) {
        return filePath;
      }
    }
  }

  return null;
}

/**
 * Detects the entry point of the project from the extracted files.
 */
export function detectEntryPoint(files: Map<string, ExtractedFile>): { entryHtml?: string; entryScript?: string; type: SandboxBundleResult['projectType'] } {
  // Check for index.html at root or in public/
  let entryHtml: string | undefined;
  if (files.has('index.html')) entryHtml = 'index.html';
  else if (files.has('public/index.html')) entryHtml = 'public/index.html';
  else {
    for (const p of files.keys()) {
      if (p.endsWith('index.html')) {
        entryHtml = p;
        break;
      }
    }
  }

  // Check for React / Vite entry script
  const scriptCandidates = [
    'src/main.tsx',
    'src/main.jsx',
    'src/index.tsx',
    'src/index.jsx',
    'src/App.tsx',
    'src/App.jsx',
    'src/index.js',
    'src/main.js',
    'main.tsx',
    'main.jsx',
    'index.tsx',
    'index.jsx',
    'App.tsx',
    'App.jsx',
    'index.js',
    'app.js'
  ];

  let entryScript: string | undefined;
  for (const cand of scriptCandidates) {
    if (files.has(cand)) {
      entryScript = cand;
      break;
    }
  }

  if (entryHtml && entryScript) {
    return { entryHtml, entryScript, type: 'react-vite' };
  } else if (entryScript) {
    return { entryHtml, entryScript, type: 'react-spa' };
  } else if (entryHtml) {
    return { entryHtml, entryScript, type: 'vanilla-html' };
  }

  return { type: 'empty' };
}

/**
 * Transpiles TypeScript / JSX code into standard JavaScript ES module
 */
function transpileCode(code: string, filename: string): { jsCode: string; error?: string } {
  try {
    const isTypeScript = filename.endsWith('.ts') || filename.endsWith('.tsx');
    const isJsx = filename.endsWith('.tsx') || filename.endsWith('.jsx');

    const result = Babel.transform(code, {
      filename,
      presets: [
        [
          'react',
          {
            runtime: 'automatic',
            importSource: 'react',
          },
        ],
        ...(isTypeScript
          ? [
              [
                'typescript',
                {
                  isTSX: isJsx,
                  allExtensions: true,
                },
              ],
            ]
          : []),
      ],
      plugins: [],
      sourceMaps: false,
    });

    return { jsCode: result.code || '' };
  } catch (err: any) {
    return { jsCode: '', error: err.message || String(err) };
  }
}

/**
 * Rewrites imports in JavaScript/TypeScript code to point to Blob URLs or CDN packages
 */
function rewriteImports(
  code: string,
  filePath: string,
  files: Map<string, ExtractedFile>,
  blobUrlMap: Map<string, string>,
  assetUrlMap: Map<string, string>
): string {
  // Regex for import and export statements
  // Handles:
  // import ... from '...';
  // import '...';
  // export ... from '...';
  return code.replace(
    /(from\s+['"]|import\s+['"]|export\s+[^;]*?from\s+['"])([^'"]+)(['"])/g,
    (match, prefix, importTarget, suffix) => {
      // 1. Check if relative import (e.g. "./App", "../components/Header", "./style.css")
      if (importTarget.startsWith('.') || importTarget.startsWith('/')) {
        const resolvedPath = resolveRelativePath(filePath, importTarget, files);

        if (resolvedPath) {
          // If it's a CSS file
          if (resolvedPath.endsWith('.css')) {
            return `${prefix}data:text/javascript,console.log("Loaded CSS: ${resolvedPath}")${suffix}`;
          }

          // If it's an asset (image/svg/etc)
          if (assetUrlMap.has(resolvedPath)) {
            const assetUrl = assetUrlMap.get(resolvedPath)!;
            return `${prefix}data:text/javascript,export default ${JSON.stringify(assetUrl)};${suffix}`;
          }

          // If it's a JS/TS module
          if (blobUrlMap.has(resolvedPath)) {
            return `${prefix}${blobUrlMap.get(resolvedPath)}${suffix}`;
          }
        }
      }

      // 2. Third-party package import (e.g. "lucide-react", "canvas-confetti", "motion/react")
      // Check if import is already mapped or needs esm.sh CDN resolver
      if (!importTarget.startsWith('http://') && !importTarget.startsWith('https://') && !importTarget.startsWith('data:') && !importTarget.startsWith('blob:')) {
        // Special package alias handling
        if (importTarget === 'react') return `${prefix}https://esm.sh/react@19.0.0${suffix}`;
        if (importTarget === 'react-dom') return `${prefix}https://esm.sh/react-dom@19.0.0${suffix}`;
        if (importTarget === 'react-dom/client') return `${prefix}https://esm.sh/react-dom@19.0.0/client${suffix}`;
        if (importTarget === 'react/jsx-runtime') return `${prefix}https://esm.sh/react@19.0.0/jsx-runtime${suffix}`;
        if (importTarget === 'react/jsx-dev-runtime') return `${prefix}https://esm.sh/react@19.0.0/jsx-dev-runtime${suffix}`;
        if (importTarget === 'lucide-react') return `${prefix}https://esm.sh/lucide-react@0.475.0?deps=react@19.0.0${suffix}`;
        if (importTarget === 'motion') return `${prefix}https://esm.sh/motion@12.4.7?deps=react@19.0.0${suffix}`;
        if (importTarget === 'motion/react') return `${prefix}https://esm.sh/motion@12.4.7/react?deps=react@19.0.0${suffix}`;

        // Generic NPM package fallback via esm.sh
        return `${prefix}https://esm.sh/${importTarget}?deps=react@19.0.0,react-dom@19.0.0${suffix}`;
      }

      return match;
    }
  );
}

/**
 * Builds an interactive sandboxed HTML string and Blob URL from extracted files map.
 */
export async function buildAppletSandbox(files: Map<string, ExtractedFile>): Promise<SandboxBundleResult> {
  const diagnostics: BuildDiagnostic[] = [];
  const detection = detectEntryPoint(files);

  if (detection.type === 'empty' || files.size === 0) {
    const emptyHtml = generateFallbackEmptyHtml('No source files found in ZIP archive.');
    const blob = new Blob([emptyHtml], { type: 'text/html;charset=utf-8' });
    return {
      htmlUrl: URL.createObjectURL(blob),
      htmlContent: emptyHtml,
      diagnostics: [{ file: 'project', message: 'No valid source code or index.html found.', type: 'warning' }],
      entryPoint: 'none',
      projectType: 'empty',
      totalTranspiled: 0,
    };
  }

  // 1. Create Asset Maps (Images, SVGs, Data Files)
  const assetUrlMap = new Map<string, string>();
  for (const [path, file] of files.entries()) {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    if (file.isBinary || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'mp3', 'wav', 'ogg', 'mp4'].includes(ext)) {
      let mimeType = 'image/png';
      if (ext === 'svg') mimeType = 'image/svg+xml';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'ico') mimeType = 'image/x-icon';
      else if (ext === 'mp3') mimeType = 'audio/mpeg';

      if (file.isBinary) {
        assetUrlMap.set(path, `data:${mimeType};base64,${file.content}`);
      } else {
        assetUrlMap.set(path, `data:${mimeType};utf8,${encodeURIComponent(file.content)}`);
      }
    }
  }

  // 2. Extract All Project CSS Stylesheets
  const collectedCssBlocks: string[] = [];
  for (const [path, file] of files.entries()) {
    if (path.endsWith('.css') && !file.isBinary) {
      let cssText = file.content;
      // Resolve asset urls in CSS e.g. url('./icon.png')
      cssText = cssText.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
        const resolved = resolveRelativePath(path, url, files);
        if (resolved && assetUrlMap.has(resolved)) {
          return `url("${assetUrlMap.get(resolved)}")`;
        }
        return match;
      });
      collectedCssBlocks.push(`/* File: ${path} */\n${cssText}`);
    }
  }

  // 3. First Pass Transpilation for all JS/TS/TSX/JSX files
  const transpiledFiles = new Map<string, string>();
  let totalTranspiled = 0;

  for (const [path, file] of files.entries()) {
    if (file.isBinary) continue;
    const ext = path.split('.').pop()?.toLowerCase() || '';
    if (['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext)) {
      const { jsCode, error } = transpileCode(file.content, path);
      if (error) {
        diagnostics.push({
          file: path,
          message: `Transpilation Error: ${error}`,
          type: 'error',
        });
      } else {
        transpiledFiles.set(path, jsCode);
        totalTranspiled++;
      }
    }
  }

  // 4. Second Pass: Resolve internal relative imports into Blob URLs
  const blobUrlMap = new Map<string, string>();

  // Helper to get or create blob url with import rewriting
  function getModuleBlobUrl(filePath: string): string {
    if (blobUrlMap.has(filePath)) {
      return blobUrlMap.get(filePath)!;
    }

    const code = transpiledFiles.get(filePath) || files.get(filePath)?.content || '';
    const rewrittenCode = rewriteImports(code, filePath, files, blobUrlMap, assetUrlMap);

    const blob = new Blob([rewrittenCode], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    blobUrlMap.set(filePath, url);
    return url;
  }

  // Build blob URLs for all transpiled modules
  for (const filePath of transpiledFiles.keys()) {
    getModuleBlobUrl(filePath);
  }

  // 5. Construct Final Sandboxed HTML Document
  let finalHtml = '';
  const entryPoint = detection.entryScript || detection.entryHtml || 'index.html';

  const consoleInterceptScript = `
    <script>
      (function() {
        function sendLog(type, message, details) {
          try {
            window.parent.postMessage({
              source: 'SOURCELINK_APPLET_SANDBOX',
              type: type,
              payload: {
                timestamp: new Date().toLocaleTimeString(),
                message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
                details: details || null
              }
            }, '*');
          } catch(e) {}
        }

        var origLog = console.log;
        var origWarn = console.warn;
        var origError = console.error;
        var origInfo = console.info;

        console.log = function() {
          origLog.apply(console, arguments);
          sendLog('log', Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        console.warn = function() {
          origWarn.apply(console, arguments);
          sendLog('warn', Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        console.error = function() {
          origError.apply(console, arguments);
          sendLog('error', Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        console.info = function() {
          origInfo.apply(console, arguments);
          sendLog('info', Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };

        window.onerror = function(msg, url, line, col, err) {
          var fileLabel = url ? url.split('/').pop() : 'script';
          sendLog('error', 'Uncaught Runtime Error: ' + msg + ' (' + fileLabel + ':' + line + ':' + col + ')', err ? err.stack : null);
          return false;
        };

        window.addEventListener('unhandledrejection', function(event) {
          var reason = event.reason;
          sendLog('error', 'Unhandled Promise Rejection: ' + (reason ? (reason.message || String(reason)) : 'Unknown reason'), reason ? reason.stack : null);
        });
      })();
    </script>
  `;

  // HTML / Head Injections
  const headInjections = `
    <!-- SourceLink Live Sandbox Injections -->
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      if (window.tailwind) {
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              colors: {
                brand: {
                  50: '#eff6ff',
                  500: '#3b82f6',
                  600: '#2563eb',
                  700: '#1d4ed8'
                }
              }
            }
          }
        }
      }
    </script>
    ${consoleInterceptScript}
    <style>
      /* Reset & Default Base Layout */
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background-color: #ffffff;
        color: #0f172a;
      }
      ${collectedCssBlocks.join('\n\n')}
    </style>
  `;

  // If there's an existing index.html in the project
  if (detection.entryHtml && files.has(detection.entryHtml)) {
    let rawHtml = files.get(detection.entryHtml)!.content;

    // Inject Head Injections right before </head> or <body>
    if (rawHtml.includes('</head>')) {
      rawHtml = rawHtml.replace('</head>', `${headInjections}\n</head>`);
    } else if (rawHtml.includes('<head>')) {
      rawHtml = rawHtml.replace('<head>', `<head>\n${headInjections}`);
    } else {
      rawHtml = `<head>${headInjections}</head>\n${rawHtml}`;
    }

    // Rewrite <img src="..."> references to data urls
    rawHtml = rawHtml.replace(/<img\s+([^>]*?)src=['"]([^'"]+)['"]([^>]*?)>/gi, (match, pre, src, post) => {
      const resolved = resolveRelativePath(detection.entryHtml!, src, files);
      if (resolved && assetUrlMap.has(resolved)) {
        return `<img ${pre}src="${assetUrlMap.get(resolved)}"${post}>`;
      }
      return match;
    });

    // Handle Vite/React script tags in index.html (e.g. <script type="module" src="/src/main.tsx"></script>)
    rawHtml = rawHtml.replace(
      /<script\s+([^>]*?)type=['"]module['"]([^>]*?)src=['"]([^'"]+)['"]([^>]*?)><\/script>/gi,
      (match, p1, p2, srcPath, p3) => {
        const resolved = resolveRelativePath(detection.entryHtml!, srcPath, files);
        if (resolved && blobUrlMap.has(resolved)) {
          return `<script type="module" src="${blobUrlMap.get(resolved)}"></script>`;
        }
        return match;
      }
    );

    // If it's a React SPA and no root container was rendered yet, ensure #root or #app exists
    if (detection.entryScript && !rawHtml.includes('id="root"') && !rawHtml.includes('id="app"')) {
      rawHtml = rawHtml.replace('</body>', '<div id="root"></div>\n</body>');
    }

    // If index.html didn't include a script tag for the entry script, append it
    if (detection.entryScript && blobUrlMap.has(detection.entryScript)) {
      const entryUrl = blobUrlMap.get(detection.entryScript)!;
      if (!rawHtml.includes(entryUrl)) {
        rawHtml = rawHtml.replace('</body>', `<script type="module" src="${entryUrl}"></script>\n</body>`);
      }
    }

    finalHtml = rawHtml;
  } else {
    // Generate clean React SPA Boilerplate HTML
    const entryUrl = detection.entryScript && blobUrlMap.has(detection.entryScript) ? blobUrlMap.get(detection.entryScript)! : '';

    finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  ${headInjections}
</head>
<body>
  <div id="root"></div>
  ${
    entryUrl
      ? `<script type="module" src="${entryUrl}"></script>`
      : `<div class="p-8 text-center text-slate-500">No runnable entry script detected.</div>`
  }
</body>
</html>`;
  }

  const finalBlob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
  const finalHtmlUrl = URL.createObjectURL(finalBlob);

  return {
    htmlUrl: finalHtmlUrl,
    htmlContent: finalHtml,
    diagnostics,
    entryPoint,
    projectType: detection.type,
    totalTranspiled,
  };
}

/**
 * Creates fallback HTML when empty
 */
function generateFallbackEmptyHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Applet Preview</title>
</head>
<body class="bg-slate-900 text-slate-300 min-h-screen flex items-center justify-center p-6 text-center">
  <div class="max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl p-8 shadow-xl">
    <div class="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <h3 class="text-lg font-bold text-white mb-2">Live Applet Preview</h3>
    <p class="text-xs text-slate-400 mb-4">${message}</p>
    <div class="p-3 bg-slate-900/60 rounded-xl text-left font-mono text-[11px] text-slate-400">
      💡 Tip: Upload any .ZIP containing React, TSX, JSX, or HTML/JS files to preview it live here!
    </div>
  </div>
</body>
</html>`;
}
