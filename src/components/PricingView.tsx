import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Lock } from 'lucide-react';
import { User, PlanConfig } from '../types';
import { apiFetch } from '../lib/api';

interface PricingViewProps {
  user: User | null;
  onUpgradeSuccess: (updatedUser: User) => void;
  onBackToApp: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ user, onUpgradeSuccess, onBackToApp }) => {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentPlan = user?.plan || 'free';

  useEffect(() => {
    apiFetch('/api/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.plans) {
          setPlans(data.plans.filter((p: PlanConfig) => p.enabled));
        }
      })
      .catch((err) => console.error('Failed to fetch public plans:', err))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      alert('Please sign in or create an account first to choose a subscription plan.');
      return;
    }

    setLoadingPlan(planId);
    setSuccessMsg(null);

    try {
      const res = await apiFetch('/api/user/plan/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, newPlan: planId })
      });


      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upgrade failed.');

      setSuccessMsg(data.message || `Plan successfully updated to ${planId.toUpperCase()}!`);
      if (data.user) {
        onUpgradeSuccess(data.user);
      }
    } catch (err: any) {
      alert(err.message || 'Subscription plan upgrade failed.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <button
            onClick={onBackToApp}
            className="mb-4 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            ← Back to SourceLink Workspace
          </button>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            SaaS Subscription & Pricing Plans
          </h1>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Choose the right plan for your workflow. Managed dynamically via the SourceLink.ai Admin Console.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-400 underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Dynamic Plans Grid */}
        {loadingPlans ? (
          <div className="text-center py-12 text-slate-400 text-xs font-mono">Loading active SaaS plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((p) => {
              const isCurrent = currentPlan === p.id;
              const isRec = p.popular;

              return (
                <div
                  key={p.id}
                  className={`p-6 sm:p-8 rounded-2xl bg-slate-950 border transition-all flex flex-col justify-between relative ${
                    isRec ? 'border-blue-500 ring-2 ring-blue-500/30 bg-gradient-to-b from-blue-950/50 to-slate-950' : 'border-slate-800'
                  }`}
                >
                  {isRec && (
                    <div className="absolute -top-3.5 right-6 px-3 py-1 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Recommended
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">{p.name}</h3>
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                          Current Plan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description}</p>
                    
                    <div className="mt-6 text-4xl font-extrabold text-white font-mono">
                      {p.price} <span className="text-xs font-normal text-slate-400">/ month</span>
                    </div>

                    <div className="mt-8 border-t border-slate-800 pt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Included Features</h4>
                      <ul className="space-y-3 text-xs text-slate-300">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    disabled={isCurrent || loadingPlan === p.id}
                    onClick={() => handleSelectPlan(p.id)}
                    className={`mt-8 w-full py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : isRec
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {loadingPlan === p.id ? 'Updating Plan...' : isCurrent ? 'Current Active Plan' : `Select ${p.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Modular Integration Note */}
        <div className="mt-16 text-center max-w-2xl mx-auto p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-center gap-3">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Payment architecture is modularly wired to backend API endpoints and synchronized with the Admin System.</span>
        </div>

      </div>
    </div>
  );
};
