import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({ page, pages, total, limit, onPageChange }) => {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white rounded-b-xl">
      <p className="text-sm text-slate-600">
        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} results
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                p === page ? 'bg-primary-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= pages} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
