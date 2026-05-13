import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#101820',
        moss: '#255f4f',
        mint: '#e6f5ef',
        coral: '#f1745f',
        amber: '#f3c86a',
        cloud: '#f6f8f7'
      },
      boxShadow: {
        soft: '0 18px 50px rgba(16, 24, 32, 0.10)'
      }
    }
  },
  plugins: []
};

export default config;
