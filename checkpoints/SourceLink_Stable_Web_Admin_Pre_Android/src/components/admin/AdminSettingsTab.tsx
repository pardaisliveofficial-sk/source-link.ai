import React, { useState } from 'react';
import { Settings, Shield, Server, Database, Activity, Check, Save } from 'lucide-react';

interface AdminSettingsTabProps {
  settings: any;
  admins: any[];
  token: string;
  onRefresh: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ settings, admins, token, onRefresh }) => {
  const [formData, setFormData] = useState({
    appName: settings?.appName || 'SourceLink.ai',
    supportEmail: settings?.supportEmail || 'support@sourcelink.ai',
    websiteUrl: settings?.websiteUrl || 'https://sourcelink.ai',
    defaultPlan: settings?.defaultPlan || 'free',
    trialDaysDefault: settings?.trialDaysDefault || 14
  });

  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings: formData })
      });

      if (res.ok) {
        alert('System settings updated successfully.');
        onRefresh();
      }
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>System Settings & Security Policies</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage general SaaS application variables, trial configurations, and view administrative account roles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General SaaS Settings */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <span>General SaaS Configuration</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Application Branding Name</label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Support Email Contact</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Website URL</label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Signup Plan</label>
                <select
                  value={formData.defaultPlan}
                  onChange={(e) => setFormData({ ...formData, defaultPlan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="free">FREE</option>
                  <option value="pro">PRO</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Trial (Days)</label>
                <input
                  type="number"
                  value={formData.trialDaysDefault}
                  onChange={(e) => setFormData({ ...formData, trialDaysDefault: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Admin Accounts List */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Administrative Accounts & Roles</span>
          </h3>

          <div className="space-y-3">
            {admins.map((adm) => (
              <div key={adm.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{adm.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{adm.email}</div>
                </div>

                <span className="px-2.5 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 rounded text-[10px] font-extrabold uppercase">
                  {adm.role}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-400 text-[11px] space-y-1">
            <div className="font-bold text-slate-300">Admin Privileges Support:</div>
            <div>• <strong>SUPER_ADMIN</strong>: Full system control, plans, user overrides, audit logs.</div>
            <div>• <strong>ADMIN</strong>: User management and plan overrides.</div>
            <div>• <strong>SUPPORT</strong>: Read-only profile view and sync logs.</div>
          </div>
        </div>

      </div>

    </div>
  );
};
