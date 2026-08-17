import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Wrench,
  CheckCircle2,
  AlertCircle,
  FileCode,
  RotateCcw,
  Smartphone,
  Zap,
  Layers,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Terminal,
  Play,
  X,
  Mic,
  MicOff,
  Image as ImageIcon,
  Paperclip,
  Upload,
  Search,
  FileText,
  Trash2,
  ExternalLink,
  Plus
} from 'lucide-react';
import {
  AIAssistantMessage,
  AIAssistantModifiedFile,
  AIAssistantAttachedImage,
  AIAssistantReferencedFile,
  ExtractedFile,
  SandboxLogEntry
} from '../types';
import { requestAIStudioAssist, AI_PRESET_PROMPTS } from '../lib/aiStudioService';
import { cleanAndReviseVoiceInput } from '../lib/speechCleaner';

interface AIStudioAssistantProps {
  activeFiles: Map<string, ExtractedFile>;
  selectedFilePath: string | null;
  recentLogs: SandboxLogEntry[];
  onApplyChanges: (modifiedFiles: AIAssistantModifiedFile[]) => void;
  onSaveAndPushToGitHub?: () => void;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export const AIStudioAssistant: React.FC<AIStudioAssistantProps> = ({
  activeFiles,
  selectedFilePath,
  recentLogs,
  onApplyChanges,
  onSaveAndPushToGitHub,
  isOpen,
  onClose,
  className
}) => {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Assalam-o-Alaikum! Hello! I am your AI Studio Assistant. Aap mic (🎙️) se bol kar ya type karke koi bhi code problem solve karwa sakte hain, photo/screenshot attach kar sakte hain, ya specific files reference kar sakte hain.',
      timestamp: new Date().toLocaleTimeString(),
      suggestedQuestions: [
        'Console / runtime errors solve karo',
        'Android APK build workflow add karo',
        'Mobile screen ke liye UI responsive banao'
      ]
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'urdu' | 'hindi' | 'english'>('auto');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastAppliedFiles, setLastAppliedFiles] = useState<AIAssistantModifiedFile[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedMessageIds, setAppliedMessageIds] = useState<Set<string>>(new Set());

  // Attachments State
  const [attachedImages, setAttachedImages] = useState<AIAssistantAttachedImage[]>([]);
  const [referencedFiles, setReferencedFiles] = useState<AIAssistantReferencedFile[]>([]);
  const [showFilePicker, setShowFilePicker] = useState<boolean>(false);
  const [fileSearchQuery, setFileSearchQuery] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Speech Recognition (Mic) State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const basePromptBeforeSpeechRef = useRef<string>('');

  // Input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const externalDocInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Error count from logs
  const errorCount = recentLogs.filter(l => l.type === 'error').length;

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      if (selectedLanguage === 'urdu') {
        recognition.lang = 'ur-PK';
      } else if (selectedLanguage === 'hindi') {
        recognition.lang = 'hi-IN';
      } else if (selectedLanguage === 'english') {
        recognition.lang = 'en-US';
      } else {
        recognition.lang = 'ur-PK';
      }

