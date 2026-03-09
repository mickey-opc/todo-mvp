'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
        themes={['light', 'dark', 'spring-festival', 'spring']}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
