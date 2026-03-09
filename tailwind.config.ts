import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Spring Festival Theme (春节主题)
        'spring-festival': {
          primary: '#dc2626',
          secondary: '#fbbf24',
          accent: '#16a34a',
          background: '#fef2f2',
          text: '#1f2937',
        },
        // Spring Theme (春天主题)
        spring: {
          primary: '#059669',
          secondary: '#10b981',
          accent: '#34d399',
          background: '#ecfdf5',
          text: '#1f2937',
        },
      },
    }
  },
  plugins: []
};

export default config;
