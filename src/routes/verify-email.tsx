import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/verify-email')({ component: VerifyEmail });

function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();
  const { resendVerification } = useAuth();
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Check if there's a token in the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      setStatus('success');
      // Redirect to surface after 2 seconds
      setTimeout(() => {
        navigate({ to: '/surface' });
      }, 2000);
    } else {
      setStatus('error');
    }
  }, [navigate]);

  const handleResend = async () => {
    setResending(true);
    await resendVerification();
    setResending(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            </div>
          )}

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Email verified successfully! Redirecting you to the app...
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Invalid or expired verification link. Please try again or
                  request a new verification email.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleResend}
                disabled={resending}
                className="w-full"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
