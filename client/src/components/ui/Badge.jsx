import React from 'react';
import { clsx } from 'clsx';

const variants = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-cyan-100 text-cyan-700',
  purple: 'bg-purple-100 text-purple-700',
};

const Badge = ({ variant = 'default', children, className, dot }) => (
  <span className={clsx('badge', variants[variant], className)}>
    {dot && <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0', {
      'bg-slate-500': variant === 'default', 'bg-emerald-500': variant === 'success',
      'bg-amber-500': variant === 'warning', 'bg-red-500': variant === 'danger',
      'bg-primary-600': variant === 'primary', 'bg-cyan-500': variant === 'info'
    })} />}
    {children}
  </span>
);

export default Badge;
