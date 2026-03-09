'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const themes = [
  {
    id: 'light',
    name: '浅色',
    description: '清爽的浅色主题',
    icon: '☀️',
  },
  {
    id: 'dark',
    name: '深色',
    description: '护眼的深色主题',
    icon: '🌙',
  },
  {
    id: 'spring-festival',
    name: '春节',
    description: '喜庆的春节主题',
    icon: '🧧',
  },
  {
    id: 'spring',
    name: '春天',
    description: '清新的春天主题',
    icon: '🌸',
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-orb" />
      </div>
    );
  }

  return (
    <div className="page-wrap min-h-screen p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="ghost-btn">
            ← 返回
          </Link>
          <h1 className="text-2xl font-bold">设置</h1>
        </div>

        {/* Theme Section */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">主题选择</h2>
          <p className="text-sm opacity-70 mb-6">选择你喜欢的主题风格</p>

          <div className="space-y-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  theme === t.id
                    ? 'border-cyan-400 bg-cyan-400/20 scale-[1.02]'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
              >
                <span className="text-3xl">{t.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm opacity-70">{t.description}</div>
                </div>
                {theme === t.id && (
                  <span className="ml-auto text-cyan-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="mt-6 text-center text-sm opacity-60">
          当前主题：<span className="font-medium">{themes.find(t => t.id === theme)?.name}</span>
        </div>
      </div>
    </div>
  );
}
