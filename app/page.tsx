import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TodoApp } from '@/components/todo-app';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="page-wrap mx-auto flex min-h-screen max-w-2xl items-center justify-center p-6">
        <section className="glass-card card-hover w-full p-8 text-center sm:p-10">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-200/90">Todo Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Todo MVP</h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-200/85 sm:text-base">
            登录后管理你的任务，体验更轻盈、现代的待办流程。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="gradient-btn text-center">
              Login
            </Link>
            <Link href="/register" className="ghost-btn text-center">
              Register
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <TodoApp userEmail={session.user.email} />;
}
