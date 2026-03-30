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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ConfiguracoesScreenProps } from '../types/navigation';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Theme } from '../store/useSettingsStore';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme, ACCENT_PRESETS, hexAlpha } from '../contexts/ThemeContext';

// ─── Constantes semânticas de cor ─────────────────────────────────────────────
//
// Estas cores são FIXAS e nunca são substituídas pelo accentColor.
// Representam estados financeiros (entrada, gasto, economia) e devem ser
// consistentes com o resto do app para não confundir o usuário.

const SEMANTIC = {
  income:  { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  expense: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  savings: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
  purple:  { bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed' },
};

// ─── Opções de tema ───────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: Theme; label: string; emoji: string }[] = [
  { value: 'light',  label: 'Claro',   emoji: '☀️' },
  { value: 'dark',   label: 'Escuro',  emoji: '🌙' },
  { value: 'system', label: 'Sistema', emoji: '⚙️' },
];

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return 'R$ ' + Math.abs(value)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function maskApiKey(key: string): string {
  if (key.length <= 10) return '•'.repeat(key.length);
  const start = key.slice(0, 7);
  const end = key.slice(-3);
  return `${start}${'•'.repeat(5)}${end}`;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ConfiguracoesScreen(
  _props: ConfiguracoesScreenProps,
): React.JSX.Element {
  // ── Tema dinâmico ──────────────────────────────────────────────────────
  const { accentColor, isDark } = useAppTheme();

  // ── Zustand store ─────────────────────────────────────────────────────
  const userName        = useSettingsStore((s) => s.userName);
  const monthlyIncome   = useSettingsStore((s) => s.monthlyIncome);
  const groqApiKey      = useSettingsStore((s) => s.groqApiKey);
  const theme           = useSettingsStore((s) => s.theme);
  const storedAccent    = useSettingsStore((s) => s.accentColor);

  const setUserName     = useSettingsStore((s) => s.setUserName);
  const setMonthlyIncome = useSettingsStore((s) => s.setMonthlyIncome);
  const setGroqApiKey   = useSettingsStore((s) => s.setGroqApiKey);
  const setTheme        = useSettingsStore((s) => s.setTheme);
  const setAccentColor  = useSettingsStore((s) => s.setAccentColor);
  const resetSettings   = useSettingsStore((s) => s.resetSettings);

  // ── Auth ──────────────────────────────────────────────────────────────
  const { signOut, profile } = useAuth();

  // ── Estado local dos campos editáveis (Perfil + API Key) ──────────────
  // Tema e cor aplicam imediatamente via Zustand — não precisam de estado local.
  const [editName,   setEditName]   = useState<string>(userName);
  const [editIncome, setEditIncome] = useState<string>(
    monthlyIncome > 0 ? String(monthlyIncome) : '',
  );
  const [editApiKey,  setEditApiKey]  = useState<string>(groqApiKey);
  const [showApiKey,  setShowApiKey]  = useState<boolean>(false);
  const [saved,       setSaved]       = useState<boolean>(false);

  // Sincroniza se o store mudar externamente (ex: reset)
  useEffect(() => {
    setEditName(userName);
    setEditIncome(monthlyIncome > 0 ? String(monthlyIncome) : '');
    setEditApiKey(groqApiKey);
  }, [userName, monthlyIncome, groqApiKey]);

  // ── Salvar Perfil + API Key ────────────────────────────────────────────
  const handleSave = useCallback((): void => {
    setUserName(editName.trim());

    const parsedIncome = parseFloat(editIncome.replace(',', '.'));
    if (!isNaN(parsedIncome) && parsedIncome >= 0) {
      setMonthlyIncome(parsedIncome);
    } else {
      setMonthlyIncome(0);
    }

    setGroqApiKey(editApiKey.trim());

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [editName, editIncome, editApiKey, setUserName, setMonthlyIncome, setGroqApiKey]);

  // ── Resetar ────────────────────────────────────────────────────────────
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
      ],
    );
  }, [resetSettings]);

  // ── Logout ─────────────────────────────────────────────────────────────
  const handleLogout = useCallback((): void => {
    Alert.alert(
      'Sair da conta',
      'Você será desconectado. Seus dados locais serão mantidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => signOut() },
      ],
    );
  }, [signOut]);

  // ── Dirty check (apenas Perfil + API Key) ─────────────────────────────
  const hasChanges =
    editName.trim() !== userName ||
    editApiKey.trim() !== groqApiKey ||
    (() => {
      const parsed = parseFloat(editIncome.replace(',', '.'));
      return !isNaN(parsed) ? parsed !== monthlyIncome : monthlyIncome !== 0;
    })();

  // ── Paleta de cores dinâmica baseada em isDark ──────────────────────────
  // Computada uma vez por render para uso em todos os elementos da tela.
  const palette = {
    screenBg:      isDark ? '#0f172a' : '#f9fafb',
    cardBg:        isDark ? '#1e293b' : '#ffffff',
    cardBorder:    isDark ? '#334155' : '#e5e7eb',
    sectionTitle:  isDark ? '#f1f5f9' : '#0f2044',
    subtitleText:  isDark ? '#94a3b8' : '#6b7280',
    labelText:     isDark ? '#cbd5e1' : '#374151',
    inputBg:       isDark ? '#0f172a' : '#f9fafb',
    inputBorder:   isDark ? '#334155' : '#e5e7eb',
    inputText:     isDark ? '#f1f5f9' : '#1f2937',
    hintText:      isDark ? '#64748b' : '#9ca3af',
    readOnlyBg:    isDark ? '#334155' : '#f3f4f6',
    readOnlyBadge: isDark ? '#475569' : '#e5e7eb',
    toggleBtnBg:   isDark ? '#334155' : '#f3f4f6',
    logoutBg:      isDark ? '#1e293b' : '#f9fafb',
    footerText:    isDark ? '#475569' : '#d1d5db',
    badgeBg:       isDark ? '#1e293b' : '#f3f4f6',
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.screenBg }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Cabeçalho da tela ───────────────────────────────────── */}
        <View style={styles.screenHeader}>
          <View>
            <Text style={[styles.screenTitle, { color: palette.sectionTitle }]}>
              Configurações
            </Text>
            <Text style={[styles.screenSubtitle, { color: palette.subtitleText }]}>
              Personalize o app e configure integrações
            </Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: palette.badgeBg }]}>
            <Text style={styles.headerBadgeText}>⚙️</Text>
          </View>
        </View>

        {/* ── Banner de sucesso ──────────────────────────────────── */}
        {saved && (
          <View style={styles.savedBanner}>
            <Text style={styles.savedBannerText}>✓ Configurações salvas com sucesso!</Text>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════
            SEÇÃO 1: PERFIL
        ══════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionCard, {
          backgroundColor: palette.cardBg,
          borderColor:     palette.cardBorder,
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>👤</Text>
            <Text style={[styles.sectionTitle, { color: palette.sectionTitle }]}>
              Perfil
            </Text>
          </View>

          {/* Email (somente leitura, vem do Supabase) */}
          {profile?.email ? (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: palette.labelText }]}>Email</Text>
              <View style={[styles.readOnlyField, {
                backgroundColor: palette.readOnlyBg,
                borderColor:     palette.cardBorder,
              }]}>
                <Text style={[styles.readOnlyText, { color: palette.subtitleText }]}>
                  {profile.email}
                </Text>
                <View style={[styles.readOnlyBadge, { backgroundColor: palette.readOnlyBadge }]}>
                  <Text style={[styles.readOnlyBadgeText, { color: palette.subtitleText }]}>
                    Supabase
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Nome */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: palette.labelText }]}>
              Nome de exibição
            </Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: palette.inputBg,
                borderColor:     palette.inputBorder,
                color:           palette.inputText,
              }]}
              placeholder="Como você quer ser chamado?"
              placeholderTextColor={palette.hintText}
              value={editName}
              onChangeText={setEditName}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              maxLength={50}
            />
            <Text style={[styles.fieldHint, { color: palette.hintText }]}>
              Exibido na saudação do Dashboard
            </Text>
          </View>

          {/* Renda mensal */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: palette.labelText }]}>
              Renda mensal (R$)
            </Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: palette.inputBg,
                borderColor:     palette.inputBorder,
                color:           palette.inputText,
              }]}
              placeholder="Ex: 5000"
              placeholderTextColor={palette.hintText}
              value={editIncome}
              onChangeText={(text) =>
                setEditIncome(text.replace(/[^0-9.,]/g, ''))
              }
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            <Text style={[styles.fieldHint, { color: palette.hintText }]}>
              Usada pela IA para analisar a viabilidade das suas metas
            </Text>
            {monthlyIncome > 0 && (
              <View style={styles.currentValueRow}>
                <Text style={[styles.currentValueLabel, { color: palette.hintText }]}>
                  Valor salvo:
                </Text>
                <Text style={[styles.currentValueAmount, { color: SEMANTIC.savings.text }]}>
                  {formatCurrency(monthlyIncome)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            SEÇÃO 2: INTEGRAÇÃO COM IA
        ══════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionCard, {
          backgroundColor: palette.cardBg,
          borderColor:     palette.cardBorder,
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🤖</Text>
            <Text style={[styles.sectionTitle, { color: palette.sectionTitle }]}>
              Integração com IA
            </Text>
          </View>

          {/* Banner informativo */}
          <View style={[styles.aiInfoBanner, {
            backgroundColor: isDark ? '#2e1065' : SEMANTIC.purple.bg,
            borderColor:     isDark ? '#7c3aed' : SEMANTIC.purple.border,
          }]}>
            <Text style={styles.aiInfoEmoji}>ℹ️</Text>
            <Text style={[styles.aiInfoText, {
              color: isDark ? '#c4b5fd' : SEMANTIC.purple.text,
            }]}>
              A análise de viabilidade das metas utiliza a API do Groq (LLaMA 3.3 70B).
              Sua chave é armazenada apenas localmente no dispositivo e enviada
              diretamente para os servidores do Groq.
            </Text>
          </View>

          {/* Campo da chave */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: palette.labelText }]}>
              Chave da API do Groq
            </Text>
            <View style={styles.apiKeyRow}>
              <TextInput
                style={[styles.textInput, styles.apiKeyInput, {
                  backgroundColor: palette.inputBg,
                  borderColor:     palette.inputBorder,
                  color:           palette.inputText,
                }]}
                placeholder="gsk_..."
                placeholderTextColor={palette.hintText}
                value={
                  showApiKey
                    ? editApiKey
                    : editApiKey.length > 0
                    ? maskApiKey(editApiKey)
                    : ''
                }
                onChangeText={setEditApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="done"
                editable={showApiKey || editApiKey.length === 0}
              />
              <TouchableOpacity
                onPress={() => setShowApiKey((prev) => !prev)}
                activeOpacity={0.7}
                style={[styles.toggleBtn, {
                  backgroundColor: palette.toggleBtnBg,
                  borderColor:     palette.cardBorder,
                }]}
              >
                <Text style={[styles.toggleBtnText, { color: palette.subtitleText }]}>
                  {showApiKey ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.fieldHint, { color: palette.hintText }]}>
              Obtenha sua chave em console.groq.com → API Keys
            </Text>

            {/* Status da chave */}
            {groqApiKey.length > 0 ? (
              <View style={styles.keyStatusActive}>
                <Text style={styles.keyStatusEmoji}>✓</Text>
                <Text style={styles.keyStatusTextActive}>Chave configurada</Text>
              </View>
            ) : (
              <View style={styles.keyStatusInactive}>
                <Text style={styles.keyStatusEmoji}>✗</Text>
                <Text style={styles.keyStatusTextInactive}>Chave não configurada</Text>
              </View>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            SEÇÃO 3: APARÊNCIA   ← NOVA EM FASE 7
        ══════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionCard, {
          backgroundColor: palette.cardBg,
          borderColor:     palette.cardBorder,
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🎨</Text>
            <Text style={[styles.sectionTitle, { color: palette.sectionTitle }]}>
              Aparência
            </Text>
          </View>

          {/* ── Seletor de tema ─────────────────────────────────── */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: palette.labelText }]}>Tema</Text>

            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((option) => {
                const isSelected = theme === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setTheme(option.value)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`Tema ${option.label}`}
                    style={[
                      styles.themeBtn,
                      {
                        /*
                         * Selecionado: tint leve do accentColor como background
                         * + borda sólida do accentColor.
                         * Não selecionado: fundo neutro + borda sutil.
                         */
                        backgroundColor: isSelected
                          ? hexAlpha(accentColor, 0.10)
                          : palette.inputBg,
                        borderColor: isSelected ? accentColor : palette.cardBorder,
                        borderWidth: isSelected ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={styles.themeBtnEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.themeBtnLabel,
                        {
                          color:      isSelected ? accentColor : palette.subtitleText,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hint dinâmico baseado na seleção atual */}
            <Text style={[styles.fieldHint, { color: palette.hintText }]}>
              {theme === 'system'
                ? 'Seguindo as configurações do dispositivo'
                : theme === 'dark'
                ? 'Tema escuro ativado — bom para ambientes com pouca luz'
                : 'Tema claro ativado'}
            </Text>
          </View>

          {/* ── Seletor de cor de destaque ──────────────────────── */}
          <View style={[styles.fieldContainer, styles.lastField]}>
            <Text style={[styles.fieldLabel, { color: palette.labelText }]}>
              Cor de destaque
            </Text>

            <View style={styles.accentRow}>
              {ACCENT_PRESETS.map((preset) => {
                const isSelected = storedAccent === preset.color;

                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => setAccentColor(preset.color)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`Cor ${preset.label}`}
                    style={styles.accentItem}
                  >
                    {/*
                     * Anel externo: visível apenas quando selecionado.
                     * Usa a própria cor do preset como borda, criando um halo
                     * que indica claramente qual cor está ativa.
                     */}
                    <View
                      style={[
                        styles.accentRing,
                        {
                          borderColor: isSelected ? preset.color : 'transparent',
                          backgroundColor: isSelected
                            ? hexAlpha(preset.color, 0.10)
                            : 'transparent',
                        },
                      ]}
                    >
                      {/* Círculo de cor interno */}
                      <View
                        style={[
                          styles.accentCircle,
                          { backgroundColor: preset.color },
                        ]}
                      >
                        {isSelected && (
                          <Text style={styles.accentCheck}>✓</Text>
                        )}
                      </View>
                    </View>

                    {/* Label abaixo do círculo */}
                    <Text
                      style={[
                        styles.accentLabel,
                        {
                          color:      isSelected ? preset.color : palette.hintText,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldHint, { color: palette.hintText }]}>
              Aplicada na navegação ativa, ícones de destaque e seleções de UI.
              As cores financeiras (verde, vermelho, azul) permanecem inalteradas.
            </Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            BOTÃO SALVAR (Perfil + API Key)
            Tema e accentColor salvam automaticamente — não precisam deste botão.
        ══════════════════════════════════════════════════════════ */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          style={[
            styles.saveButton,
            {
              backgroundColor: hasChanges ? '#0f2044' : (isDark ? '#334155' : '#93a8c9'),
              shadowOpacity:   hasChanges ? 0.25 : 0,
              elevation:       hasChanges ? 6 : 0,
            },
          ]}
        >
          <Text style={styles.saveButtonText}>
            {hasChanges ? 'Salvar alterações' : '✓ Tudo salvo'}
          </Text>
        </TouchableOpacity>

        {/* ══════════════════════════════════════════════════════════
            SEÇÃO 4: CONTA
        ══════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionCard, {
          backgroundColor: palette.cardBg,
          borderColor:     palette.cardBorder,
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🔐</Text>
            <Text style={[styles.sectionTitle, { color: palette.sectionTitle }]}>
              Conta
            </Text>
          </View>

          {/* Resetar configurações */}
          <TouchableOpacity
            onPress={handleReset}
            activeOpacity={0.75}
            style={styles.dangerBtn}
          >
            <Text style={styles.dangerBtnEmoji}>🗑️</Text>
            <View style={styles.dangerBtnContent}>
              <Text style={styles.dangerBtnTitle}>Resetar configurações</Text>
              <Text style={[styles.dangerBtnSub, { color: palette.hintText }]}>
                Limpa nome, renda e chave da API
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sair da conta */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.75}
            style={[styles.logoutBtn, {
              backgroundColor: palette.logoutBg,
              borderColor:     palette.cardBorder,
            }]}
          >
            <Text style={styles.logoutBtnEmoji}>🚪</Text>
            <View style={styles.logoutBtnContent}>
              <Text style={[styles.logoutBtnTitle, { color: palette.inputText }]}>
                Sair da conta
              </Text>
              <Text style={[styles.logoutBtnSub, { color: palette.hintText }]}>
                Desconectar do Supabase
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Rodapé ─────────────────────────────────────────────── */}
        <Text style={[styles.footerText, { color: palette.footerText }]}>
          FinançasPRO v1.0.0{'\n'}
          Dados armazenados localmente com segurança
        </Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
//
// Propriedades dinâmicas (cores que variam com isDark ou accentColor) são
// aplicadas como inline style props dentro do JSX.
// Aqui ficam apenas as propriedades estáticas de layout e dimensões.

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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

  // ── Cabeçalho ──────────────────────────────────────────────────────────
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 22,
  },

  // ── Banner de sucesso ───────────────────────────────────────────────────
  savedBanner: {
    backgroundColor: SEMANTIC.income.bg,
    borderWidth: 1.5,
    borderColor: SEMANTIC.income.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  savedBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: SEMANTIC.income.text,
  },

  // ── Card de seção ───────────────────────────────────────────────────────
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
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
  },

  // ── Campos genéricos ────────────────────────────────────────────────────
  fieldContainer: {
    marginBottom: 16,
  },
  lastField: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
  },
  fieldHint: {
    fontSize: 11,
    marginTop: 5,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },

  // ── Campo somente leitura ───────────────────────────────────────────────
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
  },
  readOnlyBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readOnlyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Valor atual salvo ────────────────────────────────────────────────────
  currentValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  currentValueLabel: {
    fontSize: 11,
  },
  currentValueAmount: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── API key ─────────────────────────────────────────────────────────────
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiKeyInput: {
    flex: 1,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  keyStatusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: SEMANTIC.income.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  keyStatusInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: SEMANTIC.expense.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  keyStatusEmoji: {
    fontSize: 12,
    fontWeight: '700',
  },
  keyStatusTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: SEMANTIC.income.text,
  },
  keyStatusTextInactive: {
    fontSize: 11,
    fontWeight: '700',
    color: SEMANTIC.expense.text,
  },
  aiInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
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
    lineHeight: 17,
  },

  // ── Seletor de tema ─────────────────────────────────────────────────────
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    // borderColor e backgroundColor aplicados inline
  },
  themeBtnEmoji: {
    fontSize: 22,
  },
  themeBtnLabel: {
    fontSize: 12,
    // color e fontWeight aplicados inline
  },

  // ── Seletor de cor de destaque ──────────────────────────────────────────
  accentRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
  },
  accentItem: {
    alignItems: 'center',
    gap: 6,
  },
  accentRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    // borderColor e backgroundColor aplicados inline
  },
  accentCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor aplicado inline
  },
  accentCheck: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  accentLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
    // color e fontWeight aplicados inline
  },

  // ── Botão Salvar ────────────────────────────────────────────────────────
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0f2044',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // backgroundColor, shadowOpacity e elevation aplicados inline
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Botões de conta ─────────────────────────────────────────────────────
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC.expense.bg,
    borderWidth: 1.5,
    borderColor: SEMANTIC.expense.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 10,
  },
  dangerBtnEmoji: {
    fontSize: 18,
  },
  dangerBtnContent: {
    flex: 1,
  },
  dangerBtnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: SEMANTIC.expense.text,
    marginBottom: 2,
  },
  dangerBtnSub: {
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  logoutBtnEmoji: {
    fontSize: 18,
  },
  logoutBtnContent: {
    flex: 1,
  },
  logoutBtnTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  logoutBtnSub: {
    fontSize: 11,
  },

  // ── Rodapé ─────────────────────────────────────────────────────────────
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 8,
  },
});