// caminho: src/navigation/RootNavigator.tsx
import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import AppNavigator from './AppNavigator';

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Navegador raiz que decide qual fluxo exibir com base no estado de autenticação.
 *
 * Fluxo:
 *  1. `isLoading = true`  → exibe tela de carregamento (verificando sessão salva)
 *  2. `session = null`    → exibe AuthScreen (login / cadastro)
 *  3. `session !== null`  → exibe AppNavigator (DrawerNavigator com todas as telas)
 *
 * Este componente deve ser filho direto do AuthProvider.
 * O NavigationContainer e o SQLiteProvider ficam em App.tsx,
 * acima deste componente na hierarquia.
 */
export default function RootNavigator(): React.JSX.Element {
  const { session, isLoading } = useAuth();

  // ── Estado de carregamento ─────────────────────────────────────────────────
  // Exibido brevemente enquanto o AuthContext verifica o AsyncStorage
  // em busca de uma sessão salva da última vez que o app foi aberto.
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f78f0" />
        <Text style={styles.loadingText}>Verificando sessão…</Text>
      </View>
    );
  }

  // ── Usuário não autenticado → tela de login/cadastro ──────────────────────
  if (!session) {
    return <AuthScreen />;
  }

  // ── Usuário autenticado → app principal ───────────────────────────────────
  return <AppNavigator />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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
