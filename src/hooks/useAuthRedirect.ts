import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from './useAuth';

/**
 * Hook to redirect authenticated users away from auth pages (login, signup)
 * to the surface or a stored redirect path
 */
export function useAuthRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // User is already authenticated, redirect them away
      navigate({ to: '/surface' });
    }
  }, [user, loading, navigate]);

  return { user, loading };
}
