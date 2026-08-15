import React from 'react';
import { clsx } from 'clsx';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, onClick }) => {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-600' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-600' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', text: 'text-cyan-600' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={clsx('stat-card', onClick && 'cursor-pointer hover:shadow-md transition-shadow')} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value ?? 0}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
            <Icon className={clsx('w-6 h-6', c.icon)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
