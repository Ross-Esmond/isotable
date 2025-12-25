import type { AuthError, Session, User } from '@supabase/supabase-js';

export type { User, Session, AuthError };

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  updateEmail: (newEmail: string) => Promise<AuthResult>;
  resendVerification: () => Promise<AuthResult>;
}
