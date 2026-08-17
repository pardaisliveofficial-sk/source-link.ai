import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  RotateCw, 
  RefreshCw, 
  ExternalLink, 
  Code, 
  Terminal, 
  Download, 
  UploadCloud, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileCode, 
  FolderTree, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  FileText,
  Zap,
  ArrowRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { ExtractedFile, MainViewTab, AIAssistantModifiedFile } from '../types';
import { buildAppletSandbox, SandboxBundleResult, SandboxLogEntry, BuildDiagnostic } from '../lib/appletSandboxEngine';
import { extractZipArchive, formatBytes } from '../lib/zipExtractor';
import { AIStudioAssistant } from './AIStudioAssistant';
import JSZip from 'jszip';

interface AppletPreviewViewProps {
  extractedFiles: Map<string, ExtractedFile>;
  onUpdateFileContent?: (path: string, newContent: string) => void;
  onFilesExtracted?: (files: Map<string, ExtractedFile>, zipName: string, meta: any) => void;
  onNavigateTab: (tab: MainViewTab) => void;
}

type DeviceMode = 'mobile' | 'mobile-landscape' | 'tablet' | 'desktop';
type LayoutMode = 'preview-only' | 'split-editor' | 'split-console';
type MobileAiViewMode = 'split' | 'preview' | 'assistant';

