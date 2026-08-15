import React from 'react';

export const Table = ({ children, className }) => (
  <div className="overflow-x-auto">
    <table className={`min-w-full divide-y divide-slate-200 ${className}`}>{children}</table>
  </div>
);

export const Thead = ({ children }) => <thead className="bg-slate-50">{children}</thead>;
export const Tbody = ({ children }) => <tbody className="bg-white divide-y divide-slate-100">{children}</tbody>;
export const Th = ({ children, className }) => <th className={`table-th ${className}`}>{children}</th>;
export const Td = ({ children, className }) => <td className={`table-td ${className}`}>{children}</td>;
export const Tr = ({ children, className, onClick }) => (
  <tr className={`table-tr ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>{children}</tr>
);
