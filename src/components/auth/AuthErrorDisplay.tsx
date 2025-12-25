import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AuthErrorDisplayProps {
  error?: string | null;
  success?: string | null;
}

export function AuthErrorDisplay({ error, success }: AuthErrorDisplayProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-900">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>{success}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