      recognition.onresult = (event: any) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            sessionFinal += ' ' + transcript;
          } else {
            sessionInterim += ' ' + transcript;
          }
        }

        const fullRawSession = `${sessionFinal} ${sessionInterim}`.trim();
        const revisedSpeech = cleanAndReviseVoiceInput(fullRawSession);

        const base = basePromptBeforeSpeechRef.current;
        if (base) {
          setInputPrompt(`${base} ${revisedSpeech}`.trim());
        } else {
          setInputPrompt(revisedSpeech);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Speech Recognition Error]:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow microphone in browser settings.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Mic error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInputPrompt((prev) => cleanAndReviseVoiceInput(prev));
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [selectedLanguage]);

  // Toggle Voice Input
  const toggleSpeechRecognition = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome/Edge or type directly.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
      setInputPrompt((prev) => cleanAndReviseVoiceInput(prev));
    } else {
      try {
        basePromptBeforeSpeechRef.current = inputPrompt.trim();
        if (selectedLanguage === 'urdu') {
          recognitionRef.current.lang = 'ur-PK';
        } else if (selectedLanguage === 'hindi') {
          recognitionRef.current.lang = 'hi-IN';
        } else if (selectedLanguage === 'english') {
          recognitionRef.current.lang = 'en-US';
        } else {
          recognitionRef.current.lang = 'ur-PK';
        }
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err: any) {
        console.warn('Speech start error:', err);
        setSpeechError('Unable to start mic. Please check browser microphone permissions.');
        setIsRecording(false);
      }
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const newImg: AIAssistantAttachedImage = {
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            dataUrl,
            size: file.size,
            type: file.type
          };
          setAttachedImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Clipboard Paste (e.g. Screenshot Win+Shift+S / Cmd+Shift+4)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              const newImg: AIAssistantAttachedImage = {
                id: 'img_paste_' + Date.now(),
                name: `screenshot-${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`,
                dataUrl,
                size: file.size,
                type: file.type
              };
              setAttachedImages((prev) => [...prev, newImg]);
            }
          };
          reader.readAsDataURL(file);
          e.preventDefault();
        }
      }
    }
  };

  // Remove Attached Image
  const removeAttachedImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // External Reference Document Upload
  const handleExternalDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newRef: AIAssistantReferencedFile = {
          path: file.name,
          name: file.name,
          size: file.size,
          content: content || ''
        };
        setReferencedFiles((prev) => {
          if (prev.some((r) => r.path === newRef.path)) return prev;
          return [...prev, newRef];
        });
      };
      reader.readAsText(file);
    });

    if (externalDocInputRef.current) {
      externalDocInputRef.current.value = '';
    }
  };

  // Toggle Project File Reference
  const toggleProjectFileRef = (path: string) => {
    const file = activeFiles.get(path);
    const isAlreadyReferenced = referencedFiles.some((rf) => rf.path === path);

    if (isAlreadyReferenced) {
      setReferencedFiles((prev) => prev.filter((rf) => rf.path !== path));
    } else {
      const newRef: AIAssistantReferencedFile = {
        path,
        name: path.split('/').pop() || path,
        size: file?.size || 0,
        content: file?.content || ''
      };
      setReferencedFiles((prev) => [...prev, newRef]);
    }
  };

  // Remove Referenced File
  const removeReferencedFile = (path: string) => {
    setReferencedFiles((prev) => prev.filter((rf) => rf.path !== path));
  };

  // Send Message
  const handleSendMessage = async (promptText?: string) => {
    const rawQuery = (promptText || inputPrompt).trim();
    const query = cleanAndReviseVoiceInput(rawQuery);
    if ((!query && attachedImages.length === 0 && referencedFiles.length === 0) || isLoading) return;

    const queryToSend = query || (attachedImages.length > 0 ? 'Analyze the attached screenshot / image and resolve the issue.' : 'Review referenced files.');

    const currentImages = [...attachedImages];
    const currentRefs = [...referencedFiles];

    const userMessage: AIAssistantMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: queryToSend,
      timestamp: new Date().toLocaleTimeString(),
      attachedImages: currentImages.length > 0 ? currentImages : undefined,
      referencedFiles: currentRefs.length > 0 ? currentRefs : undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setAttachedImages([]);
    setReferencedFiles([]);
    setIsLoading(true);

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
    }

    const thinkingMsgId = 'ai_' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: thinkingMsgId,
        role: 'assistant',
        content: 'Analyzing project codebase, inspecting files & attachments, and generating solution...',
        timestamp: new Date().toLocaleTimeString(),
        status: 'thinking'
      }
    ]);

    try {
      const response = await requestAIStudioAssist({
        prompt: queryToSend,
        language: selectedLanguage,
        currentFile: selectedFilePath || undefined,
        files: activeFiles,
        recentLogs,
        attachedImages: currentImages,
        referencedFiles: currentRefs
      });

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === thinkingMsgId) {
            return {
              id: thinkingMsgId,
              role: 'assistant',
              content: response.explanation,
              timestamp: new Date().toLocaleTimeString(),
              modifiedFiles: response.modifiedFiles,
              apkReadyNotes: response.apkReadyNotes,
              suggestedQuestions: response.suggestedQuestions,
              status: 'success'
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === thinkingMsgId) {
            return {
              id: thinkingMsgId,
              role: 'assistant',
              content: `Error: ${err.message || 'AI request failed. Please check network and retry.'}`,
              timestamp: new Date().toLocaleTimeString(),
              status: 'error'
            };
          }
          return m;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (messageId: string, modifiedFiles: AIAssistantModifiedFile[]) => {
    onApplyChanges(modifiedFiles);
    setLastAppliedFiles(modifiedFiles);
    setAppliedMessageIds((prev) => new Set(prev).add(messageId));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter project files for the Reference Picker
  const projectFileList = Array.from(activeFiles.keys())
    .filter((p: string) => !activeFiles.get(p)?.isBinary)
    .filter((p: string) => p.toLowerCase().includes(fileSearchQuery.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div
      className={`flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 w-full shadow-2xl flex-shrink-0 z-30 ${
        className || 'max-w-lg md:max-w-md'
      }`}
    >
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
        aria-label="Upload photo or screenshot"
      />
      <input
        ref={externalDocInputRef}
        type="file"
        accept=".txt,.json,.js,.ts,.tsx,.jsx,.css,.html,.md,.yml,.yaml,.log"
        multiple
        onChange={handleExternalDocUpload}
        className="hidden"
        aria-label="Upload reference file"
      />

      {/* Image Full Preview Lightbox */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-2">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Attached screenshot preview"
              className="max-h-[80vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Assistant Header */}
      <div className="px-3.5 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white tracking-tight truncate">AI Studio Assistant</span>
              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 3.7
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">Mic (Voice) • Photo • Files • Urdu/Hindi</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language selector badge */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-1 rounded-lg border border-slate-700/60 text-[10px]">
            <Globe className="w-2.5 h-2.5 text-slate-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              aria-label="Select Assistant Response Language"
              className="bg-transparent text-slate-200 outline-none text-[10px] cursor-pointer font-medium"
            >
              <option value="auto" className="bg-slate-800">Auto (اردو / Rom / Eng)</option>
              <option value="urdu" className="bg-slate-800">Urdu (اردو / Roman)</option>
              <option value="hindi" className="bg-slate-800">Hindi (हिंदी)</option>
              <option value="english" className="bg-slate-800">English</option>
            </select>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
              title="Close AI Assistant"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Context Bar */}
      <div className="px-3.5 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <span className="flex items-center gap-1 truncate text-slate-300">
            <FileCode className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate">{selectedFilePath || 'src/App.tsx'}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{activeFiles.size} files</span>
        </div>

        {errorCount > 0 ? (
          <span className="flex items-center gap-1 text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[11px]">
            <AlertCircle className="w-3 h-3" />
            {errorCount} Error{errorCount > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            Live Preview Healthy
          </span>
        )}
      </div>

      {/* Mic Recording Status Banner */}
      {isRecording && (
        <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-800/60 flex items-center justify-between text-xs text-rose-200 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-semibold text-[11px]">🎙️ Listening... Aap Urdu, Roman Urdu, ya English me bolein</span>
          </div>
          <button
            onClick={toggleSpeechRecognition}
            className="px-2 py-0.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-bold"
          >
            Done (Stop)
          </button>
        </div>
      )}

      {/* Speech Error Banner */}
      {speechError && (
        <div className="px-3 py-1.5 bg-amber-950/70 border-b border-amber-800/50 flex items-center justify-between text-[11px] text-amber-200">
          <span>⚠️ {speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-amber-400 hover:text-amber-200">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isApplied = appliedMessageIds.has(msg.id);

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[92%] rounded-2xl p-3.5 text-xs shadow-md ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none'
                }`}
              >
                {/* User Attached Images display */}
                {isUser && msg.attachedImages && msg.attachedImages.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-2">
                    {msg.attachedImages.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setPreviewImageUrl(img.dataUrl)}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/30 hover:border-white transition"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-20 h-20 object-cover rounded-md group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* User Attached Referenced Files display */}
                {isUser && msg.referencedFiles && msg.referencedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {msg.referencedFiles.map((rf, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-700/90 text-blue-100 text-[10px] font-mono border border-blue-400/40"
                      >
                        <FileCode className="w-3 h-3 text-blue-200" />
                        <span>{rf.path}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Thinking animation */}
                {msg.status === 'thinking' && (
                  <div className="flex items-center gap-2 text-indigo-300 font-medium py-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Analyzing code, attachments, and solving issues...</span>
                  </div>
                )}

                {/* Main Content */}
                {msg.status !== 'thinking' && (
                  <div className="whitespace-pre-wrap leading-relaxed font-sans text-[13px]">
                    {msg.content}
                  </div>
                )}

                {/* Modified Files Section */}
                {msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        <span>Fixed Files ({msg.modifiedFiles.length}):</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {msg.modifiedFiles.map((f, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/50 flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FileCode className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="font-mono text-slate-200 truncate">{f.path}</span>
                          </div>
                          {f.diffSummary && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px] ml-2">
                              {f.diffSummary}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action Bar for applying changes */}
                    <div className="pt-2 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleApply(msg.id, msg.modifiedFiles!)}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                          isApplied
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Applied & Testing in Live Preview</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Apply Fixes & Test in Live Preview</span>
                          </>
                        )}
                      </button>

                      {onSaveAndPushToGitHub && isApplied && (
                        <button
                          onClick={onSaveAndPushToGitHub}
                          className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md border border-emerald-500/30"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>Save Changes & Push to GitHub (Get APK)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* APK Ready Notes */}
                {msg.apkReadyNotes && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-[11px] text-indigo-200">
                    <div className="font-bold flex items-center gap-1 text-indigo-300 mb-1">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Android APK & GitHub Sync:</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-indigo-200/90 text-[11px]">
                      {msg.apkReadyNotes}
                    </p>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>

              {/* Suggested Questions */}
              {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.suggestedQuestions.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSendMessage(q)}
                      className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700/70 text-[11px] transition-all cursor-pointer text-left"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preset Action Chips */}
      <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {AI_PRESET_PROMPTS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSendMessage(preset.prompt)}
            disabled={isLoading}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>
              {selectedLanguage === 'urdu'
                ? preset.labelUrdu
                : selectedLanguage === 'hindi'
                ? preset.labelHindi
                : preset.labelEn}
            </span>
          </button>
        ))}
      </div>

      {/* File Reference Selector Popover */}
      {showFilePicker && (
        <div className="p-3 bg-slate-950 border-t border-indigo-500/30 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reference Project Files for AI Context</span>
            </span>
            <button
              onClick={() => setShowFilePicker(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={fileSearchQuery}
                onChange={(e) => setFileSearchQuery(e.target.value)}
                placeholder="Search file name (e.g. App.tsx, auth, etc)..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => externalDocInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 shrink-0"
              title="Upload external document (.txt, .json, .log)"
            >
              <Upload className="w-3 h-3 text-indigo-400" />
              <span>Upload Local</span>
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {projectFileList.map((path: string) => {
              const isSelected = referencedFiles.some((rf) => rf.path === path);
              return (
                <div
                  key={path}
                  onClick={() => toggleProjectFileRef(path)}
                  className={`p-2 rounded-lg text-xs font-mono cursor-pointer flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-indigo-950/80 border border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{path}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </div>
              );
            })}

            {projectFileList.length === 0 && (
              <p className="text-center py-3 text-xs text-slate-500">No matching files found.</p>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        {/* Attached Thumbnails Strip */}
        {(attachedImages.length > 0 || referencedFiles.length > 0) && (
          <div className="mb-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap gap-2 items-center">
            {/* Attached Images */}
            {attachedImages.map((img) => (
              <div
                key={img.id}
                className="relative group flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-indigo-950/60 border border-indigo-700/50 rounded-lg text-[11px] text-indigo-200"
              >
                <img src={img.dataUrl} alt={img.name} className="w-5 h-5 object-cover rounded" />
                <span className="truncate max-w-[100px] font-mono text-[10px]">{img.name}</span>
                <button
                  onClick={() => removeAttachedImage(img.id)}
                  className="p-0.5 rounded-full hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 ml-0.5"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Referenced Files */}
            {referencedFiles.map((rf) => (
              <div
                key={rf.path}
                className="flex items-center gap-1.5 px-2 py-1 bg-blue-950/60 border border-blue-700/50 rounded-lg text-[11px] text-blue-200"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate max-w-[120px] font-mono text-[10px]">{rf.name || rf.path}</span>
                <button
                  onClick={() => removeReferencedFile(rf.path)}
                  className="p-0.5 rounded-full hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 ml-0.5"
                  title="Remove file reference"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex flex-col gap-2"
        >
          <div className="relative flex flex-col bg-slate-950 border border-slate-700 rounded-xl focus-within:border-indigo-500 transition-all overflow-hidden">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Urdu, Roman Urdu, Hindi ya English me bolein ya likhein... (e.g. 'is page main crash error solve kro')"
              className="w-full px-3 py-2.5 bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none resize-none leading-relaxed"
            />

            {/* Input Toolbar */}
            <div className="px-2.5 py-1.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {/* Voice / Mic Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 text-white ring-2 ring-rose-400/50 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700/60'
                  }`}
                  title={isRecording ? 'Stop Voice Recording' : 'Voice Input / Mic (Bolein)'}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-semibold">{isRecording ? 'Listening...' : 'Mic'}</span>
                </button>

                {/* Photo / Screenshot Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 border border-slate-700/60 text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Attach Photo or Screenshot"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-semibold">Photo</span>
                </button>

                {/* File Reference Button */}
                <button
                  type="button"
                  onClick={() => setShowFilePicker(!showFilePicker)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    showFilePicker || referencedFiles.length > 0
                      ? 'bg-indigo-950/80 border-indigo-600 text-indigo-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-300 border-slate-700/60'
                  }`}
                  title="Reference Project Code File"
                >
                  <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-semibold">
                    Files {referencedFiles.length > 0 ? `(${referencedFiles.length})` : ''}
                  </span>
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputPrompt.trim() && attachedImages.length === 0 && referencedFiles.length === 0) || isLoading}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow flex items-center gap-1 font-bold text-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Thinking</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>Press Enter to send • Shift+Enter for newline</span>
            <span>Paste Screenshot (Ctrl+V / Cmd+V) • Voice & File Aware</span>
          </div>
        </form>
      </div>
    </div>
  );
};
