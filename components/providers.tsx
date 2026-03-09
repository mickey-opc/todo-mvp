'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';

type Props = {
  children: ReactNode;
};

// Theme configurations for all 4 themes
function getAntdTheme(themeMode: string) {
  const baseToken = {
    borderRadius: 8,
    fontFamily: 'inherit',
  };

  switch (themeMode) {
    case 'dark':
      return {
        algorithm: theme.darkAlgorithm,
        token: {
          ...baseToken,
          colorPrimary: '#22d3ee',
          colorBgContainer: '#1e293b',
          colorBgElevated: '#334155',
          colorText: '#f1f5f9',
          colorTextSecondary: '#94a3b8',
          colorBorder: '#475569',
          colorBorderSecondary: '#334155',
        },
        components: {
          Card: { borderRadiusLG: 12 },
          Input: { borderRadius: 8 },
          Button: { borderRadius: 8 },
          Select: { borderRadius: 8 },
          DatePicker: { borderRadius: 8 },
        },
      };
    case 'spring-festival':
      return {
        algorithm: theme.defaultAlgorithm,
        token: {
          ...baseToken,
          colorPrimary: '#dc2626',
          colorBgContainer: '#fef2f2',
          colorBgElevated: '#ffffff',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorBorder: '#fca5a5',
          colorBorderSecondary: '#fecaca',
        },
        components: {
          Card: { borderRadiusLG: 12 },
          Input: { borderRadius: 8 },
          Button: { borderRadius: 8 },
          Select: { borderRadius: 8 },
          DatePicker: { borderRadius: 8 },
        },
      };
    case 'spring':
      return {
        algorithm: theme.defaultAlgorithm,
        token: {
          ...baseToken,
          colorPrimary: '#059669',
          colorBgContainer: '#ecfdf5',
          colorBgElevated: '#ffffff',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorBorder: '#6ee7b7',
          colorBorderSecondary: '#a7f3d0',
        },
        components: {
          Card: { borderRadiusLG: 12 },
          Input: { borderRadius: 8 },
          Button: { borderRadius: 8 },
          Select: { borderRadius: 8 },
          DatePicker: { borderRadius: 8 },
        },
      };
    case 'light':
    default:
      return {
        algorithm: theme.defaultAlgorithm,
        token: {
          ...baseToken,
          colorPrimary: '#0891b2',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorText: '#1e293b',
          colorTextSecondary: '#64748b',
          colorBorder: '#cbd5e1',
          colorBorderSecondary: '#e2e8f0',
        },
        components: {
          Card: { borderRadiusLG: 12 },
          Input: { borderRadius: 8 },
          Button: { borderRadius: 8 },
          Select: { borderRadius: 8 },
          DatePicker: { borderRadius: 8 },
        },
      };
  }
}

function AntdThemeWrapper({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    // Get current theme from DOM - check for all theme classes
    const html = document.documentElement;
    let currentTheme = 'dark';
    
    if (html.classList.contains('spring-festival')) {
      currentTheme = 'spring-festival';
    } else if (html.classList.contains('spring')) {
      currentTheme = 'spring';
    } else if (html.classList.contains('dark')) {
      currentTheme = 'dark';
    } else {
      currentTheme = 'light';
    }
    
    setThemeMode(currentTheme);
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const html = document.documentElement;
      let newTheme = 'dark';
      
      if (html.classList.contains('spring-festival')) {
        newTheme = 'spring-festival';
      } else if (html.classList.contains('spring')) {
        newTheme = 'spring';
      } else if (html.classList.contains('dark')) {
        newTheme = 'dark';
      } else {
        newTheme = 'light';
      }
      
      setThemeMode(newTheme);
    });
    
    observer.observe(html, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <ConfigProvider theme={getAntdTheme(themeMode)}>
      {children}
    </ConfigProvider>
  );
}

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
        themes={['light', 'dark', 'spring-festival', 'spring']}
      >
        <AntdThemeWrapper>{children}</AntdThemeWrapper>
      </ThemeProvider>
    </SessionProvider>
  );
}
