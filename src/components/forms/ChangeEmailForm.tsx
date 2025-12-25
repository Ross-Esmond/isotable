import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthErrorDisplay } from '@/components/auth/AuthErrorDisplay';

export function ChangeEmailForm() {
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, updateEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newEmail === user?.email) {
      setError('New email must be different from current email');
      return;
    }

    setLoading(true);

    const result = await updateEmail(newEmail);

    if (result.success) {
      setSuccess(
        'A confirmation email has been sent to your new email address. Please check your inbox to complete the change.',
      );
      setNewEmail('');
    } else {
      setError(result.error || 'Failed to update email');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthErrorDisplay error={error} success={success} />

      <div className="space-y-2">
        <Label htmlFor="currentEmail">Current Email</Label>
        <Input
          id="currentEmail"
          type="email"
          value={user?.email || ''}
          disabled
          className="bg-slate-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newEmail">New Email</Label>
        <Input
          id="newEmail"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="newemail@example.com"
        />
        <p className="text-sm text-slate-500">
          You'll need to verify your new email address before the change takes
          effect
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending confirmation...' : 'Change Email'}
      </Button>
    </form>
  );
}
