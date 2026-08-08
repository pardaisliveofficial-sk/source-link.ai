import React, { useState } from 'react';
import {
  X,
  Send,
  GitCommit,
  GitBranch,
  FolderGit,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  FilePlus2,
  FileEdit,
  FileX2
} from 'lucide-react';
import { FileDiff, GitHubRepo } from '../types';
import { checkRemoteConflict } from '../lib/github';

interface PushConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRepo: GitHubRepo | null;
  targetBranch: string;
  selectedDiffs: FileDiff[];
  githubToken: string | null;
  initialRemoteHeadSha: string | null;
  defaultCommitMessage: string;
  onConfirmPush: (commitMessage: string) => Promise<{ commitSha: string; commitUrl: string } | null>;
}

export const PushConfirmModal: React.FC<PushConfirmModalProps> = ({
  isOpen,
  onClose,
  selectedRepo,
  targetBranch,
  selectedDiffs,
  githubToken,
  initialRemoteHeadSha,
  defaultCommitMessage,
  onConfirmPush,
}) => {
  const [commitMessage, setCommitMessage] = useState(defaultCommitMessage || '');
  const [isPushing, setIsPushing] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [pushedResult, setPushedResult] = useState<{ commitSha: string; commitUrl: string } | null>(null);
  const [copiedSha, setCopiedSha] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCommitMessage(defaultCommitMessage || `Sync ${(selectedDiffs || []).length} files via SourceLink.ai`);
      setPushedResult(null);
      setConflictWarning(null);
      verifyRemoteConflict();
    }
  }, [isOpen, defaultCommitMessage, selectedDiffs]);

  const verifyRemoteConflict = async () => {
    if (!githubToken || !selectedRepo) return;
    setIsCheckingConflict(true);
    setConflictWarning(null);
    try {
      const res = await checkRemoteConflict(
        githubToken,
        selectedRepo.owner.login,
        selectedRepo.name,
        targetBranch,
        initialRemoteHeadSha
      );
      if (res.hasConflict) {
        setConflictWarning(
          `Conflict Warning: The remote branch '${targetBranch}' was updated on GitHub after your diff was loaded. Pushing now will update the branch with your selected changes.`
        );
      }
    } catch {
      // ignore
    } finally {
      setIsCheckingConflict(false);
    }
  };

  if (!isOpen) return null;

  const addedCount = selectedDiffs.filter((d) => d.status === 'added').length;
  const modifiedCount = selectedDiffs.filter((d) => d.status === 'modified').length;
  const deletedCount = selectedDiffs.filter((d) => d.status === 'deleted').length;

  const handlePush = async () => {
    setIsPushing(true);
    try {
      const res = await onConfirmPush(commitMessage.trim());
      if (res) {
        setPushedResult(res);
      }
    } catch (err: any) {
      setConflictWarning(`Push failed: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  const copySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 text-gray-900 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isPushing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {pushedResult ? (
          /* Post Push Success State */
          <div className="space-y-5 text-center py-2">
            <div className="w-12 h-12 bg-green-100 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Push Successful!</h2>
              <p className="text-xs text-gray-500 mt-1">
                Pushed {selectedDiffs.length} changed files to <span className="font-semibold text-gray-800">{selectedRepo?.full_name}</span>
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs text-left">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Repository:</span>
                <span className="font-bold text-gray-900">{selectedRepo?.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Target Branch:</span>
                <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {targetBranch}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Commit SHA:</span>
                <div className="flex items-center gap-1.5 font-mono text-gray-900">
                  <span className="font-bold">{pushedResult.commitSha.substring(0, 7)}</span>
                  <button
                    onClick={() => copySha(pushedResult.commitSha)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600 cursor-pointer"
                    title="Copy SHA"
                  >
                    {copiedSha ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-[11px]">
                <span className="text-gray-500">Changes:</span>
                <span className="font-semibold text-gray-800">
                  +{addedCount} added, ~{modifiedCount} modified, -{deletedCount} deleted
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={pushedResult.commitUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 bg-[#24292F] hover:bg-black text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                Open Commit on GitHub
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Push Confirmation Form */
          <div className="space-y-4">
            
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Confirm GitHub Push</h2>
                <p className="text-xs text-gray-500">Review selected files and commit details before pushing</p>
              </div>
            </div>

            {/* Target Repo & Branch Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Destination Repo:</span>
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <FolderGit className="w-3.5 h-3.5 text-blue-600" />
                  {selectedRepo?.full_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Target Branch:</span>
                <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> {targetBranch}
                </span>
              </div>
            </div>

            {/* Conflict Warning if any */}
            {conflictWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Remote Updates Detected</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">{conflictWarning}</p>
                </div>
              </div>
            )}

            {/* Selected Files List Summary */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                <span>Selected Files ({selectedDiffs.length})</span>
                <div className="flex items-center gap-2 text-[11px] font-normal">
                  <span className="text-green-600 font-bold flex items-center gap-0.5"><FilePlus2 className="w-3 h-3" />+{addedCount}</span>
                  <span className="text-amber-600 font-bold flex items-center gap-0.5"><FileEdit className="w-3 h-3" />~{modifiedCount}</span>
                  <span className="text-red-600 font-bold flex items-center gap-0.5"><FileX2 className="w-3 h-3" />-{deletedCount}</span>
                </div>
              </div>

              <div className="max-h-36 overflow-y-auto bg-gray-50 border border-gray-200 rounded-md p-2 space-y-1 font-mono text-[11px] custom-scrollbar">
                {selectedDiffs.map((d) => (
                  <div key={d.path} className="flex items-center justify-between text-gray-800">
                    <span className="truncate pr-2">{d.path}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded font-bold uppercase shrink-0 ${
                      d.status === 'added' ? 'bg-green-100 text-green-700' :
                      d.status === 'modified' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commit Message Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Commit Message
              </label>
              <div className="relative">
                <GitCommit className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={commitMessage || ''}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter commit message..."
                  className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            {/* Push Action Button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPushing}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePush}
                disabled={isPushing || isCheckingConflict || selectedDiffs.length === 0}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPushing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Pushing Changes...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Push to GitHub</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
