import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from './useAuth';
import { setLoginRedirect } from '@/lib/auth';

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // Store intended destination
      setLoginRedirect(window.location.pathname);
      // Redirect to login
      navigate({ to: '/login' });
    }
  }, [user, loading, navigate]);

  return { user, loading };
}
