import React, { useState } from 'react';
import { User, Key, Shield, Trash2, AlertTriangle, RefreshCw, Github, Mail, UserCheck } from 'lucide-react';
import { User as UserType } from '../types';
import { apiFetch } from '../lib/api';

interface AccountSettingsProps {
  user: UserType | null;
  githubToken: string | null;
  onUpdateGithubToken: (token: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  user,
  githubToken,
  onUpdateGithubToken,
  onLogout,
  onDeleteAccount
}) => {
  const [newTokenInput, setNewTokenInput] = useState(githubToken || '');
  const [isSavedTokenMsg, setIsSavedTokenMsg] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenInput.trim()) return;
    onUpdateGithubToken(newTokenInput.trim());
    setIsSavedTokenMsg(true);
    setTimeout(() => setIsSavedTokenMsg(false), 3000);
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmInput.trim().toLowerCase() !== 'delete') return;
    setIsDeleting(true);

    try {
      await apiFetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });
    } catch {
      // Fallback local cleanup if network error
    }

    setIsDeleting(false);
    setShowDeleteModal(false);
    onDeleteAccount();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account & Security Settings</h1>
        <p className="text-xs text-gray-500 mt-1">Manage your profile, GitHub connections, API keys, and privacy controls.</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name || 'User'} className="w-16 h-16 rounded-full border border-gray-200 object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center text-xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}

          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>{user?.name || 'Developer'}</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full border border-blue-200 uppercase">
                {user?.plan || 'Free'} Plan
              </span>
            </h2>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email || 'No email attached'}</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-500" />
              <span>Authenticated via {user?.authProvider || 'Email'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* GitHub Integration Credentials */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-gray-900" />
            <h3 className="font-bold text-gray-900 text-sm">GitHub Access Connection</h3>
          </div>
          {githubToken ? (
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-[11px] rounded-full border border-emerald-200">
              Connected & Active
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-semibold text-[11px] rounded-full border border-amber-200">
              Token Required
            </span>
          )}
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          SourceLink.ai uses GitHub Personal Access Tokens (PAT) or OAuth credentials with <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">repo</code> scope to list repositories and commit tree diffs safely.
        </p>

        <form onSubmit={handleSaveToken} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              GitHub Personal Access Token (PAT)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newTokenInput}
                  onChange={(e) => setNewTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Update Token
              </button>
            </div>
          </div>

          {isSavedTokenMsg && (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>GitHub Access Token saved successfully!</span>
            </p>
          )}
        </form>
      </div>

      {/* Privacy & Account Deletion Controls */}
      <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <Shield className="w-5 h-5" />
          <h3 className="font-bold text-gray-900 text-sm">Danger Zone & Privacy Controls</h3>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          You can logout securely from this device or permanently delete your SourceLink.ai account, stored tokens, and sync history.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl border border-gray-300 transition cursor-pointer"
          >
            Logout Session
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Permanently Delete Account</span>
          </button>
        </div>
      </div>

      {/* Modal Confirmation for Account Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Delete Account Permanently?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  This action is irreversible. All sync logs, GitHub tokens, and account profile details will be permanently wiped.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-medium text-gray-700">
                Type <strong className="text-red-600 uppercase font-mono">delete</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={deleteConfirmInput.trim().toLowerCase() !== 'delete' || isDeleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
