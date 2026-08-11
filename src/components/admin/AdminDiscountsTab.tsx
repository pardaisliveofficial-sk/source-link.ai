import React, { useState } from 'react';
import { DiscountCoupon } from '../../types';
import { Tag, Plus, ToggleLeft, ToggleRight, Check, X, Calendar, Percent } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface AdminDiscountsTabProps {
  discounts: DiscountCoupon[];
  token: string;
  onRefresh: () => void;
}

export const AdminDiscountsTab: React.FC<AdminDiscountsTabProps> = ({ discounts, token, onRefresh }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<DiscountCoupon>>({
    code: 'SAVE20',
    discountType: 'percentage',
    amount: 20,
    applicablePlans: ['pro', 'business'],
    startDate: new Date().toISOString().substring(0, 10),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
    usageLimit: 100,
    enabled: true,
    description: '20% Off Pro & Business Plans'
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await apiFetch('/api/admin/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create discount.');

      alert(`Coupon ${formData.code} created successfully!`);
      setIsCreating(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error creating coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCoupon = async (coupon: DiscountCoupon) => {
    try {
      const res = await apiFetch(`/api/admin/discounts/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !coupon.enabled })
      });


      if (res.ok) onRefresh();
    } catch (err) {
      alert('Failed to update coupon status.');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            <span>Discounts, Coupons & Promo Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create percentage or fixed price promotional discount codes for subscription plans.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Coupon Code</th>
                <th className="p-3.5">Discount Amount</th>
                <th className="p-3.5">Applicable Plans</th>
                <th className="p-3.5">Usage / Limit</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No promo codes active yet.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold font-mono text-white text-xs">
                      <span className="px-2 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded-lg">
                        {d.code}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-white font-mono">
                      {d.discountType === 'percentage' ? `${d.amount}% OFF` : `$${d.amount} OFF`}
                    </td>

                    <td className="p-3.5">
                      <div className="flex gap-1">
                        {d.applicablePlans.map((pl) => (
                          <span key={pl} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] uppercase font-bold">
                            {pl}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="text-white font-bold">{d.timesUsed}</span> / {d.usageLimit || '∞'}
                    </td>

                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(d.expiryDate).toLocaleDateString()}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.enabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {d.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleCoupon(d)}
                        className="cursor-pointer"
                        title={d.enabled ? 'Disable Coupon' : 'Enable Coupon'}
                      >
                        {d.enabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-600" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create Coupon */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Create Promo Coupon Code</h3>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="PROMO20"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e: any) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={String(formData.expiryDate)}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
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
                  placeholder="e.g. Special launch discount"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
