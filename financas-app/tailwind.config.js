// caminho: tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  /**
   * NativeWind v4 preset — inclui os defaults do Tailwind otimizados para RN.
   * Deve vir antes de qualquer extensão de tema para que as extensões
   * abaixo sobrescrevam apenas o que é necessário.
   */
  presets: [require('nativewind/preset')],

  /**
   * darkMode: 'class'
   *
   * A troca de tema é controlada por código via `setColorScheme()` do NativeWind.
   * Quando `setColorScheme('dark')` é chamado, o NativeWind marca o nó raiz
   * com a classe `dark` e todos os filhos com variantes `dark:` são ativados.
   *
   * Não usamos 'media' para que o usuário possa sobrescrever a preferência
   * do sistema a qualquer momento nas Configurações do app.
   */
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        /**
         * navy — cor de marca do FinançasPRO.
         * Usada nos headers de navegação e como cor de fundo de botões de ação.
         * Nunca é substituída pelo accentColor para manter a identidade visual.
         */
        navy: '#0f2044',

        /**
         * primary — escala de azul primário.
         *
         * primary-300  → '#9ebcf8'  (texto de loading na splash screen)
         * primary-500  → '#2f78f0'  (azul principal, botões, progress bars)
         *
         * Referências no código:
         *   bg-primary-500, bg-primary-50, bg-primary-300 (botão desabilitado)
         *   text-primary-200 (tagline no DrawerContent sobre fundo navy)
         *   text-primary-300 (rodapé AuthScreen)
         *   text-primary-600, text-primary-700 (texto de item ativo do Drawer)
         */
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#9ebcf8',
          400: '#60a5fa',
          500: '#2f78f0',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },

  plugins: [],
};