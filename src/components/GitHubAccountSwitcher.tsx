import React, { useState, useRef, useEffect } from 'react';
import { Github, ChevronDown, Check, Plus, Settings, Trash2, Tag, ShieldAlert } from 'lucide-react';
import { User, SavedGitHubAccount } from '../types';

interface GitHubAccountSwitcherProps {
  user: User | null;
  activeToken: string | null;
  activeUsername?: string;
  onSwitchAccount: (accountId: string) => void;
  onOpenAddModal: () => void;
  onOpenSettings?: () => void;
  onRemoveAccount?: (accountId: string) => void;
  className?: string;
  variant?: 'dark' | 'light';
}

export const GitHubAccountSwitcher: React.FC<GitHubAccountSwitcherProps> = ({
  user,
  activeToken,
  activeUsername,
  onSwitchAccount,
  onOpenAddModal,
  onOpenSettings,
  onRemoveAccount,
  className = '',
  variant = 'dark'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const accounts: SavedGitHubAccount[] = user?.githubAccounts && user.githubAccounts.length > 0
    ? user.githubAccounts
    : activeToken
    ? [{
        id: user?.activeGitHubId || 'active_gh',
        username: activeUsername || user?.githubUsername || 'github-user',
        token: activeToken,
        avatarUrl: user?.avatarUrl,
        label: 'Default Account',
        addedAt: new Date().toISOString()
      }]
    : [];

  const activeAccount = accounts.find(
    a => a.id === user?.activeGitHubId || a.token === activeToken
  ) || accounts[0];

  const isLimitReached = accounts.length >= 5;

  // Close dropdown on outside click or touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const isLight = variant === 'light';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      
      {/* Trigger Button */}
      {activeAccount ? (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs font-medium shadow-xs touch-manipulation active:scale-95 ${
            isLight
              ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200'
          }`}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {activeAccount.avatarUrl ? (
            <img
              src={activeAccount.avatarUrl}
              alt={activeAccount.username}
              className="w-4 h-4 rounded-full border border-gray-400 object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Github className="w-4 h-4 text-blue-400 shrink-0" />
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold truncate max-w-[90px] sm:max-w-[120px]">
              @{activeAccount.username}
            </span>
            {activeAccount.label && (
              <span className={`px-1.5 py-0.2 text-[9px] font-semibold rounded border uppercase tracking-wide hidden sm:inline ${
                isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-950/80 text-blue-300 border-blue-800/80'
              }`}>
                {activeAccount.label}
              </span>
            )}
          </div>

          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''} ${
            isLight ? 'text-gray-500' : 'text-slate-400'
          }`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 touch-manipulation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add GitHub Account</span>
        </button>
      )}

      {/* Popover Menu */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
          isLight
            ? 'bg-white border-gray-200 text-gray-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          
          {/* Header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            isLight ? 'bg-gray-50 border-gray-100' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Github className="w-4 h-4 text-blue-400" />
              <span>GitHub Accounts ({accounts.length}/5)</span>
            </div>
            {isLimitReached ? (
              <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                Max Limit (5/5)
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                Ready to Switch
              </span>
            )}
          </div>

          {/* Account List */}
          <div className="max-h-64 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {accounts.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <p className="text-xs text-gray-500">No GitHub accounts saved yet.</p>
              </div>
            ) : (
              accounts.map((acc) => {
                const isActive = activeAccount && (acc.id === activeAccount.id || acc.token === activeAccount.token);
                return (
                  <div
                    key={acc.id}
                    className={`group w-full p-2.5 rounded-xl border text-xs transition flex items-center justify-between gap-2 cursor-pointer touch-manipulation ${
                      isActive
                        ? isLight
                          ? 'bg-blue-50/90 border-blue-300 text-blue-950'
                          : 'bg-blue-950/50 border-blue-800 text-white font-semibold'
                        : isLight
                          ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                          : 'bg-slate-900 hover:bg-slate-800/90 border-slate-800 text-slate-300'
                    }`}
                    onClick={() => {
                      if (!isActive) {
                        onSwitchAccount(acc.id);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {acc.avatarUrl ? (
                        <img
                          src={acc.avatarUrl}
                          alt={acc.username}
                          className="w-7 h-7 rounded-full border border-gray-300 shrink-0 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {acc.username.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate">@{acc.username}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[9px] font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                          <Tag className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                          <span className="truncate">{acc.label || 'GitHub Token'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Remove/Disconnect Action */}
                    {onRemoveAccount && accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveAccount(acc.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer shrink-0"
                        title="Disconnect account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action Footer */}
          <div className={`p-2.5 border-t space-y-1.5 ${
            isLight ? 'bg-gray-50 border-gray-100' : 'bg-slate-950/80 border-slate-800'
          }`}>
            {!isLimitReached ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAddModal();
                }}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 touch-manipulation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Account ({accounts.length}/5)</span>
              </button>
            ) : (
              <div className="w-full py-2 px-3 bg-slate-800/60 border border-slate-700/60 text-slate-400 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 text-center">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Max 5 Accounts Limit Reached</span>
              </div>
            )}

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage Accounts & Tokens</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
