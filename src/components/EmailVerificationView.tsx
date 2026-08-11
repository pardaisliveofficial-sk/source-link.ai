import React, { useState } from 'react';
import { Mail, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, LogOut, KeyRound } from 'lucide-react';
import { verifyEmailApi, resendVerificationApi } from '../lib/auth';
import { User } from '../types';

interface EmailVerificationViewProps {
  user: User;
  onVerified: (user: User) => void;
  onLogout: () => void;
}

export const EmailVerificationView: React.FC<EmailVerificationViewProps> = ({
  user,
  onVerified,
  onLogout
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updatedUser = await verifyEmailApi(user.email, code.trim());
      setSuccessMsg('Email verified successfully! Unlocking SourceLink.ai...');
      setTimeout(() => {
        onVerified(updatedUser);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const newCode = await resendVerificationApi(user.email);
      setSuccessMsg(`A new verification code (${newCode}) has been dispatched to ${user.email}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-950 border border-blue-800/80 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Verify Your Email Address</h1>
          <p className="text-xs text-slate-400">
            Mandatory security step before accessing SourceLink.ai Studio & GitHub Sync Engine.
          </p>
        </div>

        {/* User Account Context Banner */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 truncate font-mono">{user.email}</span>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
            Pending Verification
          </span>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span>Enter 6-Digit Verification Code</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 123456"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-[11px] text-blue-200 space-y-1">
            <p className="font-semibold text-blue-300">Quick Test Helper:</p>
            <p className="text-slate-400">Enter code <strong className="text-white font-mono">123456</strong> or check your registration verification code to instantly activate your account.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{loading ? 'Verifying Code...' : 'Verify Email & Activate Account'}</span>
          </button>
        </form>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending}
            className="text-blue-400 hover:underline cursor-pointer font-medium flex items-center gap-1"
          >
            {resending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Resend Verification Code</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="text-slate-400 hover:text-white hover:underline cursor-pointer flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
