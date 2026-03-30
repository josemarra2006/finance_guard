// caminho: src/contexts/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { useSettingsStore } from '../store/useSettingsStore';
import type { Theme } from '../store/useSettingsStore';

// ─── Accent Color Presets ─────────────────────────────────────────────────────

/**
 * Paleta de cores de destaque disponíveis para o usuário.
 *
 * Todos os presets têm contraste suficiente com branco (#ffffff) para serem
 * usados em backgrounds de UI sem comprometer a legibilidade.
 *
 * O preset 'blue' corresponde ao azul primário original do app (#2f78f0),
 * garantindo que o estado padrão seja visualmente idêntico ao design inicial.
 */
export interface AccentPreset {
  id: string;
  label: string;
  color: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'blue',   label: 'Azul',    color: '#2f78f0' },
  { id: 'green',  label: 'Verde',   color: '#059669' },
  { id: 'orange', label: 'Laranja', color: '#ea580c' },
  { id: 'purple', label: 'Roxo',    color: '#7c3aed' },
  { id: 'teal',   label: 'Teal',    color: '#0d9488' },
];

// ─── Context Type ─────────────────────────────────────────────────────────────

interface ThemeContextValue {
  /**
   * Cor de destaque atualmente ativa (hex string).
   * Usada para highlights de navegação, bordas de inputs ativos e
   * seleções de UI. NÃO altera as cores semânticas financeiras
   * (verde=entrada, vermelho=gasto, azul=economia) que são hardcoded.
   */
  accentColor: string;

  /**
   * True quando o tema resolvido é escuro.
   * Leva em conta 'system' + preferência do SO automaticamente.
   */
  isDark: boolean;

  /** Preferência de tema salva pelo usuário */
  theme: Theme;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  accentColor: '#2f78f0',
  isDark: false,
  theme: 'light',
});

// ─── Provider ────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider
 *
 * Responsabilidades:
 *  1. Ler `theme` e `accentColor` do Zustand (que persiste no AsyncStorage).
 *  2. Sincronizar o NativeWind colorScheme via `setColorScheme()` sempre que
 *     a preferência de tema mudar. Isso ativa/desativa as variantes `dark:` em
 *     todos os componentes filhos que usam NativeWind.
 *  3. Expor `isDark`, `accentColor` e `theme` via context para qualquer
 *     componente que precise aplicar valores dinâmicos fora do NativeWind
 *     (ex: cores em StyleSheet, inline styles, etc.).
 *
 * Posição na árvore (App.tsx):
 *   ThemeProvider
 *   └── SQLiteProvider
 *       └── AuthProvider
 *           └── AppShell   ← consome useColorScheme do NativeWind para aplicar "dark" class
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const theme      = useSettingsStore((s) => s.theme);
  const accentColor = useSettingsStore((s) => s.accentColor);

  // NativeWind's setColorScheme updates the global color scheme that
  // NativeWind uses to resolve dark: variants.
  const { setColorScheme } = useNativeWindColorScheme();

  // React Native's system color scheme — used when theme === 'system'
  const systemScheme = useRNColorScheme(); // 'light' | 'dark' | null

  /**
   * Whenever the user's theme preference changes, synchronise NativeWind.
   * 'system' is passed through directly — NativeWind resolves it using
   * the OS preference internally.
   */
  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  // Resolve the actual dark/light boolean for StyleSheet consumers
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemScheme === 'dark');

  const value: ThemeContextValue = {
    accentColor,
    isDark,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useAppTheme
 *
 * Retorna os valores de tema resolvidos para uso em qualquer componente.
 *
 * Exemplo — cores dinâmicas em StyleSheet:
 * ```tsx
 * const { accentColor, isDark } = useAppTheme();
 *
 * const cardBg = isDark ? '#1e293b' : '#ffffff';
 * const activeIndicator = { backgroundColor: accentColor };
 * ```
 *
 * Exemplo — uso do accentColor em inline style:
 * ```tsx
 * <View style={{ borderColor: accentColor }} />
 * ```
 */
export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Adiciona um canal alpha de dois dígitos hexadecimais a uma cor hex.
 * Usado para criar backgrounds semi-transparentes derivados do accentColor.
 *
 * @example hexAlpha('#2f78f0', 0.10) → '#2f78f01a'
 */
export function hexAlpha(hex: string, opacity: number): string {
  const clamped = Math.min(1, Math.max(0, opacity));
  const alpha = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}
