import React, { useState } from 'react';
import { AdminAuditLog } from '../../types';
import { ShieldCheck, Search, FileText, Calendar, Filter } from 'lucide-react';

interface AdminAuditLogsTabProps {
  logs: AdminAuditLog[];
}

export const AdminAuditLogsTab: React.FC<AdminAuditLogsTabProps> = ({ logs }) => {
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(l => 
    l.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.target.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Administrative Audit Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable audit trail recording all administrative overrides, plan changes, user suspensions, and setting updates.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Admin Account</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    No audit records match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="p-3.5 font-bold text-white">
                      {log.adminEmail}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        log.action.includes('SUSPEND') ? 'bg-red-950 text-red-300 border-red-800' :
                        log.action.includes('OVERRIDE') ? 'bg-purple-950 text-purple-300 border-purple-800' :
                        log.action.includes('PLAN') ? 'bg-blue-950 text-blue-300 border-blue-800' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-200">
                      {log.target}
                    </td>

                    <td className="p-3.5 text-slate-400 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
