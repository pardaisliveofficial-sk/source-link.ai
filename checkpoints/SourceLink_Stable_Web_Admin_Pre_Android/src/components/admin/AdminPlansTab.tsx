import React, { useState } from 'react';
import { PlanConfig } from '../../types';
import { Plus, Edit, Check, Shield, Sparkles, X, ToggleLeft, ToggleRight, Layers } from 'lucide-react';

interface AdminPlansTabProps {
  plans: PlanConfig[];
  token: string;
  onRefresh: () => void;
}

export const AdminPlansTab: React.FC<AdminPlansTabProps> = ({ plans, token, onRefresh }) => {
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<PlanConfig>({
    id: 'custom_plan',
    name: '',
    price: '$29',
    monthlyPrice: 29,
    yearlyPrice: 290,
    syncsPerMonth: 500,
    maxZipSizeMb: 150,
    reposLimit: 100,
    storageLimitMb: 5000,
    features: ['500 Sync Operations / month', '150MB ZIP upload limit', 'Priority Diff Engine'],
    popular: false,
    description: '',
    badge: 'Pro',
    enabled: true,
    visibility: 'public'
  });

  const [featureInput, setFeatureInput] = useState('');

  const handleOpenEdit = (plan: PlanConfig) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      id: 'plan_' + Date.now().toString(36),
      name: '',
      price: '$29',
      monthlyPrice: 29,
      yearlyPrice: 290,
      syncsPerMonth: 500,
      maxZipSizeMb: 150,
      reposLimit: 100,
      storageLimitMb: 5000,
      features: ['500 Syncs / month', '150MB ZIP Upload'],
      popular: false,
      description: 'Custom SaaS Plan',
      badge: 'Custom',
      enabled: true,
      visibility: 'public'
    });
    setIsCreating(true);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, featureInput.trim()]
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isCreating ? '/api/admin/plans' : `/api/admin/plans/${formData.id}`;
      const method = isCreating ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan configuration.');

      alert(`Plan ${formData.name} saved successfully.`);
      setEditingPlan(null);
      setIsCreating(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error saving plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlanEnabled = async (plan: PlanConfig) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !plan.enabled })
      });

      if (res.ok) onRefresh();
    } catch (err) {
      alert('Failed to update plan status.');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>SaaS Plan Configuration & Entitlements</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure subscription tiers, pricing, monthly sync limits, ZIP file size limits, and feature access.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create New SaaS Plan</span>
        </button>
      </div>

      {/* Plans List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`p-6 rounded-2xl bg-slate-900 border transition relative flex flex-col justify-between ${
              p.enabled ? 'border-slate-800' : 'border-red-900/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  {p.popular && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold">
                      Recommended
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleTogglePlanEnabled(p)}
                  title={p.enabled ? 'Disable Plan' : 'Enable Plan'}
                  className="cursor-pointer"
                >
                  {p.enabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-600" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 min-h-[32px]">{p.description}</p>

              <div className="mt-4 text-3xl font-extrabold text-white font-mono">
                {p.price} <span className="text-xs text-slate-400 font-normal">/ month</span>
              </div>

              <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Monthly Syncs:</span>
                  <span className="font-bold font-mono text-white">{p.syncsPerMonth >= 9999 ? 'Unlimited' : p.syncsPerMonth}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Max ZIP Size:</span>
                  <span className="font-bold font-mono text-white">{p.maxZipSizeMb} MB</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Repos Limit:</span>
                  <span className="font-bold font-mono text-white">{p.reposLimit >= 999 ? 'Unlimited' : p.reposLimit}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">Entitled Features</div>
                <ul className="space-y-1 text-xs text-slate-300">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => handleOpenEdit(p)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Plan Configuration</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Edit or Create Plan */}
      {(editingPlan || isCreating) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative">
            <button
              onClick={() => { setEditingPlan(null); setIsCreating(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">
              {isCreating ? 'Create SaaS Plan Tier' : `Edit Plan: ${formData.name}`}
            </h3>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Plan Key ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!isCreating}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price Text</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="$19"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Monthly ($)</label>
                  <input
                    type="number"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Yearly ($)</label>
                  <input
                    type="number"
                    value={formData.yearlyPrice}
                    onChange={(e) => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Syncs / Month</label>
                  <input
                    type="number"
                    value={formData.syncsPerMonth}
                    onChange={(e) => setFormData({ ...formData, syncsPerMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max ZIP Size (MB)</label>
                  <input
                    type="number"
                    value={formData.maxZipSizeMb}
                    onChange={(e) => setFormData({ ...formData, maxZipSizeMb: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Repos Limit</label>
                  <input
                    type="number"
                    value={formData.reposLimit}
                    onChange={(e) => setFormData({ ...formData, reposLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              {/* Feature List Management */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-300">Feature Entitlements</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="e.g. Advanced Diff Inspector"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 max-h-32 overflow-y-auto">
                  {formData.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                      <span className="text-slate-200">{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-red-400 hover:text-red-300 font-bold ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="rounded"
                  />
                  <span>Mark as Recommended</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded"
                  />
                  <span>Enable Plan</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingPlan(null); setIsCreating(false); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  {saving ? 'Saving Plan...' : 'Save Configuration'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
