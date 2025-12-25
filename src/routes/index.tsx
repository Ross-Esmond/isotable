import { createFileRoute } from '@tanstack/react-router';
import { AuthHeader } from '@/components/auth/AuthHeader';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h1 className="text-2xl font-bold">Isotable</h1>
        <AuthHeader />
      </header>
    </div>
  );
}
