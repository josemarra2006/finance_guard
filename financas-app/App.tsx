// caminho: App.tsx
/**
 * IMPORTANTE: 'react-native-gesture-handler' deve ser o PRIMEIRO import
 * do arquivo de entrada.
 */
import 'react-native-gesture-handler';

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';

import { ThemeProvider, useAppTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { DATABASE_NAME, migrateDbIfNeeded } from './src/database/db';

// ─── ThemedRoot ───────────────────────────────────────────────────────────────

/**
 * ThemedRoot — Injeção global da classe `dark` do NativeWind.
 *
 * Estratégia segura (sem setColorScheme):
 *   - Consome `isDark` diretamente do ThemeContext via useAppTheme().
 *   - Aplica `className="dark"` ao View raiz quando o tema escuro está ativo.
 *   - Isso ativa as variantes dark: em todos os componentes descendentes,
 *     pois tailwind.config.js está configurado com darkMode: 'class'.
 *   - setColorScheme() do NativeWind NÃO é chamado — elimina o crash de runtime
 *     "Unable to manually set color scheme without using darkMode: class".
 *
 * Posição na árvore: filho direto de AuthProvider, contém o NavigationContainer.
 */
function ThemedRoot(): React.JSX.Element {
  const { isDark } = useAppTheme();

  return (
    <View
      style={styles.root}
      className={isDark ? 'dark' : ''}
    >
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

/**
 * Árvore de providers (de fora para dentro):
 *
 * GestureHandlerRootView
 *   SafeAreaProvider
 *     ThemeProvider       — fornece isDark + accentColor via context
 *       SQLiteProvider    — inicializa banco e migrações
 *         AuthProvider    — gerencia sessão Supabase Auth
 *           ThemedRoot    — injeta classe `dark` no root View e monta navegação
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
              <ThemedRoot />
            </AuthProvider>
          </SQLiteProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
