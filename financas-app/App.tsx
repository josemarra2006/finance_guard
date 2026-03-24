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

import AppNavigator from './src/navigation/AppNavigator';
import { migrateDbIfNeeded, DATABASE_NAME } from './src/database/db';

// ─── Loading screen ───────────────────────────────────────────────────────────
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
 * Hierarquia de providers:
 *
 *  GestureHandlerRootView   ← obrigatório para react-navigation/drawer e gesture-handler
 *    Suspense               ← exibe DatabaseLoadingScreen enquanto o SQLiteProvider inicializa
 *      SQLiteProvider       ← abre o banco e executa migrateDbIfNeeded antes de renderizar filhos
 *        NavigationContainer  ← gerencia o estado de navegação
 *          AppNavigator     ← DrawerNavigator com as telas do app
 *
 * Ordem importante:
 *  - GestureHandlerRootView deve ser o elemento mais externo.
 *  - SQLiteProvider deve envolver toda a navegação para que os hooks
 *    `useTransactions` e `useGoals` (que chamam `useSQLiteContext()`)
 *    possam ser usados em qualquer tela.
 *  - A store Zustand/MMKV não precisa de provider — pode ser importada diretamente.
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
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
/**
 * Usa StyleSheet (não NativeWind) porque estes componentes são renderizados
 * fora da árvore NativeWind durante o loading do banco.
 */
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
