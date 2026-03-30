// caminho: App.tsx
/**
 * IMPORTANTE: 'react-native-gesture-handler' deve ser o PRIMEIRO import
 * do arquivo de entrada. Isso é exigido pela biblioteca para interceptar
 * gestos corretamente antes que qualquer outro código seja executado.
 */
import 'react-native-gesture-handler';

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'nativewind';

import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { DATABASE_NAME, migrateDbIfNeeded } from './src/database/db';

// ─── AppShell ─────────────────────────────────────────────────────────────────

/**
 * AppShell é um componente interno separado para poder consumir o contexto
 * do NativeWind (que é inicializado pelo ThemeProvider acima dele na árvore).
 *
 * Responsabilidade exclusiva: aplicar a classe `dark` ao View raiz quando
 * o tema resolvido for escuro.
 *
 * Mecânica do NativeWind v4 com darkMode: 'class':
 *  - `setColorScheme()` (chamado no ThemeProvider) atualiza o estado interno do NativeWind.
 *  - `useColorScheme()` do NativeWind reflete esse estado.
 *  - Ao aplicar className="dark" ao View raiz, TODOS os descendentes com
 *    variantes `dark:` são ativados (ex: `dark:bg-slate-900`, `dark:text-white`).
 *  - Sem essa classe no root View, nenhuma variante `dark:` funciona — mesmo
 *    que `setColorScheme('dark')` tenha sido chamado.
 */
function AppShell(): React.JSX.Element {
  const { colorScheme } = useColorScheme();

  return (
    /*
     * O `style={styles.root}` garante flex: 1 via StyleSheet (sem NativeWind).
     * O `className` aplica ou remove a classe `dark` com base no esquema atual.
     * Ambos podem coexistir no mesmo componente — o StyleSheet lida com layout,
     * o NativeWind lida com theming.
     */
    <View
      style={styles.root}
      className={colorScheme === 'dark' ? 'dark' : ''}
    >
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

/**
 * Árvore de providers do aplicativo (de fora para dentro):
 *
 * GestureHandlerRootView   — necessário para react-native-gesture-handler
 *   SafeAreaProvider       — fornece contexto de safe area para toda a árvore
 *     ThemeProvider        — sincroniza NativeWind colorScheme + expõe accentColor
 *       SQLiteProvider     — inicializa o banco e roda as migrações antes de renderizar filhos
 *         AuthProvider     — gerencia sessão Supabase Auth (login/cadastro/logout)
 *           AppShell       — aplica a classe `dark` ao root View e monta a navegação
 *
 * Ordem de dependências:
 *  - ThemeProvider precisa estar ANTES do AppShell (para fornecer o context ao useColorScheme).
 *  - SQLiteProvider precisa estar ANTES de qualquer screen que use hooks SQLite.
 *  - AuthProvider precisa estar ANTES do RootNavigator (que decide a rota inicial).
 */
export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SQLiteProvider
            databaseName={DATABASE_NAME}
            onInit={migrateDbIfNeeded}
          >
            <AuthProvider>
              <AppShell />
            </AuthProvider>
          </SQLiteProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});