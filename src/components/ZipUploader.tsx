import React, { useState, useRef } from 'react';
import { Upload, FileArchive, CheckCircle2, RefreshCw, FolderTree, Sparkles, Filter, Info, Layers, Zap } from 'lucide-react';
import { extractZipArchive, formatBytes, ZipExtractionResult } from '../lib/zipExtractor';
import { ExtractedFile } from '../types';

interface ZipUploaderProps {
  onFilesExtracted: (result: ZipExtractionResult, zipName: string) => void;
  isExtracting: boolean;
  extractedCount: number;
  currentZipName: string | null;
  extractionMeta?: ZipExtractionResult | null;
  onOpenPreview?: () => void;
}

export const ZipUploader: React.FC<ZipUploaderProps> = ({
  onFilesExtracted,
  isExtracting,
  extractedCount,
  currentZipName,
  extractionMeta,
  onOpenPreview,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIgnoredDetails, setShowIgnoredDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError('Please select a valid .ZIP file containing source code.');
      return;
    }

    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = await extractZipArchive(buffer, file.size);

      if (result.files.size === 0) {
        setError('No valid source code files found inside ZIP archive.');
        return;
      }

      onFilesExtracted(result, file.name);
    } catch (err: any) {
      setError(`Failed to extract ZIP file: ${err.message || 'Corrupted archive'}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
      
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
            <FileArchive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              1. Upload Source Code ZIP
            </h3>
            <p className="text-xs text-gray-500">Extracts source files and prepares diff detection</p>
          </div>
        </div>

        {extractedCount > 0 && (
          <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Ready for Diff
          </span>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Extraction State / Upload Box */}
      {isExtracting ? (
        <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-8 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-blue-900">Extracting ZIP archive and scanning files...</p>
        </div>
      ) : extractedCount > 0 && currentZipName ? (
        /* Loaded Summary Card */
        <div className="bg-gray-50/90 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0">
                <FolderTree className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-900 truncate max-w-[200px] sm:max-w-[280px]">
                    {currentZipName}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 font-mono font-bold rounded">
                    {extractedCount} source files
                  </span>
                  {extractionMeta?.totalSize ? (
                    <span className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-700 font-mono font-medium rounded">
                      {formatBytes(extractionMeta.totalSize)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Status: <strong className="text-green-700 font-semibold">Extracted & Ready for Comparison</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {onOpenPreview && (
                <button
                  type="button"
                  onClick={onOpenPreview}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Test in Live Applet</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-gray-300 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New ZIP
              </button>
            </div>
          </div>

          {/* Ignored Breakdown Info */}
          {extractionMeta && extractionMeta.ignoredCount > 0 && (
            <div className="bg-white border border-gray-200 rounded-md p-2.5 text-xs">
              <div className="flex items-center justify-between text-gray-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  Automatically Ignored: <strong className="text-gray-900">{extractionMeta.ignoredCount} files/folders</strong> (.gitignore + system junk)
                </span>
                <button
                  onClick={() => setShowIgnoredDetails(!showIgnoredDetails)}
                  className="text-blue-600 hover:text-blue-800 underline text-[11px] font-medium cursor-pointer"
                >
                  {showIgnoredDetails ? 'Hide details' : 'View ignored'}
                </button>
              </div>

              {showIgnoredDetails && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 font-mono text-[11px] text-gray-600 max-h-28 overflow-y-auto custom-scrollbar">
                  {extractionMeta.ignoredSummary.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        /* Drag & Drop Target */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-gray-300 hover:border-blue-400 bg-white'
          }`}
        >
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Upload ZIP to Sync</h3>
          <p className="text-xs text-gray-500 max-w-[320px] mx-auto mt-1">
            Drop your project <span className="font-mono text-blue-600 font-semibold">.ZIP</span> file here. We'll extract, filter .gitignore, and run diff comparison.
          </p>

          <div className="mt-4 inline-block px-4 py-2 bg-[#24292F] group-hover:bg-black text-white text-xs font-medium rounded-md shadow-xs transition-colors">
            Browse Files
          </div>

          <div className="flex items-center justify-center gap-2 mt-5 text-[10px] text-gray-500 font-medium">
            <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200">Auto-Extracts</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200">Parses .gitignore</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200">Ignores node_modules</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-2 font-medium px-1">
          ⚠️ {error}
        </p>
      )}

    </div>
  );
};

