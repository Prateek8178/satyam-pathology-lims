import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!roles || roles.includes(user?.role)) return children;
  return <Navigate to="/dashboard" replace />;
};

export default RoleRoute;
