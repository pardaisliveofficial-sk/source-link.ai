import React from 'react';
import { User, CheckCircle, Circle, ChevronRight } from 'lucide-react';

interface MobileWorkflowBarProps {
  hasUser: boolean;
  hasToken: boolean;
  hasZip: boolean;
  hasRepo: boolean;
  hasDiffs: boolean;
  activeStep: number;
  onSelectStep: (step: number) => void;
}

export const MobileWorkflowBar: React.FC<MobileWorkflowBarProps> = ({
  hasUser,
  hasToken,
  hasZip,
  hasRepo,
  hasDiffs,
  activeStep,
  onSelectStep
}) => {
  const steps = [
    { id: 1, name: 'Account', done: hasUser },
    { id: 2, name: 'GitHub', done: hasToken },
    { id: 3, name: 'ZIP', done: hasZip },
    { id: 4, name: 'Repo & Branch', done: hasRepo },
    { id: 5, name: 'Delta Diff', done: hasDiffs },
    { id: 6, name: 'Push', done: false }
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 text-xs overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1">
      {steps.map((step, idx) => {
        const isCurrent = activeStep === step.id;
        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-xs'
                  : step.done
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {step.done ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span>{step.name}</span>
            </button>
            {idx < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
