import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  isClearable?: boolean;
  onClear?: () => void;
  isNumericEnglish?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      prefixIcon,
      suffixIcon,
      isClearable = false,
      onClear,
      value,
      onChange,
      id,
      disabled,
      isNumericEnglish = false,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="w-full flex flex-col gap-1.5 text-right">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 select-none"
          >
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {prefixIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={cn(
              'w-full min-h-[44px] h-11 px-3.5 text-sm rounded-xl transition-all duration-150',
              'bg-white dark:bg-[#111e17] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'border border-slate-200 dark:border-emerald-900/40',
              'focus:border-emerald-600 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20',
              'disabled:bg-slate-100 dark:disabled:bg-slate-900/40 disabled:cursor-not-allowed disabled:opacity-60',
              prefixIcon ? 'pr-10' : 'pr-3.5',
              (suffixIcon || (isClearable && hasValue)) ? 'pl-10' : 'pl-3.5',
              error && 'border-rose-500 dark:border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/20',
              isNumericEnglish && 'font-latin-num',
              className
            )}
            {...props}
          />

          <div className="absolute left-3 flex items-center gap-1.5">
            {isClearable && hasValue && !disabled && (
              <button
                type="button"
                onClick={onClear}
                aria-label="پاک کردن مقدار"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {suffixIcon && (
              <div className="pointer-events-none text-slate-400 dark:text-slate-500">
                {suffixIcon}
              </div>
            )}
          </div>
        </div>

        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
