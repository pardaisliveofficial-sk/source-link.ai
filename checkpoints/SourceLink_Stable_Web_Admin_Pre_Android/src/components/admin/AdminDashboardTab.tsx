import React from 'react';
import { Users, Activity, HardDrive, DollarSign, RefreshCw, CheckCircle2, TrendingUp, AlertTriangle, Database, ShieldCheck } from 'lucide-react';
import { AdminDashboardStats } from '../../types';

interface AdminDashboardTabProps {
  stats: AdminDashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ stats, loading, onRefresh }) => {
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Loading real-time admin metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Executive SaaS Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics, user growth, sync usage, and infrastructure health.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{stats.totalUsers}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">+{stats.newUsersThisWeek}</span>
            <span>new this week</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Code Syncs Executed</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{stats.totalSyncs}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">{stats.successfulSyncs}</span>
            <span>successful syncs</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Monthly Revenue Est.</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">${stats.revenueEstMonthly}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-amber-400 font-bold">{stats.proUsers + stats.businessUsers}</span>
            <span>paid subscribers</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Storage Usage</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{stats.currentStorageUsageMb} MB</div>
          <div className="text-[11px] text-slate-400">ZIP archive artifacts</div>
        </div>

      </div>

      {/* Plan & User Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Distribution */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>SaaS Plan Distribution & Conversion</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Free Plan</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{stats.freeUsers}</div>
              <div className="text-[10px] text-slate-500">{Math.round((stats.freeUsers / (stats.totalUsers || 1)) * 100)}% of total</div>
            </div>

            <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl">
              <div className="text-[10px] font-bold text-blue-400 uppercase">Pro Plan</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{stats.proUsers}</div>
              <div className="text-[10px] text-blue-300">{Math.round((stats.proUsers / (stats.totalUsers || 1)) * 100)}% of total</div>
            </div>

            <div className="p-3 bg-purple-950/40 border border-purple-900/60 rounded-xl">
              <div className="text-[10px] font-bold text-purple-400 uppercase">Business</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{stats.businessUsers}</div>
              <div className="text-[10px] text-purple-300">{Math.round((stats.businessUsers / (stats.totalUsers || 1)) * 100)}% of total</div>
            </div>

            <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl">
              <div className="text-[10px] font-bold text-red-400 uppercase">Suspended</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{stats.suspendedUsers}</div>
              <div className="text-[10px] text-red-300">account holds</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs text-slate-400 flex justify-between">
              <span>Subscribers Ratio</span>
              <span className="font-bold text-emerald-400">
                {Math.round(((stats.proUsers + stats.businessUsers) / (stats.totalUsers || 1)) * 100)}% Conversion Rate
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden flex">
              <div style={{ width: `${(stats.freeUsers / (stats.totalUsers || 1)) * 100}%` }} className="bg-slate-700 h-full" title="Free" />
              <div style={{ width: `${(stats.proUsers / (stats.totalUsers || 1)) * 100}%` }} className="bg-blue-600 h-full" title="Pro" />
              <div style={{ width: `${(stats.businessUsers / (stats.totalUsers || 1)) * 100}%` }} className="bg-purple-600 h-full" title="Business" />
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Infrastructure SLA Status</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Backend Database</span>
              </div>
              <span className="text-emerald-400 font-bold text-[10px]">{stats.systemHealth.databaseStatus}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>GitHub API OAuth</span>
              </div>
              <span className="text-emerald-400 font-bold text-[10px]">{stats.systemHealth.githubApiStatus}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Artifact Storage</span>
              </div>
              <span className="text-emerald-400 font-bold text-[10px]">{stats.systemHealth.storageStatus}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
