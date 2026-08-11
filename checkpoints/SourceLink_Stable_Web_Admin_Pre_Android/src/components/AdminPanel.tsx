import React, { useEffect, useState } from 'react';
import { Users, Database, Shield, RefreshCw } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [totalSyncs, setTotalSyncs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalSyncs(data.totalSyncs || 0);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl max-w-6xl mx-auto my-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <Shield className="w-5 h-5 text-purple-400" />
          <span>SaaS Admin & User Usage Dashboard</span>
        </div>
        <button
          onClick={fetchAdminData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-400" /> Total Users</div>
          <div className="text-2xl font-extrabold text-white mt-2">{users.length}</div>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 flex items-center gap-1.5"><Database className="w-4 h-4 text-emerald-400" /> Total Syncs Executed</div>
          <div className="text-2xl font-extrabold text-white mt-2">{totalSyncs}</div>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 flex items-center gap-1.5"><Shield className="w-4 h-4 text-purple-400" /> Active System Status</div>
          <div className="text-sm font-bold text-emerald-400 mt-2">Operational (100% SLA)</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Email</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Syncs Used</th>
              <th className="p-3">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/50">
                <td className="p-3 font-semibold text-white">{u.name}</td>
                <td className="p-3 font-mono text-slate-400">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.plan === 'business' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    u.plan === 'pro' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {u.plan}
                  </span>
                </td>
                <td className="p-3 font-mono">{u.syncsCount} / {u.maxSyncs}</td>
                <td className="p-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
