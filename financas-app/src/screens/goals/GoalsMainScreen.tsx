// caminho: src/screens/goals/GoalsMainScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { GoalsMainScreenProps } from '../../types/navigation';
import { useGoals, type GoalWithProgress } from '../../database/useGoals';

// ─── Constantes de cor ────────────────────────────────────────────────────────

const COLORS = {
  navy: '#0f2044',
  primary: '#2f78f0',
  income: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  expense: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  savings: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
  purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed' },
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

/**
 * Formata um número como moeda BRL.
 * @example formatCurrency(1234.5) → "R$ 1.234,50"
 */
function formatCurrency(value: number): string {
  return 'R$ ' + Math.abs(value)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formata uma string ISO 8601 para "DD/MM/AAAA".
 */
function formatDate(isoDate: string): string {
  const datePart = isoDate.split('T')[0];
  if (!datePart) return isoDate;
  const parts = datePart.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Calcula quantos meses faltam entre hoje e uma data ISO.
 * Retorna 0 se a data já passou.
 */
function monthsUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  const diffMonths = (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return Math.max(0, diffMonths);
}

// ─── Tipo do formulário do modal ──────────────────────────────────────────────

interface GoalForm {
  name: string;
  targetAmount: string;
  deadlineMonths: string;
}

const INITIAL_FORM: GoalForm = {
  name: '',
  targetAmount: '',
  deadlineMonths: '',
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function GoalsMainScreen({ navigation }: GoalsMainScreenProps): React.JSX.Element {
  const {
    goalsWithProgress,
    isLoading,
    error,
    addGoal,
    deleteGoal,
    refreshGoals,
  } = useGoals();

  // ── Estado do modal ───────────────────────────────────────────────────────
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [form, setForm] = useState<GoalForm>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Abrir / fechar modal ──────────────────────────────────────────────────
  const openModal = useCallback((): void => {
    setForm(INITIAL_FORM);
    setFormError(null);
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback((): void => {
    if (isSaving) return;
    setIsModalVisible(false);
    setForm(INITIAL_FORM);
    setFormError(null);
  }, [isSaving]);

  // ── Atualizar campo do formulário ─────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof GoalForm>(key: K, value: GoalForm[K]): void => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setFormError(null);
    },
    []
  );

  // ── Validação do formulário ───────────────────────────────────────────────
  const validateForm = useCallback((): boolean => {
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('O nome da meta é obrigatório.');
      return false;
    }
    if (form.name.trim().length < 2) {
      setFormError('O nome da meta deve ter pelo menos 2 caracteres.');
      return false;
    }
    if (!form.targetAmount.trim()) {
      setFormError('O valor da meta é obrigatório.');
      return false;
    }

    const parsedAmount = parseFloat(form.targetAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Informe um valor numérico maior que zero.');
      return false;
    }

    if (!form.deadlineMonths.trim()) {
      setFormError('O prazo em meses é obrigatório.');
      return false;
    }

    const parsedMonths = parseInt(form.deadlineMonths, 10);
    if (isNaN(parsedMonths) || parsedMonths <= 0) {
      setFormError('Informe um prazo em meses maior que zero.');
      return false;
    }
    if (parsedMonths > 600) {
      setFormError('O prazo máximo é de 600 meses (50 anos).');
      return false;
    }

    return true;
  }, [form]);

  // ── Salvar meta ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async (): Promise<void> => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const parsedAmount = parseFloat(form.targetAmount.replace(',', '.'));
      const parsedMonths = parseInt(form.deadlineMonths, 10);

      // Calcula a data alvo somando X meses a partir de hoje
      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + parsedMonths);
      const deadlineISO = deadline.toISOString();

      await addGoal({
        name: form.name.trim(),
        target_amount: parsedAmount,
        deadline_date: deadlineISO,
        current_amount: 0,
      });

      setIsModalVisible(false);
      setForm(INITIAL_FORM);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao salvar meta. Tente novamente.';
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  }, [form, validateForm, addGoal]);

  // ── Confirmar exclusão ────────────────────────────────────────────────────
  const handleDeleteGoal = useCallback(
    (goalId: number, goalName: string): void => {
      Alert.alert(
        'Excluir meta',
        `Tem certeza que deseja excluir a meta "${goalName}"? Esta ação não pode ser desfeita.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => deleteGoal(goalId),
          },
        ]
      );
    },
    [deleteGoal]
  );

  // ── Navegar para detalhes ─────────────────────────────────────────────────
  const handleGoToDetails = useCallback(
    (goalId: number, goalName: string): void => {
      navigation.navigate('GoalDetails', { goalId, goalName });
    },
    [navigation]
  );

  // ── Renderizar item da FlatList ───────────────────────────────────────────
  const renderGoalItem = useCallback(
    ({ item }: { item: GoalWithProgress }) => {
      const months = monthsUntil(item.deadline_date);
      const progressClamped = Math.min(item.progress_percent, 100);
      const isCompleted = item.progress_percent >= 100;

      return (
        <View style={styles.goalCard}>
          {/* Cabeçalho do card: nome e badge de progresso */}
          <View style={styles.goalCardHeader}>
            <View style={styles.goalCardTitleRow}>
              <Text style={styles.goalEmoji}>🎯</Text>
              <Text style={styles.goalName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <View
              style={[
                styles.progressBadge,
                isCompleted ? styles.progressBadgeCompleted : styles.progressBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.progressBadgeText,
                  isCompleted ? styles.progressBadgeTextCompleted : styles.progressBadgeTextActive,
                ]}
              >
                {isCompleted ? '✓ Concluída' : `${item.progress_percent}%`}
              </Text>
            </View>
          </View>

          {/* Barra de progresso mini */}
          <View style={styles.miniProgressContainer}>
            <View style={styles.miniProgressTrack}>
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    width: `${progressClamped}%`,
                    backgroundColor: isCompleted ? COLORS.income.text : COLORS.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Informações de valor */}
          <View style={styles.goalCardValues}>
            <View style={styles.goalCardValueItem}>
              <Text style={styles.goalCardValueLabel}>Acumulado</Text>
              <Text style={[styles.goalCardValueText, { color: COLORS.savings.text }]}>
                {formatCurrency(item.computed_current_amount)}
              </Text>
            </View>
            <View style={styles.goalCardValueItem}>
              <Text style={styles.goalCardValueLabel}>Meta</Text>
              <Text style={[styles.goalCardValueText, { color: COLORS.navy }]}>
                {formatCurrency(item.target_amount)}
              </Text>
            </View>
            <View style={styles.goalCardValueItem}>
              <Text style={styles.goalCardValueLabel}>Prazo</Text>
              <Text style={[styles.goalCardValueText, { color: COLORS.purple.text }]}>
                {months > 0 ? `${months} meses` : 'Expirado'}
              </Text>
            </View>
          </View>

          {/* Botões de ação */}
          <View style={styles.goalCardActions}>
            <TouchableOpacity
              onPress={() => handleGoToDetails(item.id, item.name)}
              activeOpacity={0.8}
              style={styles.detailsButton}
            >
              <Text style={styles.detailsButtonText}>📊 Detalhes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteGoal(item.id, item.name)}
              activeOpacity={0.8}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [handleGoToDetails, handleDeleteGoal]
  );

  const keyExtractor = useCallback(
    (item: GoalWithProgress) => String(item.id),
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={goalsWithProgress}
        keyExtractor={keyExtractor}
        renderItem={renderGoalItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onRefresh={refreshGoals}
        refreshing={isLoading}
        ListHeaderComponent={
          <>
            {/* ── Cabeçalho ──────────────────────────────────────────── */}
            <View style={styles.screenHeader}>
              <View>
                <Text style={styles.screenTitle}>Suas Metas</Text>
                <Text style={styles.screenSubtitle}>
                  Acompanhe o progresso das suas metas financeiras
                </Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>🎯</Text>
              </View>
            </View>

            {/* ── Botão + Nova Meta ──────────────────────────────────── */}
            <TouchableOpacity
              onPress={openModal}
              activeOpacity={0.85}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ Nova meta</Text>
            </TouchableOpacity>

            {/* ── Dica de vínculo ────────────────────────────────────── */}
            <View style={styles.tipContainer}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipText}>
                O valor acumulado de cada meta é calculado automaticamente
                a partir das economias registradas com o{' '}
                <Text style={styles.tipHighlight}>mesmo título</Text> da meta.
              </Text>
            </View>

            {/* ── Erro do hook ───────────────────────────────────────── */}
            {error !== null && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️ {error}</Text>
              </View>
            )}

            {/* ── Label da seção ─────────────────────────────────────── */}
            {goalsWithProgress.length > 0 && (
              <Text style={styles.sectionLabel}>
                {goalsWithProgress.length}{' '}
                {goalsWithProgress.length === 1 ? 'meta cadastrada' : 'metas cadastradas'}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Carregando metas…</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>Nenhuma meta criada</Text>
              <Text style={styles.emptySubtext}>
                Toque em "+ Nova meta" acima para{'\n'}
                definir seu primeiro objetivo financeiro.
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View style={styles.bottomSpacing} />}
      />

      {/* ── Modal de criação de meta ──────────────────────────────────────── */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContainer}>
              {/* Barra de arrastar (visual) */}
              <View style={styles.modalDragBar} />

              {/* Cabeçalho do modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nova meta</Text>
                <TouchableOpacity
                  onPress={closeModal}
                  disabled={isSaving}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ── Campo: Nome da meta ────────────────────────────────── */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nome da meta</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Apartamento PG, Carro novo…"
                  placeholderTextColor="#9ca3af"
                  value={form.name}
                  onChangeText={(text) => updateField('name', text)}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  editable={!isSaving}
                  maxLength={80}
                />
                <Text style={styles.fieldHint}>
                  Use o mesmo nome ao registrar economias no Dashboard
                </Text>
              </View>

              {/* ── Campo: Valor da meta ───────────────────────────────── */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Valor da meta (R$)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 250000"
                  placeholderTextColor="#9ca3af"
                  value={form.targetAmount}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.,]/g, '');
                    updateField('targetAmount', filtered);
                  }}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  editable={!isSaving}
                />
              </View>

              {/* ── Campo: Prazo em meses ──────────────────────────────── */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Prazo (em meses)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 24 (para 2 anos)"
                  placeholderTextColor="#9ca3af"
                  value={form.deadlineMonths}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9]/g, '');
                    updateField('deadlineMonths', filtered);
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  editable={!isSaving}
                  onSubmitEditing={handleSave}
                />
                {form.deadlineMonths.trim().length > 0 && (
                  <Text style={styles.fieldHint}>
                    ≈ {(parseInt(form.deadlineMonths, 10) / 12).toFixed(1)} anos
                  </Text>
                )}
              </View>

              {/* ── Mensagem de erro ───────────────────────────────────── */}
              {formError !== null && (
                <View style={styles.formErrorContainer}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              )}

              {/* ── Botão Salvar ───────────────────────────────────────── */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Criar meta</Text>
                )}
              </TouchableOpacity>

              {/* Botão cancelar */}
              <TouchableOpacity
                onPress={closeModal}
                disabled={isSaving}
                activeOpacity={0.7}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  separator: {
    height: 12,
  },
  bottomSpacing: {
    height: 40,
  },

  // ── Cabeçalho da tela ──────────────────────────────────────────────────
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
    backgroundColor: '#faf5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 22,
  },

  // ── Botão de adicionar ─────────────────────────────────────────────────
  addButton: {
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
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Dica de vínculo ─────────────────────────────────────────────────────
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  tipEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  tipHighlight: {
    fontWeight: '700',
    color: '#1d4ed8',
  },

  // ── Erro banner ─────────────────────────────────────────────────────────
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#dc2626',
    lineHeight: 18,
  },

  // ── Section label ───────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },

  // ── Estados centralizados ───────────────────────────────────────────────
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#9ca3af',
  },

  // ── Estado vazio ────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Card de meta ────────────────────────────────────────────────────────
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 8,
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  progressBadgeActive: {
    backgroundColor: '#eff6ff',
  },
  progressBadgeCompleted: {
    backgroundColor: '#f0fdf4',
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBadgeTextActive: {
    color: COLORS.primary,
  },
  progressBadgeTextCompleted: {
    color: COLORS.income.text,
  },

  // ── Mini barra de progresso ─────────────────────────────────────────────
  miniProgressContainer: {
    marginBottom: 14,
  },
  miniProgressTrack: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },

  // ── Valores ─────────────────────────────────────────────────────────────
  goalCardValues: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  goalCardValueItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  goalCardValueLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  goalCardValueText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // ── Botões de ação ──────────────────────────────────────────────────────
  goalCardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },

  // ── Modal ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingTop: 12,
  },
  modalDragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.navy,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },

  // ── Campos do formulário ──────────────────────────────────────────────
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

  // ── Erro do formulário ────────────────────────────────────────────────
  formErrorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  formErrorText: {
    fontSize: 13,
    color: '#dc2626',
    lineHeight: 18,
  },

  // ── Botões de ação do modal ───────────────────────────────────────────
  saveButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
  },
  cancelButton: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
});
