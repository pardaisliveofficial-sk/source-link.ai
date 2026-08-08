import React, { useState, useEffect } from 'react';
import { GitBranch, Github, Key, LogOut, User as UserIcon, History, ShieldCheck, Sparkles, Download } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  githubToken: string | null;
  githubUsername?: string;
  onOpenAuth: () => void;
  onOpenTokenHelp: () => void;
  onOpenSyncLogs: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  githubToken,
  githubUsername,
  onOpenAuth,
  onOpenTokenHelp,
  onOpenSyncLogs,
  onLogout
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#24292F] flex items-center justify-center text-white shadow-xs">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-gray-900 tracking-tight">SourceLink.ai</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" /> Delta Sync
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">Compare ZIP code deltas & push changes directly to GitHub</p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Chrome Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallPwa}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Install SourceLink as Chrome App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* GitHub Connection Badge */}
          {githubToken ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>GitHub Connected: <strong className="text-gray-900 font-mono">{githubUsername || 'Active'}</strong></span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Connect GitHub</span>
            </button>
          )}

          {/* Token Help */}
          <button
            onClick={onOpenTokenHelp}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-md transition-colors cursor-pointer"
            title="How to generate GitHub Token"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* Sync History Logs */}
          <button
            onClick={onOpenSyncLogs}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium px-3"
            title="View Commit Sync Logs"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Sync History</span>
          </button>

          {/* User Account / Login */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-gray-300 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-700">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-gray-500 capitalize flex items-center gap-1">
                    {user.authProvider === 'github' && <Github className="w-2.5 h-2.5" />}
                    {user.authProvider} account
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 bg-[#24292F] hover:bg-black text-white font-medium text-xs rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserIcon className="w-4 h-4" />
              Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
