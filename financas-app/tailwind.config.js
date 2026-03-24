// caminho: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aponta para todos os arquivos que podem conter classes Tailwind
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  // Preset obrigatório do NativeWind v4
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta de cores principal do app financeiro
        primary: {
          50:  '#e8f0fe',
          100: '#c5d6fc',
          200: '#9ebcf8',
          300: '#74a0f5',
          400: '#528cf3',
          500: '#2f78f0',
          600: '#1e5ec0',
          700: '#154591',
          800: '#0d2d63',
          900: '#071638',
        },
        navy: '#0f2044',
        accent: '#00c896',
        danger: '#e53e3e',
        warning: '#f6ad55',
      },
    },
  },
  plugins: [],
};
