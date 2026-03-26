import 'react-native-url-polyfill/auto';
// caminho: App.tsx
import 'expo-dev-client';
import './global.css';

import React, { Suspense } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SQLiteProvider } from 'expo-sqlite';

import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { migrateDbIfNeeded, DATABASE_NAME } from './src/database/db';

// ─── Loading screen do banco ──────────────────────────────────────────────────
/**
 * Exibida pelo <Suspense> enquanto o SQLiteProvider executa o `onInit`
 * (criação/migração das tabelas). Normalmente dura menos de 200ms.
 */
function DatabaseLoadingScreen(): React.JSX.Element {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2f78f0" />
      <Text style={styles.loadingText}>Inicializando banco de dados…</Text>
    </View>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
/**
 * Hierarquia completa de providers (ordem é obrigatória):
 *
 *  GestureHandlerRootView   ← mais externo — obrigatório para Drawer e gestos
 *    Suspense               ← fallback visual enquanto SQLiteProvider inicializa
 *      SQLiteProvider       ← abre o banco SQLite e executa migrações
 *        AuthProvider       ← gerencia sessão Supabase (login/logout)
 *          NavigationContainer ← gerencia o estado de navegação
 *            StatusBar      ← controla a barra de status do sistema
 *            RootNavigator  ← decide entre AuthScreen ou AppNavigator
 *
 * Por que essa ordem?
 *  - SQLiteProvider antes do AuthProvider: os hooks de banco (useTransactions,
 *    useGoals) podem ser chamados em telas autenticadas sem risco de o banco
 *    ainda não ter sido inicializado.
 *  - AuthProvider antes do NavigationContainer: o RootNavigator precisa do
 *    contexto de auth para decidir qual tela renderizar na inicialização.
 *  - A store Zustand/MMKV não precisa de provider — importada diretamente.
 */
export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Suspense fallback={<DatabaseLoadingScreen />}>
        <SQLiteProvider
          databaseName={DATABASE_NAME}
          onInit={migrateDbIfNeeded}
          useSuspense
        >
          <AuthProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f2044',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#9ebcf8',
    fontSize: 14,
    fontWeight: '500',
  },
});
