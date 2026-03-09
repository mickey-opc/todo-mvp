'use client';

import { FormEvent, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

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
  { value: 'work', label: '工作', badgeClass: 'bg-blue-400/20 text-blue-100 ring-1 ring-blue-300/40' },
  {
    value: 'life',
    label: '生活',
    badgeClass: 'bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40'
  },
  {
    value: 'study',
    label: '学习',
    badgeClass: 'bg-indigo-400/20 text-indigo-100 ring-1 ring-indigo-300/40'
  },
  { value: 'other', label: '其他', badgeClass: 'bg-slate-300/20 text-slate-100 ring-1 ring-white/30' }
] as const;

const POMODORO_TIME = 25 * 60; // 25 minutes in seconds
const STORAGE_KEY = 'pomodoro-stats';

type PomodoroStats = {
  totalSessions: number;
  totalMinutes: number;
};

function loadStats(): PomodoroStats {
  if (typeof window === 'undefined') {
    return { totalSessions: 0, totalMinutes: 0 };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load pomodoro stats:', e);
  }
  return { totalSessions: 0, totalMinutes: 0 };
}

function saveStats(stats: PomodoroStats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save pomodoro stats:', e);
  }
}

// Play notification sound using Web Audio API
function playNotificationSound() {
  if (typeof window === 'undefined') return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play a pleasant chime sound
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
    oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2); // E6
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error('Failed to play notification sound:', e);
  }
}

// Vibrate the device
function vibrateDevice() {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  
  try {
    navigator.vibrate([200, 100, 200, 100, 200]);
  } catch (e) {
    console.error('Failed to vibrate:', e);
  }
}

// Trigger completion notification
function triggerNotification() {
  playNotificationSound();
  vibrateDevice();
}

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
  if (!dueDate) return 'text-slate-300 dark:text-slate-300';
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  if (due < now) return 'text-rose-500 dark:text-rose-200';
  if (due - now <= 1000 * 60 * 60 * 48) return 'text-amber-500 dark:text-amber-200';
  return 'text-cyan-500 dark:text-cyan-100';
}

