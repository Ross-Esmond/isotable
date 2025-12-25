import { Link, createFileRoute } from '@tanstack/react-router';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { LoginForm } from '@/components/forms/LoginForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const Route = createFileRoute('/login')({ component: Login });

function Login() {
  useAuthRedirect(); // Redirect if already authenticated

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
