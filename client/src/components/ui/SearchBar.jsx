import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ value, onChange, placeholder = 'Search...', className }) => (
  <div className={`relative ${className}`}>
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="input-field pl-9" />
  </div>
);

export default SearchBar;
