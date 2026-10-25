import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
  variant?: 'emerald' | 'amber' | 'rose' | 'sky';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = true,
  variant = 'emerald',
  size = 'md',
  className,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const variants = {
    emerald: 'bg-emerald-600 dark:bg-emerald-400',
    amber: 'bg-amber-500 dark:bg-amber-400',
    rose: 'bg-rose-500 dark:bg-rose-400',
    sky: 'bg-sky-500 dark:bg-sky-400',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-latin-num">{clampedValue}%</span>}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden border border-slate-200/50 dark:border-emerald-950',
          heights[size]
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full transition-all duration-300 rounded-full', variants[variant])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

export interface StepIndicatorProps {
  steps: { id: string | number; label: string }[];
  currentStepIndex: number;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStepIndex,
  className,
}) => {
  return (
    <nav aria-label="مراحل" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <li
              key={step.id}
              className="flex-1 flex flex-col items-center relative group"
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-4 -left-1/2 w-full h-0.5 -z-0 transition-colors',
                    index < currentStepIndex
                      ? 'bg-emerald-500 dark:bg-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-800'
                  )}
                />
              )}

              {/* Step Circle */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-10 transition-all font-latin-num shadow-sm',
                  isCompleted
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                    : isCurrent
                    ? 'bg-white text-emerald-700 border-2 border-emerald-600 dark:bg-[#101e17] dark:text-emerald-300 dark:border-emerald-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : index + 1}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  'text-[11px] mt-1.5 font-medium text-center truncate max-w-[80px]',
                  isCurrent
                    ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                    : isCompleted
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
