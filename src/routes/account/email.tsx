import { createFileRoute, Link } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChangeEmailForm } from '@/components/forms/ChangeEmailForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/account/email')({ component: ChangeEmail });

function ChangeEmail() {
  return (
    <ProtectedRoute>
      <ChangeEmailContent />
    </ProtectedRoute>
  );
}

function ChangeEmailContent() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/account">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Account
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Change Email</h1>
          <p className="text-slate-600">Update your email address</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Email Address</CardTitle>
            <CardDescription>
              You'll receive a confirmation email at your new address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangeEmailForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
