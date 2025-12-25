import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import supabase from '@/lib/supabase';

// Generate anonymous ID for unauthenticated users
const getAnonymousId = (): string => {
  const stored = localStorage.getItem('isotable_anonymous_id');
  if (stored) return stored;

  const newId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('isotable_anonymous_id', newId);
  return newId;
};

export function usePlayspaceAccess(slug: string) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    setLoading(true);

    // Special case: default playspace always accessible
    if (slug === 'default') {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    try {
      // Try to read the playspace (RLS will enforce access)
      const { data, error } = await supabase
        .from('playspaces')
        .select('id')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Access check error:', error);
        setHasAccess(false);
      } else {
        setHasAccess(!!data);
      }
    } catch (err) {
      console.error('Access check failed:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const grantAccess = useCallback(async () => {
    const anonymousId = user ? null : getAnonymousId();

    try {
      // Call RPC to grant access
      const { data, error } = await supabase.rpc('grant_url_access', {
        p_slug: slug,
        p_anonymous_id: anonymousId,
      });

      if (error) {
        console.error('Grant access error:', error);
      } else if (data) {
        // Re-check access
        await checkAccess();
      }
    } catch (err) {
      console.error('Grant access failed:', err);
    }
  }, [slug, user, checkAccess]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { hasAccess, loading, grantAccess };
}
