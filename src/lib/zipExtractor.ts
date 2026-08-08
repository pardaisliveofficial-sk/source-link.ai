import JSZip from 'jszip';
import { ExtractedFile } from '../types';

export interface ZipExtractionResult {
  files: Map<string, ExtractedFile>;
  fileCount: number;
  totalSize: number;
  ignoredCount: number;
  ignoredSummary: string[];
}

/**
 * Format bytes into human readable string e.g. 1.25 MB
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Common text extensions to determine if file content is readable text
 */
const TEXT_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'sass', 'less',
  'md', 'txt', 'svg', 'xml', 'yaml', 'yml', 'env', 'example', 'gitignore',
  'prisma', 'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1', 'toml', 'ini', 'conf',
  'dockerfile', 'makefile', 'graphql', 'gql', 'sql', 'py', 'java', 'c', 'cpp',
  'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'kts', 'vue', 'astro'
]);

/**
 * Default ignore rules for build artifacts and OS system junk
 */
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/',
  '.git/',
  'dist/',
  'build/',
  '.next/',
  'out/',
  'coverage/',
  '.DS_Store',
  'Thumbs.db',
  '.cache/',
  'tmp/',
  '__MACOSX/',
  '*.log',
  '*.zip',
  '.env.local'
];

/**
 * Checks if path matches standard or custom gitignore patterns
 */
function isIgnoredPath(path: string, customGitignorePatterns: string[] = []): { ignored: boolean; reason?: string } {
  const normalized = path.replace(/\\/g, '/');
  
  if (normalized.endsWith('/')) {
    return { ignored: true, reason: 'directory entry' };
  }

  // Check default rules
  if (normalized.includes('__MACOSX/') || normalized.includes('.DS_Store')) {
    return { ignored: true, reason: '.DS_Store / macOS metadata' };
  }
  if (normalized.startsWith('.git/') || normalized.includes('/.git/')) {
    return { ignored: true, reason: '.git repository folder' };
  }
  if (normalized.startsWith('node_modules/') || normalized.includes('/node_modules/')) {
    return { ignored: true, reason: 'node_modules directory' };
  }
  if (normalized.startsWith('dist/') || normalized.includes('/dist/')) {
    return { ignored: true, reason: 'dist build folder' };
  }
  if (normalized.startsWith('build/') || normalized.includes('/build/')) {
    return { ignored: true, reason: 'build output folder' };
  }
  if (normalized.startsWith('.next/') || normalized.includes('/.next/')) {
    return { ignored: true, reason: '.next build folder' };
  }
  if (normalized.startsWith('coverage/') || normalized.includes('/coverage/')) {
    return { ignored: true, reason: 'coverage reports' };
  }

  // Check custom gitignore rules
  for (const pattern of customGitignorePatterns) {
    const cleanPattern = pattern.trim();
    if (!cleanPattern || cleanPattern.startsWith('#')) continue;

    if (cleanPattern.endsWith('/')) {
      const dirName = cleanPattern.slice(0, -1);
      if (normalized.startsWith(dirName + '/') || normalized.includes('/' + dirName + '/')) {
        return { ignored: true, reason: `.gitignore rule (${cleanPattern})` };
      }
    } else if (cleanPattern.startsWith('*.')) {
      const ext = cleanPattern.slice(1);
      if (normalized.endsWith(ext)) {
        return { ignored: true, reason: `.gitignore rule (${cleanPattern})` };
      }
    } else if (normalized.includes(cleanPattern)) {
      return { ignored: true, reason: `.gitignore rule (${cleanPattern})` };
    }
  }

  return { ignored: false };
}

/**
 * Checks if a path is text or binary
 */
function isTextFile(filename: string): boolean {
  const parts = filename.split('.');
  if (parts.length === 1) {
    const base = filename.toLowerCase();
    if (['readme', 'license', 'dockerfile', 'makefile', 'procfile', '.gitignore', '.env', '.env.example'].includes(base)) {
      return true;
    }
    return true; // default to text for no extension
  }
  const ext = parts.pop()?.toLowerCase() || '';
  return TEXT_EXTENSIONS.has(ext);
}

/**
 * Extracts ZIP file buffer/file into an array of ExtractedFiles.
 * Automatically parses .gitignore, strips common root folder wrapper, and filters ignored entries.
 */
export async function extractZipArchive(
  fileBuffer: ArrayBuffer,
  fileSize: number = 0
): Promise<ZipExtractionResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(fileBuffer);

  const rawMap = new Map<string, ExtractedFile>();
  const allEntries = Object.keys(loadedZip.files);

  // 1. First pass: look for .gitignore content to extract custom rules
  const gitignorePatterns: string[] = [];
  for (const entryPath of allEntries) {
    if (entryPath.endsWith('.gitignore')) {
      try {
        const text = await loadedZip.files[entryPath].async('string');
        const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        gitignorePatterns.push(...lines);
      } catch {}
    }
  }

  // 2. Filter valid file entries and track ignored reasons
  const validRelativePaths: string[] = [];
  const ignoredReasonMap = new Map<string, number>();
  let totalIgnoredCount = 0;

  for (const relativePath of allEntries) {
    const zipEntry = loadedZip.files[relativePath];
    if (zipEntry.dir) continue;

    const check = isIgnoredPath(relativePath, gitignorePatterns);
    if (check.ignored) {
      totalIgnoredCount++;
      const reason = check.reason || 'ignored folder/file';
      ignoredReasonMap.set(reason, (ignoredReasonMap.get(reason) || 0) + 1);
      continue;
    }

    validRelativePaths.push(relativePath);
  }

  // Detect common prefix wrapper (e.g. repo-main/src/App.tsx -> src/App.tsx)
  let commonPrefix = '';
  if (validRelativePaths.length > 0) {
    const firstParts = validRelativePaths[0].split('/');
    if (firstParts.length > 1) {
      const candidatePrefix = firstParts[0] + '/';
      if (validRelativePaths.every(p => p.startsWith(candidatePrefix))) {
        commonPrefix = candidatePrefix;
      }
    }
  }

  let calculatedTotalSize = 0;

  // 3. Process each valid file entry
  for (const relativePath of validRelativePaths) {
    const zipEntry = loadedZip.files[relativePath];
    const cleanPath = commonPrefix ? relativePath.substring(commonPrefix.length) : relativePath;

    if (!cleanPath) continue;

    const isText = isTextFile(cleanPath);
    let content = '';

    if (isText) {
      content = await zipEntry.async('string');
    } else {
      content = await zipEntry.async('base64');
    }

    const uncompressedSize = (zipEntry as any)._data ? ((zipEntry as any)._data.uncompressedSize || content.length) : content.length;
    calculatedTotalSize += uncompressedSize;

    rawMap.set(cleanPath, {
      path: cleanPath,
      content,
      isBinary: !isText,
      size: uncompressedSize
    });
  }

  const ignoredSummary: string[] = [];
  for (const [reason, count] of ignoredReasonMap.entries()) {
    ignoredSummary.push(`${reason} (${count} file${count > 1 ? 's' : ''})`);
  }

  return {
    files: rawMap,
    fileCount: rawMap.size,
    totalSize: fileSize || calculatedTotalSize,
    ignoredCount: totalIgnoredCount,
    ignoredSummary
  };
}

