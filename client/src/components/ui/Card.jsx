import React from 'react';
import { clsx } from 'clsx';

export const Card = ({ children, className, ...props }) => (
  <div className={clsx('card', className)} {...props}>{children}</div>
);

export const CardHeader = ({ children, className }) => (
  <div className={clsx('flex items-center justify-between mb-5', className)}>{children}</div>
);

export const CardTitle = ({ children }) => (
  <h3 className="text-base font-semibold text-slate-900">{children}</h3>
);

export default Card;
