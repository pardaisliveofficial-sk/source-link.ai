import React, { useState } from 'react';
import { GitCommit, FilePlus2, FileEdit, FileX2, RefreshCw, Send, CheckCircle2, ChevronRight, Sparkles, Code2, Search } from 'lucide-react';
import { FileDiff, DiffType, GitHubRepo } from '../types';
import { DiffInspector } from './DiffInspector';

interface DiffViewerProps {
  diffs: FileDiff[];
  isDiffing: boolean;
  isPushing: boolean;
  selectedRepo: GitHubRepo | null;
  targetBranch: string;
  onRunDiff: () => void;
  onOpenPushModal: (commitMessage: string, selectedDiffs: FileDiff[]) => void;
  onSelectFileForInspector: (path: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffs,
  isDiffing,
  isPushing,
  selectedRepo,
  targetBranch,
  onRunDiff,
  onOpenPushModal,
  onSelectFileForInspector,
}) => {
  const [filterType, setFilterType] = useState<DiffType | 'all' | 'changed'>('changed');
  const [fileSearch, setFileSearch] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [activeDiffFile, setActiveDiffFile] = useState<FileDiff | null>(null);

  // Initialize selected paths on diffs change
  React.useEffect(() => {
    const changed = diffs.filter(d => d.status !== 'unchanged').map(d => d.path);
    
    if (changed.length > 0) {
      setSelectedPaths(new Set(changed));
      setFilterType('changed');
    } else {
      // If 0 changed files, select ALL files so user can still force-push/sync
      const allPaths = diffs.map(d => d.path);
      setSelectedPaths(new Set(allPaths));
      setFilterType('all');
    }

    if (diffs.length > 0) {
      const firstChanged = diffs.find(d => d.status !== 'unchanged') || diffs[0];
      setActiveDiffFile(firstChanged);
    }
  }, [diffs]);

  const addedCount = diffs.filter(d => d.status === 'added').length;
  const modifiedCount = diffs.filter(d => d.status === 'modified').length;
  const deletedCount = diffs.filter(d => d.status === 'deleted').length;
  const unchangedCount = diffs.filter(d => d.status === 'unchanged').length;
  const totalChanged = addedCount + modifiedCount + deletedCount;

  const totalAdditions = diffs.reduce((sum, d) => sum + (d.additionsCount || 0), 0);
  const totalDeletions = diffs.reduce((sum, d) => sum + (d.deletionsCount || 0), 0);

  const filteredDiffs = diffs.filter(d => {
    // 1. Filter status
    if (filterType === 'changed' && d.status === 'unchanged') return false;
    if (filterType !== 'all' && filterType !== 'changed' && d.status !== filterType) return false;

    // 2. Search path filter
    if (fileSearch.trim() && !d.path.toLowerCase().includes(fileSearch.trim().toLowerCase())) {
      return false;
    }

    return true;
  });

  const toggleSelectAllFiltered = () => {
    const filteredPaths = filteredDiffs.map(d => d.path);
    const allFilteredSelected = filteredPaths.length > 0 && filteredPaths.every(p => selectedPaths.has(p));

    const next = new Set(selectedPaths);
    if (allFilteredSelected) {
      filteredPaths.forEach(p => next.delete(p));
    } else {
      filteredPaths.forEach(p => next.add(p));
    }
    setSelectedPaths(next);
  };

  const selectAllFiles = () => {
    setSelectedPaths(new Set(diffs.map(d => d.path)));
  };

  const selectChangedOnly = () => {
    const changed = diffs.filter(d => d.status !== 'unchanged').map(d => d.path);
    setSelectedPaths(new Set(changed));
  };

  const clearSelection = () => {
    setSelectedPaths(new Set());
  };

  const togglePath = (path: string) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedPaths(next);
  };

  const handleOpenModal = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = diffs.filter(d => selectedPaths.has(d.path));
    if (selected.length === 0) return;
    const msg = commitMessage.trim() || `Sync ${selected.length} changed files via SourceLink.ai`;
    onOpenPushModal(msg, selected);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-5">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              3. Smart Diff & Selective Push
            </h3>
            <p className="text-xs text-gray-500">Compares ZIP files with GitHub <code className="text-blue-600 font-mono font-semibold">{targetBranch}</code> branch</p>
          </div>
        </div>

        <button
          onClick={onRunDiff}
          disabled={isDiffing || !selectedRepo}
          className="px-3.5 py-2 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-700 text-xs font-medium rounded-md border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDiffing ? 'animate-spin text-blue-600' : ''}`} />
          {isDiffing ? 'Analyzing Diffs...' : 'Re-Analyze Diffs'}
        </button>
      </div>

      {isDiffing ? (
        <div className="py-12 text-center space-y-3 bg-blue-50/40 rounded-lg border border-blue-100">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-blue-900">Comparing ZIP file contents with remote GitHub branch...</p>
          <p className="text-[11px] text-gray-500">Calculating file SHAs, line additions, and deletions</p>
        </div>
      ) : diffs.length === 0 ? (
        <div className="py-10 text-center space-y-2 bg-gray-50/60 rounded-lg border border-gray-200">
          <Code2 className="w-8 h-8 text-gray-400 mx-auto" />
          <p className="text-xs text-gray-500">Upload a ZIP file and select a repository above to run diff detection.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Diff Summary Badges & Category Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-medium">
            <button
              onClick={() => setFilterType('changed')}
              className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                filterType === 'changed'
                  ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Total Changed</div>
              <div className="text-base font-bold text-blue-700 mt-0.5">{totalChanged} files</div>
              <div className="text-[10px] text-gray-500 flex gap-1.5 mt-0.5 font-mono">
                <span className="text-green-600 font-bold">+{totalAdditions}</span>
                <span className="text-red-600 font-bold">-{totalDeletions}</span>
              </div>
            </button>

            <button
              onClick={() => setFilterType('added')}
              className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                filterType === 'added'
                  ? 'bg-green-100 border-green-400 text-green-950 font-bold'
                  : 'bg-green-50/50 border-green-200 text-green-800 hover:bg-green-50'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-green-700 font-bold flex items-center gap-1">
                <FilePlus2 className="w-3 h-3 text-green-600" /> Added
              </div>
              <div className="text-base font-bold text-green-700 mt-0.5">{addedCount} files</div>
            </button>

            <button
              onClick={() => setFilterType('modified')}
              className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                filterType === 'modified'
                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                  : 'bg-amber-50/50 border-amber-200 text-amber-800 hover:bg-amber-50'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-amber-700 font-bold flex items-center gap-1">
                <FileEdit className="w-3 h-3 text-amber-600" /> Modified
              </div>
              <div className="text-base font-bold text-amber-700 mt-0.5">{modifiedCount} files</div>
            </button>

            <button
              onClick={() => setFilterType('deleted')}
              className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                filterType === 'deleted'
                  ? 'bg-red-100 border-red-400 text-red-950 font-bold'
                  : 'bg-red-50/50 border-red-200 text-red-800 hover:bg-red-50'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-red-700 font-bold flex items-center gap-1">
                <FileX2 className="w-3 h-3 text-red-600" /> Deleted
              </div>
              <div className="text-base font-bold text-red-700 mt-0.5">{deletedCount} files</div>
            </button>

            <button
              onClick={() => setFilterType('all')}
              className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer col-span-2 sm:col-span-1 ${
                filterType === 'all'
                  ? 'bg-gray-200 border-gray-400 text-gray-900 font-bold'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Unchanged</div>
              <div className="text-base font-bold text-gray-700 mt-0.5">{unchangedCount} files</div>
            </button>
          </div>

          {/* Diff Grid: File list with Checkboxes on Left, Line Diff Inspector on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Column: File Search + Checklist */}
            <div className="lg:col-span-5 bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col space-y-2">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={fileSearch || ''}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Filter files by path..."
                  className="w-full bg-white border border-gray-300 rounded-md pl-8 pr-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Selection Toolbar & Quick Actions */}
              <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-200 text-xs">
                <div className="flex items-center justify-between text-gray-700 font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filteredDiffs.length > 0 && filteredDiffs.every(d => selectedPaths.has(d.path))}
                      onChange={toggleSelectAllFiltered}
                      className="accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Selected: <strong className="text-blue-600 font-mono">{selectedPaths.size}</strong> / {diffs.length}</span>
                  </label>
                  <span className="text-[11px] font-mono text-gray-500">{filteredDiffs.length} shown</span>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={selectAllFiles}
                    className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px] font-medium text-gray-700 cursor-pointer"
                  >
                    Select All
                  </button>
                  {totalChanged > 0 && (
                    <button
                      type="button"
                      onClick={selectChangedOnly}
                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Changed Only ({totalChanged})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2 py-0.5 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-200 text-gray-600 hover:text-red-600 rounded text-[10px] font-medium cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Scrollable File Items */}
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1 custom-scrollbar flex-1">
                {filteredDiffs.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No files matching filter.</p>
                ) : (
                  filteredDiffs.map((diff) => {
                    const isSelected = selectedPaths.has(diff.path);
                    const isActive = activeDiffFile?.path === diff.path;

                    return (
                      <div
                        key={diff.path}
                        onClick={() => {
                          setActiveDiffFile(diff);
                          onSelectFileForInspector(diff.path);
                        }}
                        className={`p-2 rounded-md text-xs flex items-center justify-between gap-2 cursor-pointer border transition-all ${
                          isActive
                            ? 'bg-blue-50 border-blue-400 text-blue-950 font-medium'
                            : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              togglePath(diff.path);
                            }}
                            className="accent-blue-600 shrink-0 w-4 h-4 cursor-pointer"
                          />

                          {diff.status === 'added' && <span className="text-green-700 font-mono font-bold text-[11px] px-1 bg-green-100 rounded">+</span>}
                          {diff.status === 'modified' && <span className="text-amber-700 font-mono font-bold text-[11px] px-1 bg-amber-100 rounded">~</span>}
                          {diff.status === 'deleted' && <span className="text-red-700 font-mono font-bold text-[11px] px-1 bg-red-100 rounded">-</span>}
                          {diff.status === 'unchanged' && <span className="text-gray-500 font-mono text-[11px] px-1 bg-gray-200 rounded">=</span>}

                          <span className="font-mono text-[11px] truncate">{diff.path}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                          {diff.additionsCount !== undefined && diff.additionsCount > 0 && (
                            <span className="text-green-600 font-mono font-bold">+{diff.additionsCount}</span>
                          )}
                          {diff.deletionsCount !== undefined && diff.deletionsCount > 0 && (
                            <span className="text-red-600 font-mono font-bold">-{diff.deletionsCount}</span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Line-by-Line Code Inspector Component */}
            <div className="lg:col-span-7">
              <DiffInspector
                activeFile={activeDiffFile}
                searchQuery={fileSearch}
                onSearchChange={setFileSearch}
              />
            </div>

          </div>

          {/* Action Push Bar */}
          <form onSubmit={handleOpenModal} className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={commitMessage || ''}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder={`Commit message: Sync ${selectedPaths.size} changed files via SourceLink.ai`}
                  className="w-full bg-white border border-gray-300 rounded-md px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isPushing || selectedPaths.size === 0 || !selectedRepo}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Review & Push ({selectedPaths.size} Files)</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Only selected changed files will be updated in <code className="text-blue-600 font-semibold">{selectedRepo?.full_name || 'repo'}</code> branch <code className="text-blue-600 font-semibold">{targetBranch}</code>.
            </p>
          </form>

        </div>
      )}

    </div>
  );
};

