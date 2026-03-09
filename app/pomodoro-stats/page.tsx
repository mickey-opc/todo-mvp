'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Typography, Button, Statistic } from 'antd';

const { Title, Text } = Typography;

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
      <Card 
        className="mb-6"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.28em', fontSize: 12 }}>Statistics</Text>
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              🍅 番茄钟统计
            </Title>
          </div>
          <Link href="/">
            <Button>← 返回</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card 
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)' 
          }}
        >
          <Statistic 
            title={<Text type="secondary">总使用次数</Text>}
            value={mounted ? stats.totalSessions : '-'}
            prefix="🍅"
            valueStyle={{ color: 'white', fontSize: 36 }}
          />
        </Card>

        <Card 
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)' 
          }}
        >
          <Statistic 
            title={<Text type="secondary">累计时长</Text>}
            value={mounted ? formatDuration(stats.totalMinutes) : '-'}
            prefix="⏱️"
            valueStyle={{ color: 'white', fontSize: 36 }}
          />
        </Card>
      </div>

      <Card 
        className="mt-6"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Title level={5} style={{ color: 'white', marginBottom: 16 }}>使用说明</Title>
        <ul className="space-y-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <li>• 点击任务卡片上的 🍅 专注 按钮开始番茄钟</li>
          <li>• 番茄钟时长为 25 分钟</li>
          <li>• 计时结束后会自动标记任务完成</li>
          <li>• 计时结束时会有声音和震动提醒</li>
          <li>• 可随时点击停止按钮中断番茄钟</li>
        </ul>
      </Card>
    </main>
  );
}
