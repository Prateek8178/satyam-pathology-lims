import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MonthlyRevenueChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
      <Bar dataKey="revenue" fill="#0891B2" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default MonthlyRevenueChart;
