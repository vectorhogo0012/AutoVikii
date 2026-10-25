import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label = 'در حال بارگذاری...',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div
      role="status"
      className={cn('flex flex-col items-center justify-center gap-2 p-4 text-emerald-600 dark:text-emerald-400', className)}
    >
      <Loader2 className={cn('animate-spin', sizes[size])} />
      {label && (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {label}
        </span>
      )}
      <span className="sr-only">بارگذاری</span>
    </div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  rounded = 'md',
  ...props
}) => {
  const roundedClasses = {
    sm: 'rounded-md',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200/80 dark:bg-emerald-950/40',
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  );
};
