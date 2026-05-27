import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'can_bo';
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const cached = React.useMemo(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const effectiveUser = user || cached;

  if (loading && !effectiveUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!effectiveUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && effectiveUser.role !== requiredRole) {
    return <Navigate to={effectiveUser.role === 'admin' ? '/admin' : '/can-bo'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
