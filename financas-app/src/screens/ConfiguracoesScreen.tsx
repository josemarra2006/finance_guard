// caminho: src/screens/ConfiguracoesScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ConfiguracoesScreenProps } from '../types/navigation';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuth } from '../contexts/AuthContext';

// ─── Constantes de cor ────────────────────────────────────────────────────────

const COLORS = {
  navy: '#0f2044',
  primary: '#2f78f0',
  income: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  expense: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  savings: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
  purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed' },
};

// ─── Utilitário ───────────────────────────────────────────────────────────────

/**
 * Formata um número como moeda BRL para exibição.
 * @example formatCurrency(5000) → "R$ 5.000,00"
 */
function formatCurrency(value: number): string {
  return 'R$ ' + Math.abs(value)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Mascara parcialmente uma chave de API para exibição segura.
 * @example maskApiKey("gsk_abc123xyz789") → "gsk_abc•••••789"
 */
function maskApiKey(key: string): string {
  if (key.length <= 10) return '•'.repeat(key.length);
  const start = key.slice(0, 7);
  const end = key.slice(-3);
  return `${start}${'•'.repeat(5)}${end}`;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ConfiguracoesScreen(_props: ConfiguracoesScreenProps): React.JSX.Element {
  // ── Zustand store ───────────────────────────────────────────────────────
  const userName = useSettingsStore((s) => s.userName);
  const monthlyIncome = useSettingsStore((s) => s.monthlyIncome);
  const groqApiKey = useSettingsStore((s) => s.groqApiKey);
  const setUserName = useSettingsStore((s) => s.setUserName);
  const setMonthlyIncome = useSettingsStore((s) => s.setMonthlyIncome);
  const setGroqApiKey = useSettingsStore((s) => s.setGroqApiKey);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  // ── Auth (para logout) ─────────────────────────────────────────────────
  const { signOut, profile } = useAuth();

  // ── Estado local dos campos editáveis ──────────────────────────────────
  const [editName, setEditName] = useState<string>(userName);
  const [editIncome, setEditIncome] = useState<string>(
    monthlyIncome > 0 ? String(monthlyIncome) : ''
  );
  const [editApiKey, setEditApiKey] = useState<string>(groqApiKey);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Sincroniza se o store mudar externamente (ex: reset)
  useEffect(() => {
    setEditName(userName);
    setEditIncome(monthlyIncome > 0 ? String(monthlyIncome) : '');
    setEditApiKey(groqApiKey);
  }, [userName, monthlyIncome, groqApiKey]);

  // ── Salvar alterações ──────────────────────────────────────────────────
  const handleSave = useCallback((): void => {
    // Nome
    setUserName(editName.trim());

    // Renda mensal
    const parsedIncome = parseFloat(editIncome.replace(',', '.'));
    if (!isNaN(parsedIncome) && parsedIncome >= 0) {
      setMonthlyIncome(parsedIncome);
    } else {
      setMonthlyIncome(0);
    }

    // Chave API Groq
    setGroqApiKey(editApiKey.trim());

    // Feedback visual
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [editName, editIncome, editApiKey, setUserName, setMonthlyIncome, setGroqApiKey]);

  // ── Resetar configurações ─────────────────────────────────────────────
  const handleReset = useCallback((): void => {
    Alert.alert(
      'Resetar configurações',
      'Isso irá limpar seu nome, renda mensal e chave da API do Groq. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: () => {
            resetSettings();
            setEditName('');
            setEditIncome('');
            setEditApiKey('');
            setShowApiKey(false);
          },
        },
      ]
    );
  }, [resetSettings]);

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = useCallback((): void => {
    Alert.alert(
      'Sair da conta',
      'Você será desconectado. Seus dados locais serão mantidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  }, [signOut]);

  // ── Verifica se há mudanças não salvas ─────────────────────────────────
  const hasChanges =
    editName.trim() !== userName ||
    editApiKey.trim() !== groqApiKey ||
    (() => {
      const parsed = parseFloat(editIncome.replace(',', '.'));
      return !isNaN(parsed) ? parsed !== monthlyIncome : monthlyIncome !== 0;
    })();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Cabeçalho ──────────────────────────────────────────────── */}
        <View style={styles.screenHeader}>
          <View>
            <Text style={styles.screenTitle}>Configurações</Text>
            <Text style={styles.screenSubtitle}>
              Personalize o app e configure integrações
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>⚙️</Text>
          </View>
        </View>

        {/* ── Feedback de salvo ───────────────────────────────────────── */}
        {saved && (
          <View style={styles.savedBanner}>
            <Text style={styles.savedBannerText}>✓ Configurações salvas com sucesso!</Text>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SEÇÃO 1: PERFIL */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>👤</Text>
            <Text style={styles.sectionTitle}>Perfil</Text>
          </View>

          {/* Email (somente leitura, vem do Supabase) */}
          {profile?.email ? (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>{profile.email}</Text>
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyBadgeText}>Supabase</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Nome */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nome de exibição</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Como você quer ser chamado?"
              placeholderTextColor="#9ca3af"
              value={editName}
              onChangeText={setEditName}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              maxLength={50}
            />
            <Text style={styles.fieldHint}>
              Exibido na saudação do Dashboard
            </Text>
          </View>

          {/* Renda mensal */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Renda mensal (R$)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: 5000"
              placeholderTextColor="#9ca3af"
              value={editIncome}
              onChangeText={(text) => {
                const filtered = text.replace(/[^0-9.,]/g, '');
                setEditIncome(filtered);
              }}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            <Text style={styles.fieldHint}>
              Usada pela IA para analisar a viabilidade das suas metas
            </Text>
            {monthlyIncome > 0 && (
              <View style={styles.currentValueContainer}>
                <Text style={styles.currentValueLabel}>Valor salvo:</Text>
                <Text style={styles.currentValueText}>{formatCurrency(monthlyIncome)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SEÇÃO 2: INTEGRAÇÃO COM IA */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🤖</Text>
            <Text style={styles.sectionTitle}>Integração com IA</Text>
          </View>

          <View style={styles.aiInfoBanner}>
            <Text style={styles.aiInfoEmoji}>ℹ️</Text>
            <Text style={styles.aiInfoText}>
              A análise de viabilidade das metas utiliza a API do Groq (LLaMA 3.3 70B).
              Sua chave é armazenada apenas localmente no dispositivo e enviada
              diretamente para os servidores do Groq.
            </Text>
          </View>

          {/* Chave da API do Groq */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Chave da API do Groq</Text>
            <View style={styles.apiKeyInputRow}>
              <TextInput
                style={[styles.textInput, styles.apiKeyInput]}
                placeholder="gsk_..."
                placeholderTextColor="#9ca3af"
                value={showApiKey ? editApiKey : (editApiKey.length > 0 ? maskApiKey(editApiKey) : '')}
                onChangeText={setEditApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                secureTextEntry={false}
                returnKeyType="done"
                editable={showApiKey || editApiKey.length === 0}
              />
              <TouchableOpacity
                onPress={() => setShowApiKey((prev) => !prev)}
                activeOpacity={0.7}
                style={styles.toggleApiKeyButton}
              >
                <Text style={styles.toggleApiKeyText}>
                  {showApiKey ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldHint}>
              Obtenha sua chave em console.groq.com → API Keys
            </Text>

            {/* Status da chave */}
            {groqApiKey.length > 0 ? (
              <View style={styles.apiKeyStatusActive}>
                <Text style={styles.apiKeyStatusEmoji}>✓</Text>
                <Text style={styles.apiKeyStatusText}>Chave configurada</Text>
              </View>
            ) : (
              <View style={styles.apiKeyStatusInactive}>
                <Text style={styles.apiKeyStatusEmoji}>✗</Text>
                <Text style={styles.apiKeyStatusTextInactive}>Chave não configurada</Text>
              </View>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* BOTÃO SALVAR */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          style={[
            styles.saveButton,
            !hasChanges && styles.saveButtonDisabled,
          ]}
        >
          <Text style={styles.saveButtonText}>
            {hasChanges ? 'Salvar alterações' : '✓ Tudo salvo'}
          </Text>
        </TouchableOpacity>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SEÇÃO 3: CONTA */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🔐</Text>
            <Text style={styles.sectionTitle}>Conta</Text>
          </View>

          {/* Resetar configurações */}
          <TouchableOpacity
            onPress={handleReset}
            activeOpacity={0.75}
            style={styles.dangerButton}
          >
            <Text style={styles.dangerButtonEmoji}>🗑️</Text>
            <View style={styles.dangerButtonContent}>
              <Text style={styles.dangerButtonTitle}>Resetar configurações</Text>
              <Text style={styles.dangerButtonSubtext}>
                Limpa nome, renda e chave da API
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sair da conta */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.75}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonEmoji}>🚪</Text>
            <View style={styles.logoutButtonContent}>
              <Text style={styles.logoutButtonTitle}>Sair da conta</Text>
              <Text style={styles.logoutButtonSubtext}>
                Desconectar do Supabase
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Rodapé ─────────────────────────────────────────────────── */}
        <Text style={styles.footerText}>
          FinançasPRO v1.0.0{'\n'}
          Dados armazenados localmente com segurança
        </Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bottomSpacing: {
    height: 40,
  },

  // ── Cabeçalho ───────────────────────────────────────────────────────────
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 22,
  },

  // ── Banner de salvo ─────────────────────────────────────────────────────
  savedBanner: {
    backgroundColor: COLORS.income.bg,
    borderWidth: 1.5,
    borderColor: COLORS.income.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  savedBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.income.text,
  },

  // ── Seção card ──────────────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },

  // ── Campos ──────────────────────────────────────────────────────────────
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 7,
  },
  fieldHint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 5,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },

  // ── Campo somente leitura ───────────────────────────────────────────────
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#f3f4f6',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
    color: '#6b7280',
  },
  readOnlyBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readOnlyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.3,
  },

  // ── Valor atual salvo ───────────────────────────────────────────────────
  currentValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  currentValueLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  currentValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.savings.text,
  },

  // ── API key input row ───────────────────────────────────────────────────
  apiKeyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiKeyInput: {
    flex: 1,
  },
  toggleApiKeyButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  toggleApiKeyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },

  // ── Status da API key ───────────────────────────────────────────────────
  apiKeyStatusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: COLORS.income.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  apiKeyStatusInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: COLORS.expense.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  apiKeyStatusEmoji: {
    fontSize: 12,
    fontWeight: '700',
  },
  apiKeyStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.income.text,
  },
  apiKeyStatusTextInactive: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.expense.text,
  },

  // ── Banner de info IA ───────────────────────────────────────────────────
  aiInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.purple.bg,
    borderWidth: 1,
    borderColor: COLORS.purple.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  aiInfoEmoji: {
    fontSize: 14,
    marginTop: 1,
  },
  aiInfoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.purple.text,
    lineHeight: 17,
  },

  // ── Botão salvar ────────────────────────────────────────────────────────
  saveButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#93a8c9',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Botões de perigo ────────────────────────────────────────────────────
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 10,
  },
  dangerButtonEmoji: {
    fontSize: 18,
  },
  dangerButtonContent: {
    flex: 1,
  },
  dangerButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.expense.text,
    marginBottom: 2,
  },
  dangerButtonSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // ── Botão de logout ─────────────────────────────────────────────────────
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  logoutButtonEmoji: {
    fontSize: 18,
  },
  logoutButtonContent: {
    flex: 1,
  },
  logoutButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  logoutButtonSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // ── Rodapé ──────────────────────────────────────────────────────────────
  footerText: {
    fontSize: 11,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 8,
  },
});
