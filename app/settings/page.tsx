'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, Button, Typography, Radio, Space, Spin } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

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
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-wrap min-h-screen p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button>← 返回</Button>
          </Link>
          <Title level={3} style={{ margin: 0 }}>设置</Title>
        </div>

        {/* Theme Section */}
        <Card 
          title={<Title level={5} style={{ margin: 0 }}>主题选择</Title>}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>选择你喜欢的主题风格</Text>

          <Radio.Group 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {themes.map((t) => (
                <Radio 
                  key={t.id} 
                  value={t.id}
                  style={{ 
                    width: '100%',
                    margin: 0,
                    padding: '12px 16px',
                    border: theme === t.id ? '2px solid #22d3ee' : '2px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    background: theme === t.id ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.05)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.icon}</span>
                    <div className="text-left">
                      <div className="font-medium" style={{ color: 'white' }}>{t.name}</div>
                      <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.description}</div>
                    </div>
                    {theme === t.id && (
                      <CheckOutlined style={{ marginLeft: 'auto', color: '#22d3ee' }} />
                    )}
                  </div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Card>

        {/* Current Theme Info */}
        <div className="mt-6 text-center">
          <Text type="secondary">
            当前主题：<span className="font-medium">{themes.find(t => t.id === theme)?.name}</span>
          </Text>
        </div>
      </div>
    </div>
  );
}