export const AppletPreviewView: React.FC<AppletPreviewViewProps> = ({
  extractedFiles,
  onUpdateFileContent,
  onFilesExtracted,
  onNavigateTab
}) => {
  // Sandbox State
  const [activeFiles, setActiveFiles] = useState<Map<string, ExtractedFile>>(extractedFiles);
  const [bundleResult, setBundleResult] = useState<SandboxBundleResult | null>(null);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [logs, setLogs] = useState<SandboxLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'log'>('all');
  const [logSearch, setLogSearch] = useState<string>('');

  // UI Viewport Controls
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('mobile');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('preview-only');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [autoRebuild, setAutoRebuild] = useState<boolean>(true);
  const [showDeviceFrame, setShowDeviceFrame] = useState<boolean>(true);
  
  // Two Main Modes: Pure Preview (false) vs AI Assistant Workspace (true)
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [mobileAiView, setMobileAiView] = useState<MobileAiViewMode>('split');
  const [mobileEditorTab, setMobileEditorTab] = useState<'editor' | 'preview'>('preview');

  // Editor State
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [searchFileTerm, setSearchFileTerm] = useState<string>('');

  // File Upload State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const buildTimeoutRef = useRef<any>(null);

  // Synchronize when incoming extractedFiles changes
  useEffect(() => {
    if (extractedFiles.size > 0 && activeFiles.size === 0) {
      setActiveFiles(new Map(extractedFiles));
    }
  }, [extractedFiles]);

  // Set initial selected file
  useEffect(() => {
    if (activeFiles.size > 0 && !selectedFilePath) {
      // Find main entry or first editable code file
      const candidates = ['src/App.tsx', 'src/App.jsx', 'src/main.tsx', 'index.html', 'src/index.css'];
      let found: string | null = null;
      for (const cand of candidates) {
        if (activeFiles.has(cand)) {
          found = cand;
          break;
        }
      }
      if (!found) {
        for (const [path, file] of activeFiles.entries()) {
          if (!file.isBinary) {
            found = path;
            break;
          }
        }
      }
      if (found) {
        setSelectedFilePath(found);
        setEditorContent(activeFiles.get(found)?.content || '');
      }
    }
  }, [activeFiles, selectedFilePath]);

  // Handle selected file switch
  const handleSelectFile = (path: string) => {
    const file = activeFiles.get(path);
    if (!file) return;
    setSelectedFilePath(path);
    setEditorContent(file.content);
    setIsDirty(false);
  };

  // Build Sandbox Bundle
  const triggerRebuild = async (filesToBuild = activeFiles) => {
    if (filesToBuild.size === 0) return;
    setIsBuilding(true);
    try {
      const result = await buildAppletSandbox(filesToBuild);
      setBundleResult(result);
    } catch (err: any) {
      console.error('Build Applet error:', err);
      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'error',
          message: `Build Error: ${err.message || String(err)}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsBuilding(false);
    }
  };

  // Initial build trigger
  useEffect(() => {
    if (activeFiles.size > 0) {
      triggerRebuild(activeFiles);
    }
  }, [activeFiles.size]);

  // Handle postMessage logs from the iframe sandbox
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'SOURCELINK_APPLET_SANDBOX') {
        const { type, payload } = event.data;
        const newLog: SandboxLogEntry = {
          id: Math.random().toString(36).substring(7),
          type: type || 'log',
          message: payload?.message || '',
          details: payload?.details || null,
          timestamp: payload?.timestamp || new Date().toLocaleTimeString()
        };
        setLogs(prev => [...prev.slice(-300), newLog]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle Code Changes in Editor
  const handleEditorChange = (newCode: string) => {
    setEditorContent(newCode);
    setIsDirty(true);

    if (selectedFilePath) {
      const updatedMap = new Map<string, ExtractedFile>(activeFiles);
      const existing = updatedMap.get(selectedFilePath);
      if (existing) {
        updatedMap.set(selectedFilePath, {
          path: selectedFilePath,
          content: newCode,
          isBinary: Boolean(existing.isBinary),
          size: newCode.length
        });
      }
      setActiveFiles(updatedMap);

      // Call parent updater if provided
      if (onUpdateFileContent) {
        onUpdateFileContent(selectedFilePath, newCode);
      }

      // Auto-rebuild with debounce
      if (autoRebuild) {
        if (buildTimeoutRef.current) clearTimeout(buildTimeoutRef.current);
        buildTimeoutRef.current = setTimeout(() => {
          triggerRebuild(updatedMap);
          setIsDirty(false);
        }, 700);
      }
    }
  };

  // Manual save / run
  const handleManualRun = () => {
    if (selectedFilePath) {
      const updatedMap = new Map<string, ExtractedFile>(activeFiles);
      const existing = updatedMap.get(selectedFilePath);
      if (existing) {
        updatedMap.set(selectedFilePath, {
          path: selectedFilePath,
          content: editorContent,
          isBinary: Boolean(existing.isBinary),
          size: editorContent.length
        });
      }
      setActiveFiles(updatedMap);
      triggerRebuild(updatedMap);
      setIsDirty(false);
    }
  };

  // Handle Applying AI Assistant Generated Fixes
  const handleApplyAIChanges = (modifiedFiles: AIAssistantModifiedFile[]) => {
    const updatedMap = new Map<string, ExtractedFile>(activeFiles);
    for (const f of modifiedFiles) {
      const existing = updatedMap.get(f.path);
      updatedMap.set(f.path, {
        path: f.path,
        content: f.newContent,
        isBinary: Boolean(existing?.isBinary),
        size: f.newContent.length
      });
      if (onUpdateFileContent) {
        onUpdateFileContent(f.path, f.newContent);
      }
      if (selectedFilePath === f.path) {
        setEditorContent(f.newContent);
        setIsDirty(false);
      }
    }
    setActiveFiles(updatedMap);
    triggerRebuild(updatedMap);

    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'log',
        message: `[AI Studio] Successfully applied ${modifiedFiles.length} file fix(es) & re-rendered live preview.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Handle ZIP File Upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Please upload a valid .zip file');
      return;
    }
    setUploadLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = await extractZipArchive(buffer, file.size);
      setActiveFiles(result.files);
      setLogs([]);

      if (onFilesExtracted) {
        onFilesExtracted(result.files, file.name, result);
      }

      // Trigger immediate build
      triggerRebuild(result.files);
    } catch (err: any) {
      alert(`ZIP Extraction failed: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  // Download Tested ZIP
  const handleDownloadZip = async () => {
    if (activeFiles.size === 0) return;
    const zip = new JSZip();
    for (const [path, file] of activeFiles.entries()) {
      if (file.isBinary) {
        zip.file(path, file.content, { base64: true });
      } else {
        zip.file(path, file.content);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tested-applet-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load Demo / Sample React Project
  const handleLoadDemo = () => {
    const demoFiles = new Map<string, ExtractedFile>();
    
    demoFiles.set('index.html', {
      path: 'index.html',
      isBinary: false,
      size: 300,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sample Applet Preview</title>
</head>
<body class="bg-slate-900 text-white min-h-screen">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
    });

    demoFiles.set('src/main.tsx', {
      path: 'src/main.tsx',
      isBinary: false,
      size: 250,
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
    });

    demoFiles.set('src/App.tsx', {
      path: 'src/App.tsx',
      isBinary: false,
      size: 1500,
      content: `import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Heart, RefreshCw, Zap } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState(0);
  const [likes, setLikes] = useState(12);
  const [liked, setLiked] = useState(false);
  const [status, setStatus] = useState('All Systems Operational');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white">Live Applet</h1>
              <p className="text-xs text-blue-400 font-medium">Interactive Sandbox</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" /> Live
          </span>
        </div>

        {/* Status Card */}
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Status Banner</div>
          <div className="text-sm font-semibold text-slate-200">{status}</div>
        </div>

        {/* Interactive Counters */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => {
              setCount(c => c + 1);
              console.log('User clicked counter! New count:', count + 1);
            }}
            className="p-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-bold text-center transition cursor-pointer shadow-md shadow-blue-600/20"
          >
            <div className="text-xs font-normal text-blue-100 mb-1">Clicks</div>
            <div className="text-2xl font-extrabold">{count}</div>
          </button>

          <button 
            onClick={() => {
              setLikes(l => liked ? l - 1 : l + 1);
              setLiked(!liked);
              console.log('Like toggled:', !liked);
            }}
            className={\`p-4 rounded-xl font-bold text-center transition cursor-pointer active:scale-95 border \${
              liked 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
                : 'bg-slate-900/80 border-slate-700/50 hover:bg-slate-700/40 text-slate-300'
            }\`}
          >
            <div className="text-xs font-normal text-slate-400 mb-1 flex items-center justify-center gap-1">
              <Heart className={\`w-3.5 h-3.5 \${liked ? 'fill-rose-400' : ''}\`} /> Likes
            </div>
            <div className="text-2xl font-extrabold">{likes}</div>
          </button>
        </div>

        {/* Test Inputs */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium">Test Dynamic Input:</label>
          <input 
            type="text"
            placeholder="Type anything to test reactivity..."
            onChange={(e) => setStatus(e.target.value || 'All Systems Operational')}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-500">
          💡 Try editing this code in the editor on the left to see live instant updates!
        </div>

      </div>
    </div>
  );
}`
    });

    setActiveFiles(demoFiles);
    setSelectedFilePath('src/App.tsx');
    setEditorContent(demoFiles.get('src/App.tsx')!.content);
    triggerRebuild(demoFiles);
  };

  // Filtered files list for sidebar tree
  const filteredFilesList = useMemo(() => {
    const list: string[] = [];
    for (const p of activeFiles.keys()) {
      if (!searchFileTerm || p.toLowerCase().includes(searchFileTerm.toLowerCase())) {
        list.push(p);
      }
    }
    return list.sort();
  }, [activeFiles, searchFileTerm]);

  // Filtered console logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (logFilter !== 'all' && l.type !== logFilter) return false;
      if (logSearch && !l.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
      return true;
    });
  }, [logs, logFilter, logSearch]);

  // Viewport Dimensions calculation
  const getDeviceDimensions = () => {
    switch (deviceMode) {
      case 'mobile':
        return { width: '375px', height: '780px', label: 'Android / iPhone (375 × 780)' };
      case 'mobile-landscape':
        return { width: '780px', height: '375px', label: 'Mobile Landscape (780 × 375)' };
      case 'tablet':
        return { width: '768px', height: '980px', label: 'Tablet (768 × 980)' };
      case 'desktop':
      default:
        return { width: '100%', height: '100%', label: 'Desktop Responsive (100%)' };
    }
  };

  const dimensions = getDeviceDimensions();

  // If no files are loaded anywhere, show the clean ZIP loader stage
  if (activeFiles.size === 0) {
    return (
      <div className="flex-1 bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-lg shadow-blue-600/20">
            <Zap className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Live ZIP Applet Sandbox & Tester
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Test any React, TypeScript, Vite, or HTML project instantly inside an interactive in-browser emulator — <strong className="text-white">no GitHub push or APK compilation needed!</strong>
            </p>
          </div>

          {/* Drag and Drop Zone */}
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`block border-2 border-dashed rounded-2xl p-8 transition cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
            }`}
          >
            <input 
              type="file" 
              accept=".zip"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden" 
            />

            {uploadLoading ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="text-xs font-semibold text-slate-300">Extracting and compiling sandbox modules...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <UploadCloud className="w-10 h-10 text-blue-400" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">Click to upload or drag & drop .ZIP</div>
                  <div className="text-xs text-slate-400">Supports AI Studio exports, Vite, React, & Web projects</div>
                </div>
              </div>
            )}
          </label>

          {/* Alternative buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLoadDemo}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Interactive Demo Template</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('workspace')}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Go to Studio Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden">
      
      {/* 1. TOP CONTROLS & NAVIGATION BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-20">
        
        {/* Left: Project Info & Mode Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-xs ${
              isAssistantOpen ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {isAssistantOpen ? <Sparkles className="w-4 h-4 text-amber-300" /> : <Zap className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">
                  {isAssistantOpen ? 'AI Studio Workspace' : 'Applet Live Tester'}
                </span>
                <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded-md border ${
                  isAssistantOpen
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {bundleResult?.projectType || 'React Sandbox'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                {activeFiles.size} files loaded • Entry: <span className="font-mono text-slate-300">{bundleResult?.entryPoint || 'auto'}</span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* If NOT in AI Assistant mode, show standard Preview / Editor / Console view modes */}
          {!isAssistantOpen && (
            <div className="hidden md:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setLayoutMode('preview-only')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'preview-only' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pure Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('split-editor')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'split-editor' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Editor + App</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('split-console')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'split-console' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>App + Logs</span>
              </button>
            </div>
          )}

          {/* If IN AI Assistant mode on mobile/tablet, show mobile AI view switcher */}
          {isAssistantOpen && (
            <div className="flex lg:hidden items-center bg-slate-950 p-0.5 rounded-lg border border-indigo-500/30">
              <button
                type="button"
                onClick={() => setMobileAiView('split')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition cursor-pointer ${
                  mobileAiView === 'split' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Split screen with AI on top & App below"
              >
                ↕️ Split
              </button>
              <button
                type="button"
                onClick={() => setMobileAiView('preview')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition cursor-pointer ${
                  mobileAiView === 'preview' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="View full applet preview"
              >
                📱 Preview
              </button>
              <button
                type="button"
                onClick={() => setMobileAiView('assistant')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition cursor-pointer ${
                  mobileAiView === 'assistant' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="View full AI assistant chat"
              >
                💬 AI Chat
              </button>
            </div>
          )}
        </div>

        {/* Center: Device Frame & Viewport Emulation Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            title="Mobile Portrait (375 × 780)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              deviceMode === 'mobile' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile-landscape')}
            title="Mobile Landscape (780 × 375)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              deviceMode === 'mobile-landscape' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            title="Tablet (768 × 980)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              deviceMode === 'tablet' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            title="Desktop Responsive"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              deviceMode === 'desktop' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5 sm:mx-1" />

          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoomScale(z => Math.max(50, z - 10))}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 w-7 sm:w-8 text-center">{zoomScale}%</span>
          <button
            type="button"
            onClick={() => setZoomScale(z => Math.min(150, z + 10))}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Right: Mode Switcher & Export Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* PRIMARY MODE TOGGLE BUTTON */}
          {!isAssistantOpen ? (
            <button
              type="button"
              onClick={() => setIsAssistantOpen(true)}
              className="px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-600/30 ring-1 ring-white/20 cursor-pointer flex items-center gap-1.5"
              title="Open AI Studio Assistant (Urdu, Hindi, English)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Continue with AI</span>
              <span className="hidden md:inline text-[9px] px-1 py-0.2 rounded bg-black/30 text-amber-200 font-normal">
                اردو / Hin / Eng
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAssistantOpen(false)}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title="Return to pure preview and testing sandbox"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Pure Preview Mode</span>
              <span className="sm:hidden">Exit AI</span>
            </button>
          )}

          {/* Rebuild / Refresh Sandbox */}
          <button
            type="button"
            onClick={() => triggerRebuild()}
            disabled={isBuilding}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            title="Recompile sandbox modules"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBuilding ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>

          {/* Download Tested ZIP */}
          <button
            type="button"
            onClick={handleDownloadZip}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            title="Download current modified project as ZIP"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Export ZIP</span>
          </button>

          {/* Switch to Workspace Push */}
          <button
            type="button"
            onClick={() => onNavigateTab('workspace')}
            className="px-2.5 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Go to GitHub Diff & Push stage"
          >
            <span className="hidden sm:inline">Push to GitHub</span>
            <span className="sm:hidden">Push</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN STAGE CONTENT AREA */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* ======================================================== */}
        {/* CASE A: PURE TESTING / PREVIEW MODE (!isAssistantOpen) */}
        {/* ======================================================== */}
        {!isAssistantOpen && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full h-full">
            
            {/* Split Code Editor Panel */}
            {layoutMode === 'split-editor' && (
              <div className="w-full md:w-[420px] lg:w-[460px] border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
                {/* Editor Toolbar */}
                <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">
                      {selectedFilePath || 'Select a file'}
                    </span>
                    {isDirty && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Modified" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRebuild}
                        onChange={(e) => setAutoRebuild(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-blue-600 w-3 h-3"
                      />
                      <span>Live Reload</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleManualRun}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Run</span>
                    </button>
                  </div>
                </div>

                {/* Quick File Selector Dropdown / Search */}
                <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter files..."
                      value={searchFileTerm}
                      onChange={(e) => setSearchFileTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <select
                    value={selectedFilePath || ''}
                    onChange={(e) => handleSelectFile(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 max-w-[150px] truncate"
                  >
                    {filteredFilesList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Code Textarea Editor */}
                <div className="flex-1 relative bg-slate-950 p-2 overflow-hidden flex flex-col">
                  <textarea
                    value={editorContent}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    spellCheck={false}
                    placeholder="Select a code file to view and edit..."
                    className="w-full flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-3 leading-relaxed border-0 focus:outline-none resize-none selection:bg-blue-600 selection:text-white"
                  />
                  <div className="pt-2 px-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Lines: {editorContent.split('\n').length} • Chars: {editorContent.length}</span>
                    <span>Ctrl + S to Run</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pure Preview Canvas Area */}
            <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden min-w-0">
              
              {/* Iframe Viewport Container */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                
                {/* Device Container Frame (Fully responsive, never squished!) */}
                <div
                  style={{
                    transform: `scale(${zoomScale / 100})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s'
                  }}
                  className={`relative bg-black transition-all flex flex-col ${
                    deviceMode === 'desktop'
                      ? 'w-full h-full max-w-full max-h-full rounded-xl border border-slate-800 shadow-2xl overflow-hidden'
                      : deviceMode === 'tablet'
                      ? 'w-[768px] max-w-full h-[980px] max-h-full rounded-[36px] border-[10px] border-slate-800 shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-slate-700/50'
                      : deviceMode === 'mobile-landscape'
                      ? 'w-[780px] max-w-full h-[375px] max-h-full rounded-[32px] border-[8px] border-slate-800 shadow-2xl shadow-black/80 overflow-hidden'
                      : 'w-full max-w-[390px] h-[780px] max-h-full rounded-[36px] border-[8px] sm:border-[10px] border-slate-800 shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-slate-700/50'
                  }`}
                >
                  {/* Phone Notch & Status Bar (in mobile mode) */}
                  {deviceMode !== 'desktop' && (
                    <div className="bg-slate-950 px-5 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0 select-none z-10 border-b border-slate-800/50">
                      <span className="font-mono text-slate-300">9:41</span>
                      <div className="w-20 h-4 bg-black rounded-full border border-slate-800" />
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span>5G</span>
                        <div className="w-4 h-2 rounded-xs border border-slate-400 p-0.2 flex items-center">
                          <div className="w-full h-full bg-slate-300 rounded-2xs" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desktop Header */}
                  {deviceMode === 'desktop' && (
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 select-none shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                        </div>
                      </div>
                      <div className="bg-slate-950 px-4 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-slate-300 w-72 text-center truncate">
                        http://localhost:3000/applet-preview
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Sandboxed
                      </div>
                    </div>
                  )}

                  {/* The Live Interactive Sandbox Iframe */}
                  {bundleResult?.htmlUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={bundleResult.htmlUrl}
                      title="Applet Sandbox Preview"
                      sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                      className="w-full h-full border-0 bg-white flex-1"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                      <span className="text-xs">Compiling project and initializing sandbox...</span>
                    </div>
                  )}

                  {/* Phone Bottom Home Indicator */}
                  {deviceMode !== 'desktop' && (
                    <div className="bg-slate-950 py-2 flex items-center justify-center shrink-0 border-t border-slate-800/50">
                      <div className="w-28 h-1 bg-slate-600 rounded-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Console Panel (when in split-console) */}
              {layoutMode === 'split-console' && (
                <div className="h-56 bg-slate-900 border-t border-slate-800 flex flex-col shrink-0">
                  <div className="bg-slate-950 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      <span className="text-xs font-bold text-slate-300 mr-2">Sandbox Console</span>
                      <button
                        type="button"
                        onClick={() => setLogFilter('all')}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer ${
                          logFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All ({logs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogFilter('error')}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer flex items-center gap-1 ${
                          logFilter === 'error' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-rose-400/80 hover:text-rose-300'
                        }`}
                      >
                        Errors ({logs.filter(l => l.type === 'error').length})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Filter logs..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 focus:outline-none w-32 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setLogs([])}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        title="Clear console logs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5 select-text bg-slate-950">
                    {filteredLogs.length === 0 ? (
                      <div className="text-slate-500 text-center py-6 text-xs">
                        Console is clear. Actions, errors, and console.log events will appear here in real-time.
                      </div>
                    ) : (
                      filteredLogs.map(log => (
                        <div 
                          key={log.id} 
                          className={`p-1.5 rounded flex items-start gap-2 ${
                            log.type === 'error'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : log.type === 'warn'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <span className="text-[9px] text-slate-500 shrink-0 pt-0.5">{log.timestamp}</span>
                          <div className="flex-1 break-all whitespace-pre-wrap">{log.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* CASE B: AI STUDIO ASSISTANT MODE (isAssistantOpen)       */}
        {/* ======================================================== */}
        {isAssistantOpen && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full h-full">
            
            {/* Desktop Left / Mobile Section: Live Preview Viewport */}
            <div className={`flex-1 bg-slate-950 flex flex-col relative overflow-hidden min-w-0 ${
              mobileAiView === 'assistant' ? 'hidden lg:flex' : 'flex'
            } ${
              mobileAiView === 'split' ? 'h-[52vh] lg:h-full shrink-0' : 'h-full'
            }`}>
              
              {/* Responsive Iframe Sandbox */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                <div
                  style={{
                    transform: `scale(${zoomScale / 100})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s'
                  }}
                  className={`relative bg-black transition-all flex flex-col ${
                    deviceMode === 'desktop'
                      ? 'w-full h-full max-w-full max-h-full rounded-xl border border-slate-800 shadow-2xl overflow-hidden'
                      : deviceMode === 'tablet'
                      ? 'w-[768px] max-w-full h-[980px] max-h-full rounded-[36px] border-[10px] border-slate-800 shadow-2xl shadow-black/80 overflow-hidden'
                      : deviceMode === 'mobile-landscape'
                      ? 'w-[780px] max-w-full h-[375px] max-h-full rounded-[32px] border-[8px] border-slate-800 shadow-2xl shadow-black/80 overflow-hidden'
                      : 'w-full max-w-[390px] h-[780px] max-h-full rounded-[32px] sm:rounded-[36px] border-[6px] sm:border-[10px] border-slate-800 shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-slate-700/50'
                  }`}
                >
                  {/* Phone Notch & Status Bar */}
                  {deviceMode !== 'desktop' && (
                    <div className="bg-slate-950 px-5 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0 select-none z-10 border-b border-slate-800/50">
                      <span className="font-mono text-slate-300">9:41</span>
                      <div className="w-16 h-3.5 bg-black rounded-full border border-slate-800" />
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span>5G</span>
                        <div className="w-4 h-2 rounded-xs border border-slate-400 p-0.2 flex items-center">
                          <div className="w-full h-full bg-slate-300 rounded-2xs" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desktop Header */}
                  {deviceMode === 'desktop' && (
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 select-none shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      </div>
                      <div className="bg-slate-950 px-3 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-slate-300 truncate">
                        http://localhost:3000/applet-preview
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Sandboxed
                      </div>
                    </div>
                  )}

                  {/* The Live Interactive Sandbox Iframe */}
                  {bundleResult?.htmlUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={bundleResult.htmlUrl}
                      title="Applet Sandbox Preview"
                      sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                      className="w-full h-full border-0 bg-white flex-1"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                      <span className="text-xs">Compiling project and initializing sandbox...</span>
                    </div>
                  )}

                  {/* Phone Bottom Home Indicator */}
                  {deviceMode !== 'desktop' && (
                    <div className="bg-slate-950 py-1.5 flex items-center justify-center shrink-0 border-t border-slate-800/50">
                      <div className="w-24 h-1 bg-slate-600 rounded-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Quick Action when in mobile full preview mode */}
              {mobileAiView === 'preview' && (
                <button
                  type="button"
                  onClick={() => setMobileAiView('assistant')}
                  className="lg:hidden absolute bottom-4 right-4 px-3.5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-xl shadow-indigo-600/40 flex items-center gap-1.5 border border-white/20 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open AI Chat</span>
                </button>
              )}
            </div>

            {/* AI STUDIO ASSISTANT PANEL */}
            <div className={`lg:w-[440px] xl:w-[480px] h-full flex flex-col shrink-0 border-l border-slate-800 bg-slate-900 ${
              mobileAiView === 'preview' ? 'hidden lg:flex' : 'flex'
            } ${
              mobileAiView === 'split' ? 'h-[48vh] lg:h-full border-t lg:border-t-0 border-slate-800' : 'h-full w-full'
            }`}>
              <AIStudioAssistant
                activeFiles={activeFiles}
                selectedFilePath={selectedFilePath}
                recentLogs={logs}
                onApplyChanges={handleApplyAIChanges}
                onSaveAndPushToGitHub={() => onNavigateTab('workspace')}
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                className="w-full h-full max-w-none shadow-none border-l-0"
              />
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
