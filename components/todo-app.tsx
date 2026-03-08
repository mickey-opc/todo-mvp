'use client';

import { FormEvent, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

type Todo = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  userEmail?: string | null;
};

export function TodoApp({ userEmail }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTodos() {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/todos');
    if (!res.ok) {
      setError('Failed to load todos');
      setLoading(false);
      return;
    }

    const data = await res.json();
    setTodos(data.todos ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadTodos();
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;

    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null })
    });

    if (!res.ok) {
      setError('Failed to create todo');
      return;
    }

    setTitle('');
    setDescription('');
    await loadTodos();
  }

  async function toggleCompleted(todo: Todo) {
    const res = await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed })
    });

    if (!res.ok) {
      setError('Failed to update todo');
      return;
    }

    await loadTodos();
  }

  async function deleteTodo(id: string) {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      setError('Failed to delete todo');
      return;
    }

    await loadTodos();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Todo MVP</h1>
          <p className="text-sm text-slate-600">{userEmail}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
        >
          Logout
        </button>
      </div>

      <form
        onSubmit={handleCreate}
        className="mb-6 space-y-3 rounded border border-slate-200 bg-white p-4"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Todo title"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded border border-slate-300 px-3 py-2"
          rows={3}
        />
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Create</button>
      </form>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : todos.length === 0 ? (
        <p className="text-slate-600">No todos yet.</p>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-start justify-between rounded border border-slate-200 bg-white p-4"
            >
              <div>
                <p className={`font-medium ${todo.completed ? 'line-through text-slate-400' : ''}`}>
                  {todo.title}
                </p>
                {todo.description && (
                  <p className="mt-1 text-sm text-slate-600">{todo.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleCompleted(todo)}
                  className="rounded bg-emerald-600 px-3 py-1 text-sm text-white"
                >
                  {todo.completed ? 'Undo' : 'Done'}
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
