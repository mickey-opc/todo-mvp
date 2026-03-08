'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (!result || result.error) {
      setError('Invalid email or password');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main className="page-wrap mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="glass-card card-hover w-full space-y-4 p-7 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/90">Account Access</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Login</h1>
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="soft-input"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="soft-input"
        />
        {error && <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p>}
        <button disabled={loading} className="gradient-btn flex w-full items-center justify-center gap-2 disabled:opacity-70">
          {loading && <span className="loading-orb" />}
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="text-sm text-slate-200/90">
          No account?{' '}
          <Link href="/register" className="font-medium text-cyan-200 transition hover:text-cyan-100">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}
