import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({ label, error, className, required, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <input ref={ref} className={clsx('input-field', error && 'border-red-400 focus:ring-red-400', className)} {...props} />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
