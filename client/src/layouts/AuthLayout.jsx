import React from 'react';
import { Outlet } from 'react-router-dom';
import { BeakerIcon } from '@heroicons/react/24/outline';

const AuthLayout = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <BeakerIcon className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">PathLab LIMS</h1>
        <p className="text-slate-400 text-sm mt-1">Laboratory Information Management System</p>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <Outlet />
      </div>
      <p className="text-center text-slate-500 text-xs mt-6">© 2026 PathLab Diagnostics. All rights reserved.</p>
    </div>
  </div>
);

export default AuthLayout;
