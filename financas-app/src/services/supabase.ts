// caminho: src/services/supabase.ts

/**
 * O polyfill de URL deve ser a PRIMEIRA importação do arquivo.
 * Ele injeta a API `URL` no ambiente global do React Native,
 * que é necessária internamente pelo cliente do Supabase.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ─── Variáveis de ambiente ────────────────────────────────────────────────────
// Definidas no arquivo .env com o prefixo EXPO_PUBLIC_ para serem
// injetadas no bundle pelo Expo. Caso estejam ausentes, o app
// lançará um erro claro em vez de falhar silenciosamente.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] As variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Verifique o arquivo .env na raiz do projeto.'
  );
}

// ─── Cliente Supabase ─────────────────────────────────────────────────────────
/**
 * Instância única do cliente Supabase.
 * Importe `supabase` diretamente onde precisar — não há necessidade de Provider.
 *
 * Configurações de Auth:
 *  - `storage: AsyncStorage`     → persiste a sessão entre fechamentos do app
 *  - `autoRefreshToken: true`    → renova o JWT antes de expirar automaticamente
 *  - `persistSession: true`      → salva a sessão no AsyncStorage
 *  - `detectSessionInUrl: false` → desabilitado pois React Native não usa URLs
 *                                   de callback como navegadores web
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Tipos utilitários ────────────────────────────────────────────────────────

/** Perfil do usuário conforme a tabela public.profiles */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}
