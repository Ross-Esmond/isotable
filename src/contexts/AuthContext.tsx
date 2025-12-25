import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import supabase from '@/lib/supabase';
import { parseAuthError } from '@/lib/auth';
import type { AuthContextValue, AuthResult, User, Session } from '@/types/auth';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        return { success: false, error: parseAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: parseAuthError(error as Error),
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: parseAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: parseAuthError(error as Error),
      };
    }
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: parseAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: parseAuthError(error as Error),
      };
    }
  };

  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: parseAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: parseAuthError(error as Error),
      };
    }
  };

  const updateEmail = async (newEmail: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        {
          emailRedirectTo: `${window.location.origin}/account`,
        },
      );

      if (error) {
        return { success: false, error: parseAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: parseAuthError(error as Error),
      };
    }
  };

  const resendVerification = async (): Promise<AuthResult> => {
    if (!user?.email) {
      return { success: false, error: 'No email found' };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        return { success: false, error: parseAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: parseAuthError(error as Error),
      };
    }
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
