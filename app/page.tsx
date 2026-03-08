import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TodoApp } from '@/components/todo-app';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-3xl font-bold">Todo MVP</h1>
        <p className="text-slate-600">Please login or register to manage your todos.</p>
        <div className="flex gap-3">
          <Link href="/login" className="rounded bg-blue-600 px-4 py-2 text-white">
            Login
          </Link>
          <Link href="/register" className="rounded bg-slate-900 px-4 py-2 text-white">
            Register
          </Link>
        </div>
      </main>
    );
  }

  return <TodoApp userEmail={session.user.email} />;
}
