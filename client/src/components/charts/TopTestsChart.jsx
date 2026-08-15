import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#1E40AF', '#0891B2', '#059669', '#D97706', '#DC2626'];

const TopTestsChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
      <Legend verticalAlign="bottom" height={36} iconType="circle" />
    </PieChart>
  </ResponsiveContainer>
);

export default TopTestsChart;
