'use client';

import { FormEvent, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

type Todo = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  category: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

const CATEGORY_OPTIONS = [
  { value: 'work', label: '工作', badgeClass: 'bg-blue-100 text-blue-700' },
  { value: 'life', label: '生活', badgeClass: 'bg-emerald-100 text-emerald-700' },
  { value: 'study', label: '学习', badgeClass: 'bg-indigo-100 text-indigo-700' },
  { value: 'other', label: '其他', badgeClass: 'bg-slate-200 text-slate-700' }
] as const;

function toDateInputValue(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(input: string) {
  if (!input) return null;
  return new Date(input).toISOString();
}

function getCategoryMeta(category: string | null) {
  return CATEGORY_OPTIONS.find((item) => item.value === category) ?? CATEGORY_OPTIONS[3];
}

function getDueDateTone(dueDate: string | null) {
  if (!dueDate) return 'text-slate-500';
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  if (due < now) return 'text-red-600';
  if (due - now <= 1000 * 60 * 60 * 48) return 'text-orange-600';
  return 'text-slate-500';
}

type Props = {
  userEmail?: string | null;
};

export function TodoApp({ userEmail }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]['value']>('other');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCategory, setEditCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]['value']>('other');
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
      body: JSON.stringify({
        title,
        description: description || null,
        due_date: toIsoDateTime(dueDate),
        category
      })
    });

    if (!res.ok) {
      setError('Failed to create todo');
      return;
    }

    setTitle('');
    setDescription('');
    setDueDate('');
    setCategory('other');
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

  function beginEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? '');
    setEditDueDate(toDateInputValue(todo.due_date));
    setEditCategory((todo.category as (typeof CATEGORY_OPTIONS)[number]['value']) || 'other');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditDueDate('');
    setEditCategory('other');
  }

  async function saveEdit(todo: Todo) {
    if (!editTitle.trim()) return;

    const res = await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription || null,
        due_date: toIsoDateTime(editDueDate),
        category: editCategory
      })
    });

    if (!res.ok) {
      setError('Failed to save todo');
      return;
    }

    cancelEdit();
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
    <main className="mx-auto min-h-screen w-full max-w-3xl p-4 sm:p-6">
      <div className="mb-6 rounded-2xl bg-white/95 p-5 shadow-lg ring-1 ring-slate-200 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Todo App V1.1</h1>
            <p className="text-sm text-slate-500">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="mb-6 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 sm:p-6"
      >
        <p className="mb-4 text-sm font-medium text-slate-500">新建待办</p>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="待办标题"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述（可选）"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            rows={3}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof CATEGORY_OPTIONS)[number]['value'])
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <button className="w-full rounded-lg bg-blue-600 px-3 py-2 font-medium text-white transition hover:bg-blue-700 sm:w-auto">
            创建
          </button>
        </div>
      </form>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : todos.length === 0 ? (
        <p className="rounded-xl bg-white/95 p-4 text-slate-500 shadow ring-1 ring-slate-200">
          No todos yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => {
            const categoryMeta = getCategoryMeta(todo.category);
            const dueTone = getDueDateTone(todo.due_date);
            const isEditing = editingId === todo.id;

            return (
              <li
                key={todo.id}
                onClick={() => !isEditing && beginEdit(todo)}
                className="cursor-pointer rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 transition hover:ring-blue-200 sm:p-5"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      rows={3}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="datetime-local"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <select
                        value={editCategory}
                        onChange={(e) =>
                          setEditCategory(e.target.value as (typeof CATEGORY_OPTIONS)[number]['value'])
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {CATEGORY_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void saveEdit(todo);
                        }}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-300"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${categoryMeta.badgeClass}`}
                        >
                          {categoryMeta.label}
                        </span>
                        {todo.due_date && (
                          <span className={`text-xs font-medium ${dueTone}`}>
                            截止：{new Date(todo.due_date).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-medium ${todo.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}
                      >
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p className="mt-1 text-sm text-slate-600">{todo.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleCompleted(todo);
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white transition hover:bg-emerald-700"
                      >
                        {todo.completed ? 'Undo' : 'Done'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteTodo(todo.id);
                        }}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
