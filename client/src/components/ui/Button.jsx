import React from 'react';
import { clsx } from 'clsx';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  success: 'btn-success',
  ghost: 'inline-flex items-center gap-2 px-4 py-2 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: '',
  lg: 'px-6 py-3 text-base',
};

const Button = ({ variant = 'primary', size = 'md', children, className, loading, ...props }) => (
  <button
    className={clsx(variants[variant], size !== 'md' && sizes[size], className)}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
    {children}
  </button>
);

export default Button;
