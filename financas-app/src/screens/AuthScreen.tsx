// caminho: src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

// ─── Tipos internos ──────────────────────────────────────────────────────────

type AuthMode = 'login' | 'register';

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AuthScreen(): React.JSX.Element {
  const { signIn, signUp, isLoading, error, clearError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // ── Alterna entre login e cadastro ────────────────────────────────────────
  const toggleMode = (): void => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLocalError(null);
    clearError();
  };

  // ── Validação local antes de chamar o contexto ────────────────────────────
  const validate = (): boolean => {
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('O email é obrigatório.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Informe um email válido.');
      return false;
    }

    if (!password) {
      setLocalError('A senha é obrigatória.');
      return false;
    }

    if (password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setLocalError('O nome é obrigatório.');
        return false;
      }
      if (name.trim().length < 2) {
        setLocalError('O nome deve ter pelo menos 2 caracteres.');
        return false;
      }
      if (password !== confirmPassword) {
        setLocalError('As senhas não coincidem.');
        return false;
      }
    }

    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;

    if (mode === 'login') {
      await signIn(email, password);
    } else {
      await signUp(email, password, name);
    }
  };

  // ── Mensagem de erro exibida (local ou do contexto) ───────────────────────
  const displayedError = localError ?? error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-primary-500 items-center justify-center mb-4">
              <Text style={styles.logoEmoji}>💰</Text>
            </View>
            <Text className="text-white text-3xl font-bold tracking-tight">
              FinançasPRO
            </Text>
            <Text className="text-primary-200 text-sm mt-1">
              Controle seu futuro financeiro
            </Text>
          </View>

          {/* ── Card do formulário ────────────────────────────────────────── */}
          <View className="bg-white rounded-2xl p-6 shadow-lg">

            {/* Título do modo */}
            <Text className="text-navy text-xl font-bold mb-1">
              {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
            </Text>
            <Text className="text-gray-400 text-sm mb-6">
              {mode === 'login'
                ? 'Bem-vindo de volta!'
                : 'Preencha os dados para começar'}
            </Text>

            {/* ── Campo: Nome (somente cadastro) ────────────────────────── */}
            {mode === 'register' && (
              <View className="mb-4">
                <Text className="text-gray-600 text-sm font-medium mb-1.5">
                  Nome
                </Text>
                <TextInput
                  style={styles.input}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                  placeholder="Seu nome"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>
            )}

            {/* ── Campo: Email ──────────────────────────────────────────── */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm font-medium mb-1.5">
                Email
              </Text>
              <TextInput
                style={styles.input}
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                placeholder="seu@email.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setLocalError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                editable={!isLoading}
              />
            </View>

            {/* ── Campo: Senha ──────────────────────────────────────────── */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm font-medium mb-1.5">
                Senha
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  className="flex-1 px-4 py-3 text-gray-800"
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setLocalError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete={mode === 'login' ? 'password' : 'new-password'}
                  returnKeyType={mode === 'register' ? 'next' : 'done'}
                  onSubmitEditing={
                    mode === 'login' ? handleSubmit : undefined
                  }
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  className="px-4"
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-400 text-sm">
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Campo: Confirmar senha (somente cadastro) ─────────────── */}
            {mode === 'register' && (
              <View className="mb-4">
                <Text className="text-gray-600 text-sm font-medium mb-1.5">
                  Confirmar senha
                </Text>
                <TextInput
                  style={styles.input}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                  placeholder="Repita a senha"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setLocalError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!isLoading}
                />
              </View>
            )}

            {/* ── Mensagem de erro ──────────────────────────────────────── */}
            {displayedError !== null && (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-sm leading-relaxed">
                  {displayedError}
                </Text>
              </View>
            )}

            {/* ── Botão principal ───────────────────────────────────────── */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
              className={`rounded-xl py-4 items-center justify-center ${
                isLoading ? 'bg-primary-300' : 'bg-primary-500'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                </Text>
              )}
            </TouchableOpacity>

            {/* ── Divisor ───────────────────────────────────────────────── */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-gray-100" />
              <Text className="text-gray-300 text-xs mx-3">ou</Text>
              <View className="flex-1 h-px bg-gray-100" />
            </View>

            {/* ── Alternar modo login/cadastro ──────────────────────────── */}
            <TouchableOpacity
              onPress={toggleMode}
              disabled={isLoading}
              activeOpacity={0.7}
              className="items-center"
            >
              <Text className="text-gray-500 text-sm">
                {mode === 'login'
                  ? 'Não tem conta? '
                  : 'Já tem conta? '}
                <Text className="text-primary-600 font-semibold">
                  {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
                </Text>
              </Text>
            </TouchableOpacity>

          </View>

          {/* ── Rodapé ────────────────────────────────────────────────────── */}
          <Text className="text-primary-300 text-xs text-center mt-8">
            Seus dados ficam protegidos e{'\n'}armazenados com segurança
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Usamos StyleSheet para propriedades que o NativeWind não suporta diretamente,
// como `fontSize` em TextInput ou estilos de layout complexos.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f2044',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoEmoji: {
    fontSize: 36,
  },
  input: {
    fontSize: 15,
    color: '#1f2937',
  },
  inputFlex: {
    flex: 1,
  },
});
