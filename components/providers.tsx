'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';

type Props = {
  children: ReactNode;
};

function getAntdTheme(themeMode: string) {
  const isDark = themeMode === 'dark';
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? '#22d3ee' : '#0891b2',
      borderRadius: 8,
      fontFamily: 'inherit',
    },
    components: {
      Card: { borderRadiusLG: 12 },
      Input: { borderRadius: 8 },
      Button: { borderRadius: 8 },
      Select: { borderRadius: 8 },
    },
  };
}

function AntdThemeWrapper({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    // Get current theme from DOM
    const isDark = document.documentElement.classList.contains('dark');
    setThemeMode(isDark ? 'dark' : 'light');
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setThemeMode(isDark ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { 
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
