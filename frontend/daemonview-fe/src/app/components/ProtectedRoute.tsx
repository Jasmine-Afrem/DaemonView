'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: 'admin';
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading) {
      if (!auth.user) {
        router.push('/login');
      } 
      else if (role && auth.user.role !== role) {
        router.push('/dashboard'); // Redirect to homepage or a 'permission-denied' page
      }
    }
  }, [auth.user, auth.loading, router, role]);

  if (auth.loading || !auth.user) {
    return <div>Loading...</div>; // Or a full-page spinner component
  }

  if (role && auth.user.role !== role) {
    return <div>Loading...</div>;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;