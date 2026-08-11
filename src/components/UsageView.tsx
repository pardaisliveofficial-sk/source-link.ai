import React, { useEffect, useState } from 'react';
import { HardDrive, Activity, FolderGit2, Zap, Shield, ArrowUpRight } from 'lucide-react';
import { MainViewTab, UsageStats, User } from '../types';
import { apiFetch } from '../lib/api';

interface UsageViewProps {
  user: User | null;
  onNavigateTab: (tab: MainViewTab) => void;
}

export const UsageView: React.FC<UsageViewProps> = ({ user, onNavigateTab }) => {
  const [stats, setStats] = useState<UsageStats>({
    plan: user?.plan || 'free',
    syncsUsed: 3,
    syncsLimit: user?.plan === 'pro' ? 250 : user?.plan === 'business' ? 9999 : 15,
    maxZipSizeMb: user?.plan === 'pro' ? 100 : user?.plan === 'business' ? 500 : 25,
    reposLimit: user?.plan === 'pro' ? 50 : user?.plan === 'business' ? 999 : 5
  });

  useEffect(() => {
    apiFetch('/api/usage/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.syncsLimit) {
          setStats(data);
        }
      })
      .catch(() => {});
  }, [user]);


  const syncPercentage = Math.min(100, Math.round((stats.syncsUsed / stats.syncsLimit) * 100));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage & Plan Entitlements</h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor monthly sync activity, ZIP file size limits, and repository allocations.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('pricing')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start cursor-pointer"
        >
          <span>Upgrade SaaS Plan</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Usage Meter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Syncs Meter */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-gray-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monthly Syncs</span>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>

          <div>
            <div className="text-3xl font-extrabold text-gray-900 font-mono">
              {stats.syncsUsed} <span className="text-xs font-normal text-gray-400">/ {stats.syncsLimit >= 9999 ? 'Unlimited' : stats.syncsLimit}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Resets on the 1st of every calendar month</p>
          </div>

          <div className="space-y-1 pt-2">
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${syncPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-gray-500">
              <span>Used: {syncPercentage}%</span>
              <span>{stats.syncsLimit - stats.syncsUsed} remaining</span>
            </div>
          </div>
        </div>

        {/* File Upload Size Limit */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-gray-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Max ZIP Upload</span>
            <HardDrive className="w-5 h-5 text-indigo-600" />
          </div>

          <div>
            <div className="text-3xl font-extrabold text-gray-900 font-mono">
              {stats.maxZipSizeMb} <span className="text-xs font-normal text-gray-400">MB</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Maximum archive size processed per sync operation</p>
          </div>

          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Need larger ZIP archives? Pro supports up to 100MB.</span>
          </div>
        </div>

        {/* Repositories Allocation */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-gray-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Repos</span>
            <FolderGit2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div>
            <div className="text-3xl font-extrabold text-gray-900 font-mono">
              {stats.reposLimit >= 999 ? 'Unlimited' : stats.reposLimit} <span className="text-xs font-normal text-gray-400">Repos</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">GitHub public & private repositories supported</p>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted OAuth token exchange via GitHub API.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
