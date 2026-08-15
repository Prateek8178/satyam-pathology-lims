import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Select = forwardRef(({ label, error, options = [], placeholder, className, required, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <select ref={ref} className={clsx('select-field', error && 'border-red-400', className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

Select.displayName = 'Select';
export default Select;
