// caminho: src/store/useSettingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// ─── MMKV Instance ───────────────────────────────────────────────────────────
/**
 * Instância dedicada do MMKV para configurações do app.
 *
 * Criada em nível de módulo (fora do create/store) para garantir que
 * exista apenas uma instância durante todo o ciclo de vida do app.
 * O `id` customizado isola estes dados de outros possíveis storages MMKV.
 */
const settingsMMKV = new MMKV({ id: 'financas-settings-v1' });

// ─── MMKV ↔ Zustand Adapter ──────────────────────────────────────────────────
/**
 * Adapter que conecta a API síncrona do MMKV ao contrato de storage
 * assíncrono exigido pelo middleware `persist` do Zustand.
 *
 * O Zustand aceita que `getItem` retorne `string | null` (sincrônico)
 * além de `Promise<string | null>`, portanto MMKV funciona perfeitamente aqui.
 */
const mmkvZustandStorage = createJSONStorage(() => ({
  setItem: (name: string, value: string): void => {
    settingsMMKV.set(name, value);
  },
  getItem: (name: string): string | null => {
    const value = settingsMMKV.getString(name);
    return value !== undefined ? value : null;
  },
  removeItem: (name: string): void => {
    settingsMMKV.delete(name);
  },
}));

// ─── Types ───────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  /** Nome exibido no app (ex.: "Casal", "Ernesto", "Família") */
  userName: string;
  /** Renda mensal combinada para cálculos de projeção */
  monthlyIncome: number;
  /**
   * Chave da API do Groq para o Chat IA.
   * Armazenada localmente — nunca enviada a servidores externos além do Groq.
   */
  groqApiKey: string;
  /** Preferência de tema visual */
  theme: Theme;
  /** Cor de destaque em hex (ex.: "#2f78f0") */
  accentColor: string;
}

interface SettingsActions {
  setUserName: (name: string) => void;
  setMonthlyIncome: (income: number) => void;
  setGroqApiKey: (key: string) => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  /** Reseta todas as configurações para os valores padrão */
  resetSettings: () => void;
}

// ─── Default Values ──────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: SettingsState = {
  userName: '',
  monthlyIncome: 0,
  groqApiKey: '',
  theme: 'light',
  accentColor: '#2f78f0',
};

// ─── Store ───────────────────────────────────────────────────────────────────

/**
 * Store global de configurações do usuário.
 *
 * Uso em qualquer componente (sem necessidade de Provider):
 * ```tsx
 * const userName = useSettingsStore((s) => s.userName);
 * const setUserName = useSettingsStore((s) => s.setUserName);
 * ```
 *
 * Todas as alterações são gravadas automaticamente no MMKV
 * e recuperadas na próxima abertura do app.
 */
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      // Estado inicial (sobrescrito pelo MMKV na hidratação)
      ...DEFAULT_SETTINGS,

      // ── Actions ──────────────────────────────────────────────────────────
      setUserName: (name: string) => {
        set({ userName: name });
      },

      setMonthlyIncome: (income: number) => {
        set({ monthlyIncome: income });
      },

      setGroqApiKey: (key: string) => {
        set({ groqApiKey: key });
      },

      setTheme: (theme: Theme) => {
        set({ theme });
      },

      setAccentColor: (color: string) => {
        set({ accentColor: color });
      },

      resetSettings: () => {
        set(DEFAULT_SETTINGS);
      },
    }),
    {
      name: 'financas-settings',
      storage: mmkvZustandStorage,
    }
  )
);
