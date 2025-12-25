import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlayspace = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Get the user's JWT token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in to create a playspace');
        setIsCreating(false);
        return;
      }

      // Call the Edge Function
      const { data, error: playspaceError } = await supabase.functions.invoke(
        'create-playspace',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (playspaceError) {
        throw new Error(playspaceError || 'Failed to create playspace');
      }

      const { playspace } = data as { playspace: { slug: string } };

      // Redirect to the new playspace
      navigate({ to: `/surface/$slug`, params: { slug: playspace.slug } });
    } catch (err) {
      console.error('Error creating playspace:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create playspace',
      );
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Isotable</h1>
        <AuthHeader />
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">
            Collaborative Canvas
          </h2>
          <p className="mb-8 text-lg text-slate-300">
            Create and share interactive playspaces with anyone
          </p>

          <div className="flex flex-col items-center gap-4">
            {user && (
              <button
                onClick={handleCreatePlayspace}
                disabled={isCreating}
                className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create New Playspace'}
              </button>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {!user && (
            <p className="mt-6 text-sm text-slate-400">
              Log in to create your own playspace
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
