// caminho: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  /*
   * darkMode: 'class'
   *
   * Habilita as variantes dark: do NativeWind via propagação de classe CSS,
   * sem depender de setColorScheme() (que causa crash em runtime).
   *
   * Mecanismo seguro:
   *   1. Um View raiz em App.tsx recebe className={isDark ? 'dark' : ''}.
   *   2. O isDark vem do ThemeContext (Zustand + useRNColorScheme).
   *   3. Todos os componentes descendentes que usam dark: são ativados.
   *   4. setColorScheme() do NativeWind NÃO é chamado em nenhum momento.
   */
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          500: '#0f2044',
          600: '#0a1830',
        },
        primary: {
          200: '#bfdbfe',
          300: '#93bbff',
          500: '#2f78f0',
          600: '#1e6ae0',
        },
      },
    },
  },
};
