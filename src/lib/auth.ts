import type { AuthError } from '@/types/auth';

const ERROR_MESSAGES: Record<string, string> = {
  user_already_exists: 'An account with this email already exists',
  invalid_credentials: 'Invalid email or password',
  email_not_confirmed: 'Please verify your email before signing in',
  weak_password: 'Password is too weak. Please use a stronger password',
  same_password: 'New password must be different from current password',
  invalid_grant: 'Invalid email or password',
  email_exists: 'An account with this email already exists',
  over_email_send_rate_limit:
    'Too many emails sent. Please wait a few minutes before trying again',
  validation_failed: 'Validation failed. Please check your input',
  user_not_found: 'User not found',
  invalid_password: 'Invalid password',
};

export function parseAuthError(error: AuthError | Error | null): string {
  if (!error) return 'An unexpected error occurred';

  // Check if it's a Supabase AuthError with a code
  if ('code' in error && error.code) {
    return ERROR_MESSAGES[error.code] || error.message;
  }

  // Check if it's a regular error with a message
  if ('message' in error && error.message) {
    // Try to extract error code from message
    const lowerMessage = error.message.toLowerCase();
    for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
      if (lowerMessage.includes(code.replace(/_/g, ' '))) {
        return message;
      }
    }
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: Array<string>;
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: Array<string> = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Login redirect management
const REDIRECT_KEY = 'auth_redirect';

export function setLoginRedirect(path: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(REDIRECT_KEY, path);
  }
}

export function getLoginRedirect(): string {
  if (typeof window !== 'undefined') {
    const redirect = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    return redirect || '/surface';
  }
  return '/surface';
}

export function clearLoginRedirect(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(REDIRECT_KEY);
  }
}
