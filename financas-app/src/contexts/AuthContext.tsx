// caminho: src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, type UserProfile } from '../services/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AuthState {
  /** Sessão atual do Supabase (inclui access_token, refresh_token, etc.) */
  session: Session | null;
  /** Usuário autenticado simplificado (do Supabase Auth) */
  user: User | null;
  /** Perfil expandido da tabela public.profiles */
  profile: UserProfile | null;
  /** True enquanto o AuthContext verifica se há sessão salva no AsyncStorage */
  isLoading: boolean;
  /** Mensagem de erro da última operação de autenticação */
  error: string | null;
}

interface AuthActions {
  /**
   * Faz login com email e senha.
   * @returns `true` em caso de sucesso, `false` em caso de erro.
   */
  signIn: (email: string, password: string) => Promise<boolean>;
  /**
   * Cria uma nova conta e, em seguida, atualiza o perfil com o nome.
   * @returns `true` em caso de sucesso, `false` em caso de erro.
   */
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  /** Encerra a sessão atual e limpa o estado. */
  signOut: () => Promise<void>;
  /** Limpa a mensagem de erro manualmente (ex.: ao fechar um alerta). */
  clearError: () => void;
}

type AuthContextValue = AuthState & AuthActions;

// ─── Contexto ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── Busca perfil do banco ────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.warn('[AuthContext] fetchProfile error:', profileError.message);
      return;
    }

    setProfile(data as UserProfile);
  }, []);

  // ── Aplica sessão ao estado interno ─────────────────────────────────────
  const applySession = useCallback(
    async (newSession: Session | null): Promise<void> => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    },
    [fetchProfile]
  );

  // ── Inicialização: verifica sessão persistida no AsyncStorage ────────────
  useEffect(() => {
    let isMounted = true;

    const initialize = async (): Promise<void> => {
      try {
        // Recupera a sessão salva localmente (se houver)
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          await applySession(data.session);
        }
      } catch (e) {
        console.error('[AuthContext] initialize error:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Listener de mudanças de estado de autenticação:
    // disparado em login, logout, refresh de token, etc.
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (isMounted) {
          await applySession(newSession);
          // Garante que o loading termina mesmo que o evento chegue
          // antes da inicialização acima
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  // ── signIn ───────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null);
      setIsLoading(true);

      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (authError) {
          setError(translateAuthError(authError));
          return false;
        }

        // O onAuthStateChange já cuida de chamar applySession
        return true;
      } catch (e) {
        setError('Erro inesperado ao fazer login. Tente novamente.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── signUp ───────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<boolean> => {
      setError(null);
      setIsLoading(true);

      try {
        // 1. Cria o usuário no Supabase Auth
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
          });

        if (signUpError) {
          setError(translateAuthError(signUpError));
          return false;
        }

        // 2. Atualiza o campo `name` no perfil criado pelo trigger
        // O trigger `handle_new_user` já inseriu a linha com email,
        // agora só precisamos adicionar o nome
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: name.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', signUpData.user.id);

          if (profileError) {
            // Não é erro crítico — o usuário foi criado,
            // o nome pode ser atualizado depois nas configurações
            console.warn('[AuthContext] signUp profile update:', profileError.message);
          }
        }

        return true;
      } catch (e) {
        setError('Erro inesperado ao criar conta. Tente novamente.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── signOut ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      // O onAuthStateChange já dispara applySession(null) automaticamente
    } catch (e) {
      console.error('[AuthContext] signOut error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── clearError ───────────────────────────────────────────────────────────
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // ─── Valor do contexto ───────────────────────────────────────────────────
  const value: AuthContextValue = {
    session,
    user,
    profile,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook de consumo ─────────────────────────────────────────────────────────

/**
 * Hook para acessar o contexto de autenticação em qualquer componente.
 *
 * Lança um erro se usado fora do `AuthProvider`, evitando bugs silenciosos.
 *
 * Exemplo:
 * ```tsx
 * const { user, signOut } = useAuth();
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      '[useAuth] deve ser usado dentro de um <AuthProvider>. ' +
      'Verifique se o AuthProvider está no App.tsx.'
    );
  }

  return context;
}

// ─── Utilitário: tradução de erros ───────────────────────────────────────────

/**
 * Traduz as mensagens de erro do Supabase Auth (em inglês) para
 * mensagens amigáveis em português para exibir na interface.
 */
function translateAuthError(error: AuthError): string {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Email ou senha incorretos. Verifique e tente novamente.';
  }
  if (message.includes('email not confirmed')) {
    return 'Confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
  }
  if (message.includes('user already registered')) {
    return 'Este email já está cadastrado. Tente fazer login.';
  }
  if (message.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (message.includes('unable to validate email address')) {
    return 'Endereço de email inválido.';
  }
  if (message.includes('signup is disabled')) {
    return 'Novos cadastros estão temporariamente desabilitados.';
  }
  if (message.includes('email rate limit exceeded')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (message.includes('network')) {
    return 'Sem conexão com a internet. Verifique sua rede.';
  }

  // Fallback: retorna a mensagem original caso não seja mapeada
  return `Erro de autenticação: ${error.message}`;
}
