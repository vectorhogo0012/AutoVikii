/**
 * Visual Design Tokens for Persian Vehicle Inspection PWA
 * Green & White Refined Aesthetic with Complete Dark Theme
 */

export const DESIGN_TOKENS = {
  colors: {
    brand: {
      light: '#059669', // Emerald 600
      dark: '#10b981',  // Emerald 500
      accentLight: '#10b981',
      accentDark: '#34d399',
      borderSubtleLight: '#e2e8f0',
      borderSubtleDark: '#1e3127',
    },
    status: {
      success: {
        bgLight: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        bgDark: 'dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
      },
      warning: {
        bgLight: 'bg-amber-50 text-amber-800 border-amber-200',
        bgDark: 'dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
      },
      danger: {
        bgLight: 'bg-rose-50 text-rose-800 border-rose-200',
        bgDark: 'dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
      },
      info: {
        bgLight: 'bg-sky-50 text-sky-800 border-sky-200',
        bgDark: 'dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
      },
      neutral: {
        bgLight: 'bg-slate-100 text-slate-700 border-slate-200',
        bgDark: 'dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60',
      },
    },
  },
  touchTarget: {
    minHeight: 'min-h-[44px]',
    minWidth: 'min-w-[44px]',
  },
  radii: {
    card: 'rounded-2xl',
    button: 'rounded-xl',
    chip: 'rounded-full',
    input: 'rounded-xl',
    modal: 'rounded-3xl',
  },
  typography: {
    fontFamily: "var(--font-sans)",
  },
} as const;