type PomodoroState = {
  [todoId: string]: {
    remaining: number;
    isRunning: boolean;
    intervalId?: NodeJS.Timeout;
  };
};

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
  const [pomodoro, setPomodoro] = useState<PomodoroState>({});
  const { theme, setTheme } = useTheme();

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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pomodoro).forEach((state) => {
        if (state.intervalId) clearInterval(state.intervalId);
      });
    };
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
    // Clear pomodoro if running
    if (pomodoro[id]?.intervalId) {
      clearInterval(pomodoro[id].intervalId);
    }
    const newPomodoro = { ...pomodoro };
    delete newPomodoro[id];
    setPomodoro(newPomodoro);

    const res = await fetch(`/api/todos/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      setError('Failed to delete todo');
      return;
    }

    await loadTodos();
  }

  function startPomodoro(todo: Todo) {
    if (pomodoro[todo.id]?.isRunning) return;

    const intervalId = setInterval(() => {
      setPomodoro((prev) => {
        const state = prev[todo.id];
        if (!state) return prev;

        const newRemaining = state.remaining - 1;
        if (newRemaining <= 0) {
          // Time's up! Auto complete the todo
          clearInterval(intervalId);
          
          // Trigger notification (sound + vibrate)
          triggerNotification();
          
          // Record stats
          const stats = loadStats();
          stats.totalSessions += 1;
          stats.totalMinutes += 25; // 25 minutes
          saveStats(stats);
          
          // Trigger completion
          toggleCompleted(todo);
          // Remove pomodoro state
          const newState = { ...prev };
          delete newState[todo.id];
          return newState;
        }

        return {
          ...prev,
          [todo.id]: {
            ...state,
            remaining: newRemaining
          }
        };
      });
    }, 1000);

    setPomodoro((prev) => ({
      ...prev,
      [todo.id]: {
        remaining: POMODORO_TIME,
        isRunning: true,
        intervalId
      }
    }));
  }

  function stopPomodoro(todoId: string) {
    const state = pomodoro[todoId];
    if (state?.intervalId) {
      clearInterval(state.intervalId);
    }
    const newPomodoro = { ...pomodoro };
    delete newPomodoro[todoId];
    setPomodoro(newPomodoro);
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <main className="page-wrap mx-auto min-h-screen w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="glass-card card-hover mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/90 dark:text-cyan-200/90">Workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white dark:text-white">Todo App V1.2</h1>
            <p className="text-sm text-slate-200/80 dark:text-slate-200/80">{userEmail}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pomodoro-stats"
              className="ghost-btn px-3.5 py-2 text-sm"
            >
              📊
            </Link>
            <Link
              href="/settings"
              className="ghost-btn px-3.5 py-2 text-sm"
            >
              ⚙️
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="ghost-btn px-3.5 py-2 text-sm"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="ghost-btn px-3.5 py-2 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreate} className="glass-card card-hover mb-6 p-4 sm:p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/90 dark:text-cyan-200/90">新建待办</p>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="待办标题"
            className="soft-input"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述（可选）"
            className="soft-input"
            rows={3}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="soft-input"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof CATEGORY_OPTIONS)[number]['value'])
              }
              className="soft-input"
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value} className="bg-slate-900 text-white dark:bg-slate-900 dark:text-white">
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <button className="gradient-btn w-full sm:w-auto">创建</button>
        </div>
      </form>

      {error && (
        <p className="mb-3 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200 ring-1 ring-rose-300/30 dark:text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="glass-card flex items-center gap-3 rounded-2xl p-4 text-slate-200/90 dark:text-slate-200/90">
          <span className="loading-orb" />
          <span>Loading...</span>
        </div>
      ) : todos.length === 0 ? (
        <p className="glass-card rounded-2xl p-4 text-slate-200/90 dark:text-slate-200/90">No todos yet.</p>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => {
            const categoryMeta = getCategoryMeta(todo.category);
            const dueTone = getDueDateTone(todo.due_date);
            const isEditing = editingId === todo.id;
            const pomodoroState = pomodoro[todo.id];
            const isPomodoroRunning = pomodoroState?.isRunning;

            return (
              <li
                key={todo.id}
                onClick={() => !isEditing && beginEdit(todo)}
                className="glass-card card-hover cursor-pointer p-4 sm:p-5"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="soft-input"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="soft-input"
                      rows={3}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="datetime-local"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="soft-input"
                      />
                      <select
                        value={editCategory}
                        onChange={(e) =>
                          setEditCategory(e.target.value as (typeof CATEGORY_OPTIONS)[number]['value'])
                        }
                        className="soft-input"
                      >
                        {CATEGORY_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value} className="bg-slate-900 text-white dark:bg-slate-900 dark:text-white">
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
                        className="gradient-btn px-3 py-2 text-sm"
                      >
                        保存
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        className="ghost-btn px-3 py-2 text-sm"
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
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${categoryMeta.badgeClass}`}
                        >
                          {categoryMeta.label}
                        </span>
                        {todo.due_date && (
                          <span className={`text-xs font-medium ${dueTone}`}>
                            截止：{new Date(todo.due_date).toLocaleString()}
                          </span>
                        )}
                        {isPomodoroRunning && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/30 px-2.5 py-1 text-xs font-medium text-rose-300 animate-pulse">
                            🍅 {formatTime(pomodoroState.remaining)}
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-medium ${todo.completed ? 'line-through text-slate-300/60 dark:text-slate-300/60' : 'text-white dark:text-white'}`}
                      >
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p className="mt-1 text-sm text-slate-200/85 dark:text-slate-200/85">{todo.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!todo.completed && (
                        isPomodoroRunning ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              stopPomodoro(todo.id);
                            }}
                            className="pomodoro-btn active"
                          >
                            ⏹️ 停止
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startPomodoro(todo);
                            }}
                            className="pomodoro-btn"
                          >
                            🍅 专注
                          </button>
                        )
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleCompleted(todo);
                        }}
                        className="gradient-btn px-3 py-1.5 text-sm"
                      >
                        {todo.completed ? 'Undo' : 'Done'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteTodo(todo.id);
                        }}
                        className="rounded-xl border border-rose-300/40 bg-rose-400/15 px-3 py-1.5 text-sm text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-400/25 dark:text-rose-100"
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
