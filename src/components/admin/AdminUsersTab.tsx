import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, CheckCircle, Ban, Trash2, Edit3, Eye, Calendar, Sparkles, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { AdminUserListItem } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminUsersTabProps {
  users: AdminUserListItem[];
  loading: boolean;
  onRefresh: () => void;
  token: string;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, loading, onRefresh, token }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [overrideModalUser, setOverrideModalUser] = useState<AdminUserListItem | null>(null);

  // Form states for Plan Override
  const [overridePlan, setOverridePlan] = useState<'free' | 'pro' | 'business'>('pro');
  const [overrideDays, setOverrideDays] = useState<number>(30);
  const [overrideReason, setOverrideReason] = useState<string>('Customer support compensation');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const showMsg = (text: string) => {
    setActionMessage(text);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Filter users client side or re-fetch
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = planFilter === 'all' || u.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Handle Fetch User Detail
  const handleOpenUserDetail = async (userId: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUserDetail(data);
      }
    } catch (err) {
      alert('Failed to fetch user details.');
    }
  };

  // Handle Apply Plan Override
  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalUser) return;

    setSubmittingOverride(true);
    try {
      const res = await apiFetch(`/api/admin/users/${overrideModalUser.id}/plan-override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newPlan: overridePlan,
          durationDays: overrideDays,
          reason: overrideReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grant override.');

      showMsg(data.message || 'Plan override applied.');
      setOverrideModalUser(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating user plan.');
    } finally {
      setSubmittingOverride(false);
    }
  };

  // Handle Revoke Plan Override
  const handleRevokeOverride = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke manual plan override for this user?')) return;

    try {
      const res = await apiFetch(`/api/admin/users/${userId}/plan-override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ revokeOverride: true })
      });

      if (res.ok) {
        showMsg('Override revoked successfully.');
        onRefresh();
        if (selectedUserDetail) setSelectedUserDetail(null);
      }
    } catch (err) {
      alert('Failed to revoke override.');
    }
  };

  // Handle Suspend / Unsuspend
  const handleToggleSuspend = async (user: AdminUserListItem) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus.toUpperCase()} user ${user.email}?`)) return;

    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showMsg(`User ${user.email} is now ${newStatus}.`);
        onRefresh();
      }
    } catch (err) {
      alert('Failed to change user status.');
    }
  };

  // Handle Delete Account
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`CRITICAL WARNING: Delete account for ${email}? This cannot be undone.`)) return;

    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        showMsg(`User ${email} deleted.`);
        onRefresh();
        if (selectedUserDetail) setSelectedUserDetail(null);
      }
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by Name, Email, or User ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs text-emerald-400 underline">Dismiss</button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">User Profile</th>
                <th className="p-3.5">Plan & Source</th>
                <th className="p-3.5">Syncs Used</th>
                <th className="p-3.5">Storage</th>
                <th className="p-3.5">GitHub</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No matching user records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white text-xs">{u.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                      <div className="text-[9px] font-mono text-slate-600 mt-0.5">{u.id}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          u.plan === 'business' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                          u.plan === 'pro' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {u.plan}
                        </span>
                        {u.planSource === 'ADMIN_OVERRIDE' && (
                          <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[9px] font-bold" title="Granted by Admin">
                            OVERRIDE
                          </span>
                        )}
                      </div>
                      {u.overrideExpiry && (
                        <div className="text-[9px] text-amber-400 mt-1 font-mono">
                          Expires: {new Date(u.overrideExpiry).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="font-bold text-white">{u.syncsCount}</span>
                      <span className="text-slate-500"> / {u.maxSyncs >= 9999 ? '∞' : u.maxSyncs}</span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-400">
                      {u.storageUsageMb} MB
                    </td>

                    <td className="p-3.5">
                      {u.githubConnected ? (
                        <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>@{u.githubUsername || 'connected'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Not connected</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'suspended' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenUserDetail(u.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                        title="View Full Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setOverrideModalUser(u)}
                        className="p-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 rounded-lg transition cursor-pointer"
                        title="Assign / Override Plan"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleSuspend(u)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          u.status === 'suspended' ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900' : 'bg-amber-950 text-amber-300 hover:bg-amber-900'
                        }`}
                        title={u.status === 'suspended' ? 'Unsuspend User' : 'Suspend User'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg transition cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Plan Override */}
      {overrideModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setOverrideModalUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Manual Plan Override</h3>
            </div>

            <p className="text-xs text-slate-400">
              Grant custom plan access to <strong className="text-white">{overrideModalUser.email}</strong>. This bypasses default payment subscriptions.
            </p>

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Plan</label>
                <select
                  value={overridePlan}
                  onChange={(e: any) => setOverridePlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="free">FREE</option>
                  <option value="pro">PRO ($19/mo equivalent)</option>
                  <option value="business">BUSINESS ($49/mo equivalent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Override Duration (Days)</label>
                <input
                  type="number"
                  value={overrideDays}
                  onChange={(e) => setOverrideDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Reason / Justification</label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required
                  placeholder="e.g. Support compensation, partner account, beta tester"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {overrideModalUser.planSource === 'ADMIN_OVERRIDE' && (
                  <button
                    type="button"
                    onClick={() => handleRevokeOverride(overrideModalUser.id)}
                    className="px-3 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold rounded-xl"
                  >
                    Revoke Override
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {submittingOverride ? 'Saving...' : 'Apply Plan Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full User Detail Profile */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedUserDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-4">
              <div className="text-lg font-bold text-white">{selectedUserDetail.user.name}</div>
              <div className="text-xs text-slate-400 font-mono">{selectedUserDetail.user.email} • ID: {selectedUserDetail.user.id}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Subscription Profile</div>
                <div className="text-sm font-extrabold text-white uppercase flex items-center gap-2">
                  <span>Current: {selectedUserDetail.subscription.currentPlan}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                    Source: {selectedUserDetail.subscription.planSource}
                  </span>
                </div>
                {selectedUserDetail.subscription.override && (
                  <div className="text-xs text-amber-400 pt-1 border-t border-slate-800 mt-2 space-y-1">
                    <div><strong>Granted by:</strong> {selectedUserDetail.subscription.override.grantedByAdminEmail}</div>
                    <div><strong>Expiry:</strong> {new Date(selectedUserDetail.subscription.override.expiryDate).toLocaleString()}</div>
                    <div><strong>Reason:</strong> {selectedUserDetail.subscription.override.reason}</div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Usage Quota</div>
                <div className="text-sm font-bold text-white">
                  Syncs: {selectedUserDetail.usage.syncsCount} / {selectedUserDetail.usage.maxSyncs}
                </div>
                <div className="text-xs text-slate-400">
                  Max ZIP Upload: {selectedUserDetail.usage.maxZipSizeMb} MB
                </div>
                <div className="text-xs text-slate-400">
                  Storage Footprint: {selectedUserDetail.usage.storageUsageMb} MB
                </div>
              </div>

            </div>

            {/* Sync History Audit */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Recent Code Sync History</h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-500 font-mono text-[10px]">
                    <tr>
                      <th className="p-2">Repository</th>
                      <th className="p-2">Branch</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {selectedUserDetail.syncLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 text-xs">No syncs recorded yet.</td>
                      </tr>
                    ) : (
                      selectedUserDetail.syncLogs.map((log: any) => (
                        <tr key={log.id}>
                          <td className="p-2 font-mono text-white">{log.repoFullName}</td>
                          <td className="p-2 font-mono">{log.branch}</td>
                          <td className="p-2">
                            <span className="text-emerald-400 font-bold">{log.status}</span>
                          </td>
                          <td className="p-2 text-slate-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
