import React, { useState } from 'react';
import { Search, Columns, Rows, FileCode2, Copy, Check } from 'lucide-react';
import { FileDiff } from '../types';

interface DiffInspectorProps {
  activeFile: FileDiff | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

interface LineDiffRow {
  type: 'add' | 'delete' | 'normal';
  oldLineNum: number | null;
  newLineNum: number | null;
  text: string;
}

function generateLineDiffRows(file: FileDiff): LineDiffRow[] {
  if (!file) return [];
  if (file.isBinary) return [];

  const oldLines = file.remoteContent ? file.remoteContent.split('\n') : [];
  const newLines = file.localContent ? file.localContent.split('\n') : [];

  if (file.status === 'added') {
    return newLines.map((line, idx) => ({
      type: 'add',
      oldLineNum: null,
      newLineNum: idx + 1,
      text: line,
    }));
  }

  if (file.status === 'deleted') {
    return oldLines.map((line, idx) => ({
      type: 'delete',
      oldLineNum: idx + 1,
      newLineNum: null,
      text: line,
    }));
  }

  if (file.status === 'unchanged') {
    return newLines.map((line, idx) => ({
      type: 'normal',
      oldLineNum: idx + 1,
      newLineNum: idx + 1,
      text: line,
    }));
  }

  // Modified file diff alignment
  const rows: LineDiffRow[] = [];
  let i = 0;
  let j = 0;

  const maxLen = Math.max(oldLines.length, newLines.length);

  while (i < oldLines.length || j < newLines.length) {
    const oldLine = i < oldLines.length ? oldLines[i] : null;
    const newLine = j < newLines.length ? newLines[j] : null;

    if (oldLine !== null && newLine !== null && oldLine === newLine) {
      rows.push({
        type: 'normal',
        oldLineNum: i + 1,
        newLineNum: j + 1,
        text: oldLine,
      });
      i++;
      j++;
    } else {
      if (oldLine !== null && (newLine === null || !newLines.slice(j, j + 5).includes(oldLine))) {
        rows.push({
          type: 'delete',
          oldLineNum: i + 1,
          newLineNum: null,
          text: oldLine,
        });
        i++;
      }
      if (newLine !== null && (oldLine === null || !oldLines.slice(i, i + 5).includes(newLine))) {
        rows.push({
          type: 'add',
          oldLineNum: null,
          newLineNum: j + 1,
          text: newLine,
        });
        j++;
      }
    }

    if (rows.length > 2500) break; // performance limit max 2500 lines
  }

  return rows;
}

export const DiffInspector: React.FC<DiffInspectorProps> = ({
  activeFile,
  searchQuery,
  onSearchChange,
}) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);

  if (!activeFile) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500 font-sans text-xs flex flex-col items-center justify-center min-h-[300px]">
        <FileCode2 className="w-8 h-8 text-gray-600 mb-2" />
        <p className="font-semibold text-gray-400">No file selected</p>
        <p className="text-[11px] text-gray-600 mt-1">Select any file from the diff list on the left to inspect its line-by-line diff.</p>
      </div>
    );
  }

  const diffRows = generateLineDiffRows(activeFile);

  const handleCopyCode = () => {
    const content = activeFile.localContent || activeFile.remoteContent || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col font-mono text-xs overflow-hidden shadow-sm">
      
      {/* File Inspector Header */}
      <div className="bg-gray-950 border-b border-gray-800 p-3 flex flex-wrap items-center justify-between gap-2 text-gray-300">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-white text-xs truncate max-w-[220px] sm:max-w-[320px]">
            {activeFile.path}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            activeFile.status === 'added' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
            activeFile.status === 'modified' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
            activeFile.status === 'deleted' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
            'bg-gray-800 text-gray-400'
          }`}>
            {activeFile.status}
          </span>
        </div>

        {/* View Controls & Copy Button */}
        <div className="flex items-center gap-2 text-xs font-sans">
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'unified' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
              title="Unified View"
            >
              <Rows className="w-3 h-3" /> Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'split' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
              title="Side-by-side View"
            >
              <Columns className="w-3 h-3" /> Side-by-Side
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors cursor-pointer"
            title="Copy current file content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Viewer Body */}
      <div className="max-h-96 overflow-auto custom-scrollbar bg-gray-950">
        {activeFile.isBinary ? (
          <div className="py-12 text-center text-amber-400 font-sans text-xs">
            Binary file content hidden from line-by-line text inspection.
          </div>
        ) : diffRows.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-sans text-xs">
            No line changes recorded for this file.
          </div>
        ) : viewMode === 'unified' ? (
          /* Unified View */
          <div className="divide-y divide-gray-900 text-[11px] leading-relaxed">
            {diffRows.map((row, idx) => (
              <div
                key={idx}
                className={`flex items-start ${
                  row.type === 'add' ? 'bg-emerald-950/40 text-emerald-200' :
                  row.type === 'delete' ? 'bg-rose-950/40 text-rose-200' :
                  'text-gray-300 hover:bg-gray-900/60'
                }`}
              >
                {/* Line numbers */}
                <span className="w-10 text-right pr-2 py-0.5 text-gray-600 select-none border-r border-gray-800/80 shrink-0">
                  {row.oldLineNum || ''}
                </span>
                <span className="w-10 text-right pr-2 py-0.5 text-gray-600 select-none border-r border-gray-800/80 shrink-0">
                  {row.newLineNum || ''}
                </span>

                {/* Status symbol */}
                <span className={`w-6 text-center py-0.5 font-bold select-none shrink-0 ${
                  row.type === 'add' ? 'text-emerald-400' :
                  row.type === 'delete' ? 'text-rose-400' : 'text-gray-600'
                }`}>
                  {row.type === 'add' ? '+' : row.type === 'delete' ? '-' : ' '}
                </span>

                {/* Line Text */}
                <pre className="py-0.5 px-2 whitespace-pre-wrap break-all flex-1 font-mono">
                  {row.text}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          /* Side by Side Split View */
          <div className="grid grid-cols-2 divide-x divide-gray-800 text-[11px] leading-relaxed">
            {/* Left: Remote Version */}
            <div className="divide-y divide-gray-900/80">
              <div className="bg-gray-900 px-3 py-1 text-[10px] font-sans font-bold text-rose-400 border-b border-gray-800">
                Remote Version
              </div>
              {diffRows.filter(r => r.type !== 'add').map((row, idx) => (
                <div key={idx} className={`flex ${row.type === 'delete' ? 'bg-rose-950/40 text-rose-200' : 'text-gray-300'}`}>
                  <span className="w-8 text-right pr-2 py-0.5 text-gray-600 select-none border-r border-gray-800 shrink-0">
                    {row.oldLineNum}
                  </span>
                  <pre className="py-0.5 px-2 whitespace-pre-wrap break-all flex-1 font-mono">
                    {row.text}
                  </pre>
                </div>
              ))}
            </div>

            {/* Right: ZIP Local Version */}
            <div className="divide-y divide-gray-900/80">
              <div className="bg-gray-900 px-3 py-1 text-[10px] font-sans font-bold text-emerald-400 border-b border-gray-800">
                Local ZIP Version
              </div>
              {diffRows.filter(r => r.type !== 'delete').map((row, idx) => (
                <div key={idx} className={`flex ${row.type === 'add' ? 'bg-emerald-950/40 text-emerald-200' : 'text-gray-300'}`}>
                  <span className="w-8 text-right pr-2 py-0.5 text-gray-600 select-none border-r border-gray-800 shrink-0">
                    {row.newLineNum}
                  </span>
                  <pre className="py-0.5 px-2 whitespace-pre-wrap break-all flex-1 font-mono">
                    {row.text}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
