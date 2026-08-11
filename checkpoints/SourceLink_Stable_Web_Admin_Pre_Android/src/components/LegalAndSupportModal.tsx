import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Mail, Trash2, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { User } from '../types';

interface LegalAndSupportModalProps {
  type: 'privacy' | 'terms' | 'support' | 'account' | null;
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
}

export const LegalAndSupportModal: React.FC<LegalAndSupportModalProps> = ({
  type,
  user,
  onClose,
  onLogout
}) => {
  const [supportName, setSupportName] = useState(user?.name || '');
  const [supportEmail, setSupportEmail] = useState(user?.email || '');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  if (!type) return null;

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSubmittingSupport(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supportName,
          email: supportEmail,
          subject: supportSubject,
          message: supportMessage
        })
      });
      if (res.ok) {
        setSupportSuccess(true);
        setSupportMessage('');
      }
    } catch {
      alert('Support submission failed. Please try again.');
    } finally {
      setSubmittingSupport(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      alert('Your account and associated history have been deleted.');
      onLogout();
      onClose();
    } catch {
      alert('Account deletion failed.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            {type === 'privacy' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
            {type === 'terms' && <FileText className="w-5 h-5 text-blue-400" />}
            {type === 'support' && <Mail className="w-5 h-5 text-indigo-400" />}
            {type === 'account' && <Trash2 className="w-5 h-5 text-rose-400" />}
            <span className="capitalize">
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'terms' && 'Terms of Service'}
              {type === 'support' && 'Contact & Technical Support'}
              {type === 'account' && 'Account Settings & Data Controls'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto space-y-4">
          
          {/* PRIVACY POLICY */}
          {type === 'privacy' && (
            <div className="space-y-4">
              <p className="text-slate-400 font-mono text-[11px]">Last Updated: August 2026</p>

              <h4 className="font-bold text-white text-sm">1. Ephemeral Code Processing</h4>
              <p>
                SourceLink.ai processes uploaded ZIP archives strictly in ephemeral memory and client-side browser memory. Your repository source code files are parsed, diffed against GitHub, and pushed directly to your specified repository branch. SourceLink does NOT store, index, sell, or retain uploaded ZIP files on permanent disk storage.
              </p>

              <h4 className="font-bold text-white text-sm">2. GitHub Credentials & Scopes</h4>
              <p>
                Personal Access Tokens (PAT) and OAuth Access Tokens are stored securely in your browser's local encrypted session or transmitted over TLS 1.3 to execute requested GitHub Git API operations. You retain full ownership and control over your GitHub tokens and can revoke them at any time in your GitHub developer settings.
              </p>

              <h4 className="font-bold text-white text-sm">3. User Data & Deletion Rights</h4>
              <p>
                We store minimal account identifiers (email, account name, plan tier, and sync audit logs). Under global privacy frameworks, you have the absolute right to view, export, or permanently delete your account data at any time via the Account Settings menu.
              </p>
            </div>
          )}

          {/* TERMS OF SERVICE */}
          {type === 'terms' && (
            <div className="space-y-4">
              <p className="text-slate-400 font-mono text-[11px]">Effective Date: August 2026</p>

              <h4 className="font-bold text-white text-sm">1. SaaS License & Acceptable Use</h4>
              <p>
                By accessing or using SourceLink.ai, you agree to comply with all applicable software development standards. You are strictly forbidden from using SourceLink to push malicious payloads, trojans, or unauthorized backdoors to public or private software repositories.
              </p>

              <h4 className="font-bold text-white text-sm">2. Usage Limits & Rate-Limiting</h4>
              <p>
                Free tiers are subject to fair usage limits (10 sync operations per month and a 50MB file size ceiling). Pro and Business tiers expand storage and rate limits accordingly. Exceeding fair limits may result in rate-limit throttling to preserve service availability for all public users.
              </p>

              <h4 className="font-bold text-white text-sm">3. Disclaimer of Warranty</h4>
              <p>
                SourceLink provides line diff tools and automated GitHub API push utilities. Users are advised to review selected files before confirming pushes. SourceLink is provided "as is" without warranty of any kind.
              </p>
            </div>
          )}

          {/* SUPPORT FORM */}
          {type === 'support' && (
            <div>
              {supportSuccess ? (
                <div className="p-6 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-sm">Message Received</h4>
                  <p className="text-slate-300 text-xs">
                    Thank you for contacting SourceLink support. Our engineering team has logged your query and will reply via email within 24 hours.
                  </p>
                  <button
                    onClick={() => setSupportSuccess(false)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={supportName}
                        onChange={(e) => setSupportName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Email</label>
                      <input
                        type="email"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. GitHub OAuth question, ZIP extraction issue..."
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Message Detail</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your query or issue in detail..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingSupport}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submittingSupport ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ACCOUNT & DELETION */}
          {type === 'account' && (
            <div className="space-y-6">
              {user ? (
                <>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="font-bold text-white text-sm">{user.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{user.email}</div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase">
                        {user.plan || 'Free'} Tier
                      </span>
                      <span className="text-slate-500 text-[10px]">Auth via {user.authProvider}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <h4 className="font-bold text-rose-400 text-sm mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Danger Zone: Account Deletion
                    </h4>
                    <p className="text-slate-400 text-xs mb-4">
                      Deleting your account will permanently purge your user record, saved session credentials, and sync logs from SourceLink.ai servers.
                    </p>

                    {confirmingDelete ? (
                      <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl space-y-3">
                        <p className="text-rose-200 font-semibold text-xs">Are you absolutely sure you want to delete your account?</p>
                        <div className="flex items-center gap-3">
                          <button
                            disabled={deletingAccount}
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {deletingAccount ? 'Deleting...' : 'Yes, Permanently Delete'}
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(false)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingDelete(true)}
                        className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Delete My Account</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-center py-4">You are not currently signed in.</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
