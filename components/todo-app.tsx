'use client';

import { FormEvent, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  Button, Input, Select, Tag, Card, List, 
  Badge, Spin, Alert, message, Tooltip, Typography, DatePicker 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, 
  CheckOutlined, StopOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;

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
  { value: 'work', label: '工作', color: 'blue' },
  { value: 'life', label: '生活', color: 'green' },
  { value: 'study', label: '学习', color: 'purple' },
  { value: 'other', label: '其他', color: 'default' }
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

// Convert ISO date string to dayjs object for DatePicker
function toDayjsDate(iso: string | null): Dayjs | null {
  if (!iso) return null;
  const date = dayjs(iso);
  return date.isValid() ? date : null;
}

// Convert dayjs object to ISO string for API
function toIsoDateTime(dayjsDate: Dayjs | null): string | null {
  if (!dayjsDate || !dayjsDate.isValid()) return null;
  return dayjsDate.toISOString();
}

function getCategoryMeta(category: string | null) {
  return CATEGORY_OPTIONS.find((item) => item.value === category) ?? CATEGORY_OPTIONS[3];
}

function getDueDateStatus(dueDate: string | null): 'overdue' | 'soon' | 'normal' | null {
  if (!dueDate) return null;
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  if (due < now) return 'overdue';
  if (due - now <= 1000 * 60 * 60 * 48) return 'soon';
  return 'normal';
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
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]['value']>('other');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState<Dayjs | null>(null);
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
      message.error('Failed to create todo');
      setError('Failed to create todo');
      return;
    }

    setTitle('');
    setDescription('');
    setDueDate(null);
    setCategory('other');
    await loadTodos();
    message.success('Todo created successfully');
  }

  async function toggleCompleted(todo: Todo) {
    const res = await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed })
    });

    if (!res.ok) {
      message.error('Failed to update todo');
      setError('Failed to update todo');
      return;
    }

    await loadTodos();
  }

  function beginEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? '');
    setEditDueDate(toDayjsDate(todo.due_date));
    setEditCategory((todo.category as (typeof CATEGORY_OPTIONS)[number]['value']) || 'other');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditDueDate(null);
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
      message.error('Failed to save todo');
      setError('Failed to save todo');
      return;
    }

    cancelEdit();
    await loadTodos();
    message.success('Todo updated successfully');
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
      message.error('Failed to delete todo');
      setError('Failed to delete todo');
      return;
    }

    await loadTodos();
    message.success('Todo deleted');
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
      <Card className="mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.28em', fontSize: 12 }}>Workspace</Text>
            <Title level={3} style={{ margin: 0, color: 'white' }}>Todo App V1.2</Title>
            <Text type="secondary">{userEmail}</Text>
          </div>
          <div className="flex gap-2">
            <Tooltip title="Statistics">
              <Link href="/pomodoro-stats">
                <Button type="text" style={{ color: 'white' }}>📊</Button>
              </Link>
            </Tooltip>
            <Tooltip title="Settings">
              <Link href="/settings">
                <Button type="text" style={{ color: 'white' }}>⚙️</Button>
              </Link>
            </Tooltip>
            <Tooltip title="Toggle Theme">
              <Button 
                type="text" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{ color: 'white' }}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>
            </Tooltip>
            <Button type="text" onClick={() => signOut({ callbackUrl: '/login' })} style={{ color: 'white' }}>
              Logout
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 12, display: 'block', marginBottom: 16 }}>新建待办</Text>
        <form onSubmit={handleCreate}>
          <div className="grid gap-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="待办标题"
              size="large"
            />
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述（可选）"
              rows={3}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                value={dueDate}
                onChange={(date) => setDueDate(date)}
                size="large"
                style={{ width: '100%' }}
                placeholder="选择日期和时间"
              />
              <Select
                value={category}
                onChange={(value) => setCategory(value)}
                size="large"
                options={CATEGORY_OPTIONS.map(item => ({
                  value: item.value,
                  label: item.label
                }))}
              />
            </div>
            <Button type="primary" htmlType="submit" size="large" icon={<PlusOutlined />}>
              创建
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <Alert message={error} type="error" showIcon className="mb-3" />
      )}

      {loading ? (
        <Card style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <Spin tip="Loading..." />
        </Card>
      ) : todos.length === 0 ? (
        <Card style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Text type="secondary">No todos yet.</Text>
        </Card>
      ) : (
        <List
          dataSource={todos}
          renderItem={(todo) => {
            const categoryMeta = getCategoryMeta(todo.category);
            const dueDateStatus = getDueDateStatus(todo.due_date);
            const isEditing = editingId === todo.id;
            const pomodoroState = pomodoro[todo.id];
            const isPomodoroRunning = pomodoroState?.isRunning;

            return (
              <Card 
                key={todo.id}
                className="mb-3 cursor-pointer"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  opacity: todo.completed ? 0.6 : 1
                }}
                onClick={() => !isEditing && beginEdit(todo)}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      size="large"
                    />
                    <TextArea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DatePicker
                        showTime={{ format: 'HH:mm' }}
                        format="YYYY-MM-DD HH:mm"
                        value={editDueDate}
                        onChange={(date) => setEditDueDate(date)}
                        style={{ width: '100%' }}
                        placeholder="选择日期和时间"
                      />
                      <Select
                        value={editCategory}
                        onChange={(value) => setEditCategory(value)}
                        options={CATEGORY_OPTIONS.map(item => ({
                          value: item.value,
                          label: item.label
                        }))}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        type="primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          void saveEdit(todo);
                        }}
                        icon={<CheckOutlined />}
                      >
                        保存
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Tag color={categoryMeta.color}>{categoryMeta.label}</Tag>
                        {todo.due_date && (
                          <Tag color={
                            dueDateStatus === 'overdue' ? 'red' : 
                            dueDateStatus === 'soon' ? 'orange' : 'cyan'
                          }>
                            截止：{new Date(todo.due_date).toLocaleString()}
                          </Tag>
                        )}
                        {isPomodoroRunning && (
                          <Badge status="processing" text={<span style={{ color: '#f87171' }}>🍅 {formatTime(pomodoroState.remaining)}</span>} />
                        )}
                      </div>
                      <Text 
                        style={{ 
                          fontSize: 16, 
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? 'rgba(255,255,255,0.45)' : 'white'
                        }}
                      >
                        {todo.title}
                      </Text>
                      {todo.description && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">{todo.description}</Text>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!todo.completed && (
                        isPomodoroRunning ? (
                          <Button 
                            danger
                            onClick={(e) => {
                              e.stopPropagation();
                              stopPomodoro(todo.id);
                            }}
                            icon={<StopOutlined />}
                          >
                            停止
                          </Button>
                        ) : (
                          <Button 
                            type="primary"
                            ghost
                            onClick={(e) => {
                              e.stopPropagation();
                              startPomodoro(todo);
                            }}
                            icon={<ClockCircleOutlined />}
                          >
                            专注
                          </Button>
                        )
                      )}
                      <Button 
                        type="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleCompleted(todo);
                        }}
                      >
                        {todo.completed ? 'Undo' : 'Done'}
                      </Button>
                      <Button 
                        danger
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteTodo(todo.id);
                        }}
                        icon={<DeleteOutlined />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          }}
        />
      )}
    </main>
  );
}
