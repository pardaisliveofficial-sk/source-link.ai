import React from 'react';
import { History, ExternalLink, GitCommit, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { SyncLog } from '../types';

interface SyncLogsProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SyncLog[];
}

export const SyncLogs: React.FC<SyncLogsProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-gray-200 rounded-xl max-w-2xl w-full p-6 text-gray-900 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">GitHub Sync History</h2>
            <p className="text-xs text-gray-500">Activity record of incremental commits and pushes</p>
          </div>
        </div>

        {/* Logs List */}
        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500 bg-gray-50 p-6 rounded-lg border border-gray-200">
            No sync operations performed yet. Upload a ZIP file and push changes to see history here!
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-50/80 border border-gray-200 rounded-lg p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitCommit className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-gray-900 truncate">{log.repoFullName}</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-800 font-mono text-[10px] rounded font-medium">
                      {log.branch}
                    </span>
                  </div>

                  {log.status === 'success' ? (
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-800 font-semibold text-[10px] rounded-full border border-green-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" /> Pushed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-semibold text-[10px] rounded-full border border-red-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-600" /> Failed
                    </span>
                  )}
                </div>

                <p className="text-gray-800 font-mono text-[11px] bg-white p-2 rounded border border-gray-200">
                  {log.commitMessage}
                </p>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <span>
                    Files updated: <strong className="text-gray-900 font-mono">{log.changedFilesCount}</strong> ({log.addedFilesCount} added, {log.deletedFilesCount} deleted)
                  </span>

                  {log.commitUrl && (
                    <a
                      href={log.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline font-semibold"
                    >
                      View Commit <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
