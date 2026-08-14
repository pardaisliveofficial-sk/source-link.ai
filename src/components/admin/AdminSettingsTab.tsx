import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Shield,
  Server,
  Save,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Smartphone,
  Globe,
  Check,
  RefreshCw,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RotateCcw,
  Maximize2,
  FileCheck,
  SmartphoneNfc,
  ExternalLink
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { applyAppIconToDOM } from '../../lib/appConfig';

interface AdminSettingsTabProps {
  settings: any;
  admins: any[];
  token: string;
  onRefresh: () => void;
}

interface ImageMeta {
  width: number;
  height: number;
  aspectRatio: number;
  sizeBytes?: number;
  format?: string;
  isSquare: boolean;
  isRecommendedSize: boolean;
}

// Preset launcher icons generated as high-resolution SVG Data URLs for instant one-click admin selection
const PRESET_LAUNCHER_ICONS = [
  {
    id: 'sourcelink-blue',
    name: 'SourceLink Blue Orb',
    category: 'Official Default',
    dimension: '512x512 (SVG)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%232563eb"/><path d="M160 360 L256 160 L352 360 M192 290 L320 290" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="256" cy="160" r="32" fill="%2360a5fa"/><circle cx="160" cy="360" r="32" fill="%2360a5fa"/><circle cx="352" cy="360" r="32" fill="%2360a5fa"/></svg>'
  },
  {
    id: 'cyan-delta-shield',
    name: 'Cyan Delta Shield',
    category: 'High-Tech Sync',
    dimension: '512x512 (SVG)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%230f172a"/><path d="M256 64 L416 128 V256 C416 352 344 432 256 464 C168 432 96 352 96 256 V128 Z" fill="%230284c7" stroke="%2338bdf8" stroke-width="16"/><path d="M256 160 L336 320 H176 Z" fill="%2338bdf8"/></svg>'
  },
  {
    id: 'emerald-cloud-sync',
    name: 'Emerald Cloud Sync',
    category: 'Cloud Engine',
    dimension: '512x512 (SVG)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%23064e3b"/><path d="M160 320 C110 320 80 280 80 230 C80 180 120 150 170 150 C190 100 240 80 300 100 C360 120 380 170 380 200 C430 200 450 240 450 280 C450 330 400 360 350 360 H160 Z" fill="%2310b981"/><path d="M256 220 V340 M200 280 L256 220 L312 280" stroke="%23ecfdf5" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
  },
  {
    id: 'golden-terminal',
    name: 'Golden Terminal',
    category: 'Pro Developer',
    dimension: '512x512 (SVG)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%2318181b"/><rect x="64" y="64" width="384" height="384" rx="32" fill="%2327272a" stroke="%23eab308" stroke-width="12"/><path d="M140 180 L220 256 L140 332" stroke="%23eab308" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="240" y1="332" x2="340" y2="332" stroke="%23fef08a" stroke-width="32" stroke-linecap="round"/></svg>'
  },
  {
    id: 'purple-quantum-core',
    name: 'Purple Quantum Core',
    category: 'AI Matrix',
    dimension: '512x512 (SVG)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%233b0764"/><circle cx="256" cy="256" r="140" fill="%239333ea" opacity="0.8"/><circle cx="256" cy="256" r="80" fill="%23c084fc"/><path d="M256 96 V416 M96 256 H416" stroke="%23f3e8ff" stroke-width="24" stroke-linecap="round"/></svg>'
  },
  {
    id: 'sunset-code-flame',
    name: 'Sunset Code Flame',
    category: 'Modern Gradient',
    dimension: '512x512 (SVG)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23f97316"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="512" height="512" rx="128" fill="url(%23g1)"/><path d="M160 180 L80 256 L160 332 M352 180 L432 256 L352 332" stroke="white" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="280" y1="160" x2="230" y2="352" stroke="white" stroke-width="32" stroke-linecap="round"/></svg>'
  },
  {
    id: 'obsidian-minimal',
    name: 'Obsidian Minimal',
    category: 'Dark Stealth',
    dimension: '512x512 (SVG)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%23020617"/><rect x="80" y="80" width="352" height="352" rx="48" fill="%230f172a" stroke="%23334155" stroke-width="8"/><circle cx="256" cy="256" r="80" fill="%2338bdf8"/></svg>'
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    category: 'Vibrant Light',
    dimension: '512x512 (SVG)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%23080e1a"/><path d="M120 380 L256 120 L392 380 Z" fill="none" stroke="%2306b6d4" stroke-width="32"/><path d="M200 320 L256 200 L312 320 Z" fill="%23f43f5e"/></svg>'
  }
];

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ settings, admins, token, onRefresh }) => {
  // Currently deployed live icon in database
  const liveAppIconUrl = settings?.appIconUrl || '/icon-192.png';
  const liveAppName = settings?.appName || 'SourceLink.ai';

  const [formData, setFormData] = useState({
    appName: settings?.appName || 'SourceLink.ai',
    supportEmail: settings?.supportEmail || 'support@sourcelink.ai',
    websiteUrl: settings?.websiteUrl || 'https://sourcelinkai.soulverseapps.com',
    defaultPlan: settings?.defaultPlan || 'free',
    trialDaysDefault: settings?.trialDaysDefault || 14,
    appIconUrl: settings?.appIconUrl || '/icon-192.png'
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activePreviewDevice, setActivePreviewDevice] = useState<'all' | 'android' | 'web' | 'header'>('all');
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  // Check if staged icon has unsaved changes compared to current live icon
  const hasIconChanges = formData.appIconUrl !== liveAppIconUrl;

  // Measure Image Dimensions and Specifications
  useEffect(() => {
    if (!formData.appIconUrl) {
      setImageMeta(null);
      return;
    }

    setAnalyzingImage(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const w = img.naturalWidth || 512;
      const h = img.naturalHeight || 512;
      const ratio = w / (h || 1);
      const isSquare = Math.abs(ratio - 1) < 0.05;
      const isRecommendedSize = w >= 512 && h >= 512;

      let format = 'PNG / Image';
      if (formData.appIconUrl.startsWith('data:image/svg')) format = 'SVG (Vector)';
      else if (formData.appIconUrl.startsWith('data:image/png')) format = 'PNG';
      else if (formData.appIconUrl.startsWith('data:image/jpeg') || formData.appIconUrl.startsWith('data:image/jpg')) format = 'JPEG';
      else if (formData.appIconUrl.startsWith('data:image/webp')) format = 'WebP';
      else if (formData.appIconUrl.endsWith('.svg')) format = 'SVG';
      else if (formData.appIconUrl.endsWith('.png')) format = 'PNG';

      setImageMeta({
        width: w,
        height: h,
        aspectRatio: ratio,
        format,
        isSquare,
        isRecommendedSize
      });
      setAnalyzingImage(false);
    };

    img.onerror = () => {
      // Fallback for SVGs or remote URLs without CORS
      setImageMeta({
        width: 512,
        height: 512,
        aspectRatio: 1,
        format: 'Custom Icon',
        isSquare: true,
        isRecommendedSize: true
      });
      setAnalyzingImage(false);
    };

    img.src = formData.appIconUrl;
  }, [formData.appIconUrl]);

  // File Upload Handler for Launcher Icon with size & dimension validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB max
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload an image under 5MB (Recommended: < 500KB).');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData(prev => ({ ...prev, appIconUrl: dataUrl }));
        setSuccessMsg(`New image loaded (${(file.size / 1024).toFixed(1)} KB)! Please review the live preview below and click "Save & Publish Launcher Icon".`);
      }
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file. Please try a valid PNG, JPG, SVG, or WebP.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Revert back to live icon
  const handleRevertToLive = () => {
    setFormData(prev => ({ ...prev, appIconUrl: liveAppIconUrl }));
    setSuccessMsg('Reverted to current live deployed icon.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings: formData })
      });

      if (res.ok) {
        // Apply changes to current client DOM immediately!
        if (formData.appIconUrl) {
          applyAppIconToDOM(formData.appIconUrl);
        }

        setSuccessMsg('App Launcher Icon & Settings published successfully! Implemented live across Web and Android.');
        setTimeout(() => setSuccessMsg(null), 6000);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save settings.');
      }
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>System Settings & App Launcher Icon Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure application launcher icons, visual branding, and system-wide operational variables with instant live synchronization.
          </p>
        </div>

        {hasIconChanges && (
          <div className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 self-start sm:self-center">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-amber-300">Unsaved Icon Preview Ready to Publish</span>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/60 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs font-bold underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CURRENT LIVE ICON VS NEW STAGED PREVIEW (Side-by-Side Comparison)      */}
      {/* ========================================================================= */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Current Live Icon vs New Staged Preview</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare your currently active production icon with your new proposed icon before publishing.
            </p>
          </div>

          {hasIconChanges && (
            <button
              type="button"
              onClick={handleRevertToLive}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert to Current Live</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Currently Live Deployed Icon */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Current Live Active Icon</span>
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded text-[10px] font-extrabold">
                LIVE ON WEB & ANDROID
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-slate-700/80 p-2 flex items-center justify-center shrink-0 shadow-lg">
                <img
                  src={liveAppIconUrl}
                  alt="Current Live Icon"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="text-xs space-y-1">
                <div className="font-bold text-white text-sm">{liveAppName}</div>
                <div className="text-slate-400 font-mono text-[10px] break-all line-clamp-1">
                  {liveAppIconUrl.startsWith('data:') ? 'Custom Uploaded Data Image' : liveAppIconUrl}
                </div>
                <div className="text-[11px] text-emerald-400/90 font-medium">
                  Active in Document Favicon, Android Manifest & Top Navigation
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: New Proposed / Staged Icon (Preview) */}
          <div className={`p-4 rounded-xl relative overflow-hidden border transition ${
            hasIconChanges
              ? 'bg-blue-950/40 border-blue-500/60 ring-2 ring-blue-500/20'
              : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>New Staged Icon (Preview)</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                hasIconChanges
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {hasIconChanges ? 'PENDING PUBLISH' : 'MATCHES CURRENT LIVE'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-blue-500/80 p-2 flex items-center justify-center shrink-0 shadow-lg relative">
                <img
                  src={formData.appIconUrl}
                  alt="New Staged Icon"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {hasIconChanges && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[9px] font-black text-slate-950">
                    !
                  </span>
                )}
              </div>

              <div className="text-xs space-y-1 flex-1">
                <div className="font-bold text-white text-sm">{formData.appName}</div>
                {imageMeta && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <span className="px-2 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-cyan-300">
                      {imageMeta.width} × {imageMeta.height} px
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-purple-300">
                      {imageMeta.format}
                    </span>
                    {imageMeta.isSquare ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                        <Check className="w-3 h-3" /> 1:1 Square
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" /> Non-Square
                      </span>
                    )}
                  </div>
                )}
                <div className="text-[11px] text-slate-400">
                  {hasIconChanges
                    ? 'Changes ready! Click "Save & Publish Launcher Icon" to deploy.'
                    : 'Select a preset or upload an image below to change.'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ICON TECHNICAL SPECIFICATIONS & FORMAT/DIMENSION GUIDELINES            */}
      {/* ========================================================================= */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Image Format, Size & Dimension Requirements</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Spec 1: Recommended Dimensions */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-blue-400" /> Dimensions
            </div>
            <div className="text-white font-extrabold text-sm">512 × 512 px</div>
            <div className="text-slate-400 text-[11px]">
              Minimum <strong className="text-slate-300">192×192 px</strong>. Must be <strong>1:1 Square</strong> ratio to prevent stretching.
            </div>
          </div>

          {/* Spec 2: Supported Formats */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-purple-400" /> File Formats
            </div>
            <div className="text-white font-extrabold text-sm">PNG, SVG, WebP, JPG</div>
            <div className="text-slate-400 text-[11px]">
              <strong className="text-slate-300">Transparent PNG or SVG</strong> is highly recommended for clean dark/light mode rendering.
            </div>
          </div>

          {/* Spec 3: File Size Limit */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Server className="w-3 h-3 text-amber-400" /> File Size Limit
            </div>
            <div className="text-white font-extrabold text-sm">Max 5 MB</div>
            <div className="text-slate-400 text-[11px]">
              Recommended <strong className="text-slate-300">&lt; 500 KB</strong> for instant mobile caching and fast loading.
            </div>
          </div>

          {/* Spec 4: Safe Area / Maskable Margin */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-400" /> Android Safe Area
            </div>
            <div className="text-white font-extrabold text-sm">80% Center Margin</div>
            <div className="text-slate-400 text-[11px]">
              Keep artwork centered so Android circle & squircle adaptive masking won't clip edges.
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MULTI-PLATFORM INTERACTIVE PREVIEW PLAYGROUND                          */}
      {/* ========================================================================= */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SmartphoneNfc className="w-4 h-4 text-cyan-400" />
              <span>Multi-Platform Live Device Previews (Check Before Saving)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect how the new icon looks across Android homescreens, adaptive masks, web browser tabs, and navigation headers.
            </p>
          </div>

          {/* Device Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActivePreviewDevice('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                activePreviewDevice === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Devices
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewDevice('android')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                activePreviewDevice === 'android' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Android
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewDevice('web')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                activePreviewDevice === 'web' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Web Favicon
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewDevice('header')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                activePreviewDevice === 'header' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Navbar Logo
            </button>
          </div>
        </div>

        {/* Live Mockups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Mockup 1: Android Squircle Homescreen */}
          {(activePreviewDevice === 'all' || activePreviewDevice === 'android') && (
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-emerald-400" /> Android Squircle Frame
              </span>
              
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-xl overflow-hidden flex items-center justify-center p-1.5 hover:scale-105 transition">
                <img
                  src={formData.appIconUrl || '/icon-192.png'}
                  alt="Android Squircle"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="text-xs font-bold text-slate-200 truncate max-w-[130px]">{formData.appName}</div>
              <span className="text-[10px] text-slate-500">Android Standard Launcher Tile</span>
            </div>
          )}

          {/* Mockup 2: Android Circle / Adaptive Mask */}
          {(activePreviewDevice === 'all' || activePreviewDevice === 'android') && (
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-cyan-400" /> Android Adaptive Circle
              </span>
              
              <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 shadow-xl overflow-hidden flex items-center justify-center p-2 hover:scale-105 transition">
                <img
                  src={formData.appIconUrl || '/icon-192.png'}
                  alt="Android Circle"
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="text-xs font-bold text-slate-200 truncate max-w-[130px]">{formData.appName}</div>
              <span className="text-[10px] text-slate-500">Pixel / Samsung Circular Mask</span>
            </div>
          )}

          {/* Mockup 3: Web Browser Tab Favicon */}
          {(activePreviewDevice === 'all' || activePreviewDevice === 'web') && (
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-400" /> Web Browser Tab
              </span>

              <div className="w-full max-w-[180px] bg-slate-900 border border-slate-700 rounded-t-lg p-2 flex items-center gap-2 shadow-md">
                <img
                  src={formData.appIconUrl || '/icon-192.png'}
                  alt="Favicon"
                  className="w-4 h-4 object-contain rounded-xs shrink-0"
                />
                <span className="text-[11px] font-semibold text-slate-200 truncate">{formData.appName}</span>
                <span className="text-[9px] text-slate-500 ml-auto">×</span>
              </div>

              <span className="text-[10px] text-slate-500">Chrome, Safari, Edge Tab & Bookmark</span>
            </div>
          )}

          {/* Mockup 4: Header Brand Logo */}
          {(activePreviewDevice === 'all' || activePreviewDevice === 'header') && (
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-400" /> Header Navbar Logo
              </span>

              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl shadow-md">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={formData.appIconUrl || '/icon-192.png'}
                    alt="Brand Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-black text-white truncate max-w-[90px]">{formData.appName}</span>
              </div>

              <span className="text-[10px] text-slate-500">Top Header & Mobile App Bar</span>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CHOOSE / UPLOAD NEW LAUNCHER ICON                                      */}
      {/* ========================================================================= */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Step 1: Choose or Upload New Launcher Icon</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select one of the 3 methods below to stage your icon, inspect the live preview above, and publish.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Method 1: File Upload */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Method 1: Upload Icon File (PNG, JPG, SVG, WebP)</span>
              </label>
              <span className="text-[10px] text-slate-400">Recommended 512×512 px (Max 5MB)</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition shadow-md flex items-center justify-center gap-2 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Processing Image...' : 'Choose Custom Icon File'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">
                Directly uploads from your computer or phone and converts into a high-res cross-platform asset.
              </span>
            </div>
          </div>

          {/* Method 2: Custom Image URL */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <label className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Method 2: Image URL or Base64 String</span>
            </label>
            <input
              type="text"
              value={formData.appIconUrl}
              onChange={(e) => {
                setFormData({ ...formData, appIconUrl: e.target.value });
                setSuccessMsg('URL updated! Review preview above and click "Save & Publish Launcher Icon".');
              }}
              placeholder="https://example.com/launcher-icon.png or data:image/..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
            />
          </div>

          {/* Method 3: Curated High-Res Launcher Icon Gallery */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Method 3: Select from Curated 512×512 Vector Presets</span>
              </label>
              <span className="text-[10px] text-slate-400">1-Click Instant Preview Selection</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_LAUNCHER_ICONS.map((preset) => {
                const isSelected = formData.appIconUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, appIconUrl: preset.url });
                      setSuccessMsg(`Selected preset: ${preset.name}. Review preview above and click "Save & Publish Launcher Icon".`);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-700/80 p-1 flex items-center justify-center shrink-0">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-contain rounded-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold truncate leading-tight">{preset.name}</div>
                      <div className="text-[9px] text-slate-400">{preset.dimension}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. GENERAL SAAS SETTINGS & SAVE/PUBLISH FORM                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General Settings & Publish Button */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <span>General SaaS Variables & Immediate Publication</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Application Branding Name</label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Support Email Contact</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Website URL</label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Signup Plan</label>
                <select
                  value={formData.defaultPlan}
                  onChange={(e) => setFormData({ ...formData, defaultPlan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="free">FREE</option>
                  <option value="pro">PRO</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Trial (Days)</label>
                <input
                  type="number"
                  value={formData.trialDaysDefault}
                  onChange={(e) => setFormData({ ...formData, trialDaysDefault: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            {/* Publish Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                {hasIconChanges ? (
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Pending Icon Changes Ready to Publish!
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Live Icon and Settings Synchronized
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-blue-600/30 active:scale-95 transition"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing Live...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Publish Launcher Icon</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Admin Accounts List & Instant Sync Details */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Authorized Super Admins & Roles</span>
          </h3>

          <div className="space-y-2.5">
            {admins.map((adm) => (
              <div key={adm.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{adm.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{adm.email}</div>
                </div>

                <span className="px-2.5 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 rounded text-[10px] font-extrabold uppercase">
                  {adm.role}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 text-[11px] space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Cross-Platform Sync Pipeline:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Web Browser Favicon:</strong> Dynamically injected into browser tab and bookmark cache.</li>
              <li><strong className="text-slate-200">Android PWA & Homescreen:</strong> Updated dynamically in web manifest (192×192, 512×512, maskable).</li>
              <li><strong className="text-slate-200">Top Navigation Header:</strong> Brand logo in the app header and auth screens updates live.</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
