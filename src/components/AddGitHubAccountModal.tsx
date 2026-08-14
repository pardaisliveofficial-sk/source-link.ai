import React, { useState } from 'react';
import { Github, Key, Tag, X, Plus, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { addGitHubAccountApi } from '../lib/auth';

interface AddGitHubAccountModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
  onOpenTokenHelp?: () => void;
}

export const AddGitHubAccountModal: React.FC<AddGitHubAccountModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  onOpenTokenHelp
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const accountCount = user?.githubAccounts?.length || 0;
  const isLimitReached = accountCount >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) {
      setError('Maximum limit of 5 connected GitHub accounts reached. Disconnect an account to add a new one.');
      return;
    }
    if (!tokenInput.trim()) {
      setError('Please enter a valid GitHub Personal Access Token (PAT).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const email = user?.email || 'local_user@sourcelink.ai';
      const result = await addGitHubAccountApi(email, tokenInput.trim(), labelInput.trim() || undefined);
      onSuccess(result.user);
      setTokenInput('');
      setLabelInput('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect GitHub account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800 border border-slate-700 text-blue-400 rounded-xl">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Add GitHub Account</h2>
            <p className="text-xs text-slate-400">Save multiple tokens to switch accounts instantly</p>
          </div>
        </div>

        {isLimitReached && (
          <div className="p-3 bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Maximum limit of 5 connected GitHub accounts reached. Disconnect an existing account to add a new one.</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 text-red-300 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Label Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Account Label / Alias (Optional)</span>
            </label>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="e.g. Work, Personal, Client Project, Org"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Helps you distinguish between accounts in the switcher.</p>
          </div>

          {/* Token Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>GitHub Personal Access Token (PAT) *</span>
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Info Banner & Token Creation Help */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-2">
            <p className="flex items-center gap-1 text-slate-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Requires <code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-emerald-300">repo</code> scope permission</span>
            </p>
            <div className="flex items-center justify-between text-blue-400 pt-1 border-t border-slate-800">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=SourceLink_Sync"
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                Generate PAT on GitHub <ExternalLink className="w-3 h-3" />
              </a>
              {onOpenTokenHelp && (
                <button
                  type="button"
                  onClick={onOpenTokenHelp}
                  className="hover:underline text-slate-400 hover:text-white"
                >
                  Step-by-step guide
                </button>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isLimitReached || !tokenInput.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Save Account
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
