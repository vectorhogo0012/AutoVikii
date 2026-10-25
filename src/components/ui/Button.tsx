import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants = {
      primary:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow-emerald-900/10 focus-visible:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 dark:font-semibold',
      secondary:
        'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 dark:hover:bg-emerald-900/60 dark:border dark:border-emerald-800/40 focus-visible:ring-emerald-500',
      accent:
        'bg-white text-emerald-950 hover:bg-emerald-50 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 font-bold shadow-md focus-visible:ring-emerald-400',
      outline:
        'border border-slate-300 dark:border-emerald-900/50 bg-white/70 dark:bg-[#111e17] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-emerald-950/40 focus-visible:ring-emerald-500',
      ghost:
        'bg-transparent hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 focus-visible:ring-emerald-500',
      destructive:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400 dark:text-rose-950',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-xs rounded-lg gap-1.5 min-h-[36px]',
      md: 'h-11 px-5 text-sm rounded-xl gap-2 min-h-[44px]',
      lg: 'h-12 px-6 text-base rounded-2xl gap-2.5 min-h-[48px]',
      icon: 'h-11 w-11 rounded-xl min-h-[44px] min-w-[44px] p-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
