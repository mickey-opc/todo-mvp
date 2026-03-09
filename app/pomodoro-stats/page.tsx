'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PomodoroStats = {
  totalSessions: number;
  totalMinutes: number;
};

const STORAGE_KEY = 'pomodoro-stats';

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

export default function PomodoroStatsPage() {
  const [stats, setStats] = useState<PomodoroStats>({ totalSessions: 0, totalMinutes: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStats(loadStats());
  }, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} 分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} 小时`;
    }
    return `${hours} 小时 ${mins} 分钟`;
  };

  return (
    <main className="page-wrap mx-auto min-h-screen w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="glass-card card-hover mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/90 dark:text-cyan-200/90">Statistics</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white dark:text-white">
              🍅 番茄钟统计
            </h1>
          </div>
          <Link
            href="/"
            className="ghost-btn px-3.5 py-2 text-sm"
          >
            ← 返回
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card card-hover p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-2xl">
              🍅
            </div>
            <div>
              <p className="text-sm text-slate-200/80 dark:text-slate-200/80">总使用次数</p>
              <p className="text-3xl font-bold text-white dark:text-white">
                {mounted ? stats.totalSessions : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card card-hover p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl">
              ⏱️
            </div>
            <div>
              <p className="text-sm text-slate-200/80 dark:text-slate-200/80">累计时长</p>
              <p className="text-3xl font-bold text-white dark:text-white">
                {mounted ? formatDuration(stats.totalMinutes) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 glass-card card-hover p-6">
        <h2 className="mb-4 text-lg font-semibold text-white dark:text-white">使用说明</h2>
        <ul className="space-y-2 text-sm text-slate-200/80 dark:text-slate-200/80">
          <li>• 点击任务卡片上的 🍅 专注 按钮开始番茄钟</li>
          <li>• 番茄钟时长为 25 分钟</li>
          <li>• 计时结束后会自动标记任务完成</li>
          <li>• 计时结束时会有声音和震动提醒</li>
          <li>• 可随时点击停止按钮中断番茄钟</li>
        </ul>
      </div>
    </main>
  );
}
