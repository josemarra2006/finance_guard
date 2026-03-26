// caminho: src/screens/goals/GoalDetailsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { GoalDetailsScreenProps } from '../../types/navigation';
import { useGoals, type GoalWithProgress } from '../../database/useGoals';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  analyzeGoalViability,
  type FinancialContext,
} from '../../services/groqApi';

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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function GoalDetailsScreen({ route }: GoalDetailsScreenProps): React.JSX.Element {
  const { goalId, goalName } = route.params;

  // ── Hooks de dados ──────────────────────────────────────────────────────
  const {
    getGoalWithProgressById,
    getAverageMonthlyExpenses,
    getAverageMonthlySavings,
  } = useGoals();

  const groqApiKey = useSettingsStore((s) => s.groqApiKey);
  const monthlyIncome = useSettingsStore((s) => s.monthlyIncome);

  // ── Estado local ────────────────────────────────────────────────────────
  const [goal, setGoal] = useState<GoalWithProgress | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState<boolean>(true);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);

  // ── Carregar meta ───────────────────────────────────────────────────────
  const loadGoal = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingGoal(true);
      setGoalError(null);
      const data = await getGoalWithProgressById(goalId);
      if (!data) {
        setGoalError('Meta não encontrada.');
        return;
      }
      setGoal(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar meta';
      setGoalError(message);
      console.error('[GoalDetailsScreen] loadGoal:', message);
    } finally {
      setIsLoadingGoal(false);
    }
  }, [goalId, getGoalWithProgressById]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  // ── Analisar viabilidade com IA ─────────────────────────────────────────
  const handleAnalyze = useCallback(async (): Promise<void> => {
    if (!goal) return;

    setIsAnalyzing(true);
    setAiError(null);
    setAiAnalysis('');

    try {
      const avgExpenses = await getAverageMonthlyExpenses();
      const avgSavings = await getAverageMonthlySavings();
      const months = monthsUntil(goal.deadline_date);

      const context: FinancialContext = {
        monthlyIncome,
        averageMonthlyExpenses: avgExpenses,
        averageMonthlySavings: avgSavings,
        goalName: goal.name,
        targetAmount: goal.target_amount,
        currentAmount: goal.computed_current_amount,
        deadlineDate: goal.deadline_date,
        monthsRemaining: months,
      };

      const result = await analyzeGoalViability(groqApiKey, context);

      if (result.success) {
        setAiAnalysis(result.analysis);
        setHasAnalyzed(true);
      } else {
        setAiError(result.errorMessage);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro inesperado na análise.';
      setAiError(message);
      console.error('[GoalDetailsScreen] handleAnalyze:', message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [goal, groqApiKey, monthlyIncome, getAverageMonthlyExpenses, getAverageMonthlySavings]);

  // ── Estado de carregamento ────────────────────────────────────────────────
  if (isLoadingGoal) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando meta…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Estado de erro ────────────────────────────────────────────────────────
  if (goalError !== null || !goal) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Erro ao carregar</Text>
          <Text style={styles.errorSubtext}>{goalError ?? 'Meta não encontrada.'}</Text>
          <TouchableOpacity
            onPress={loadGoal}
            style={styles.retryButton}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Cálculos derivados ────────────────────────────────────────────────────
  const months = monthsUntil(goal.deadline_date);
  const remaining = goal.target_amount - goal.computed_current_amount;
  const progressClamped = Math.min(goal.progress_percent, 100);
  const isCompleted = goal.progress_percent >= 100;
  const requiredMonthly = months > 0 ? remaining / months : remaining;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho da meta ──────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardTop}>
            <Text style={styles.headerEmoji}>🎯</Text>
            <View style={styles.headerCardInfo}>
              <Text style={styles.headerGoalName} numberOfLines={2}>
                {goal.name}
              </Text>
              <Text style={styles.headerDeadline}>
                Prazo: {formatDate(goal.deadline_date)}
                {months > 0 ? ` (${months} meses)` : ' (expirado)'}
              </Text>
            </View>
          </View>

          {/* Badge de status */}
          <View
            style={[
              styles.statusBadge,
              isCompleted ? styles.statusBadgeCompleted : styles.statusBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCompleted ? styles.statusBadgeTextCompleted : styles.statusBadgeTextActive,
              ]}
            >
              {isCompleted ? '✓ Meta atingida!' : `${goal.progress_percent}% concluído`}
            </Text>
          </View>
        </View>

        {/* ── Barra de Progresso Principal ────────────────────────────── */}
        <View style={styles.progressSection}>
          <Text style={styles.progressSectionTitle}>Progresso</Text>

          {/* Labels acima da barra */}
          <View style={styles.progressLabels}>
            <View style={styles.progressLabelLeft}>
              <Text style={styles.progressLabelTitle}>Acumulado</Text>
              <Text style={[styles.progressLabelValue, { color: COLORS.savings.text }]}>
                {formatCurrency(goal.computed_current_amount)}
              </Text>
            </View>
            <View style={styles.progressLabelRight}>
              <Text style={styles.progressLabelTitle}>Meta</Text>
              <Text style={[styles.progressLabelValue, { color: COLORS.navy }]}>
                {formatCurrency(goal.target_amount)}
              </Text>
            </View>
          </View>

          {/* Barra visual */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressClamped}%`,
                    backgroundColor: isCompleted ? COLORS.income.text : COLORS.primary,
                  },
                ]}
              />
            </View>
            {/* Percentual centralizado */}
            <Text
              style={[
                styles.progressBarPercent,
                { color: isCompleted ? COLORS.income.text : COLORS.primary },
              ]}
            >
              {goal.progress_percent}%
            </Text>
          </View>

          {/* Faltam */}
          {!isCompleted && (
            <Text style={styles.remainingText}>
              Faltam {formatCurrency(Math.max(0, remaining))} para atingir a meta
            </Text>
          )}
        </View>

        {/* ── Cards informativos ─────────────────────────────────────── */}
        <View style={styles.infoCardsRow}>
          {/* Card: Valor mensal necessário */}
          <View style={[styles.infoCard, { backgroundColor: COLORS.purple.bg, borderColor: COLORS.purple.border }]}>
            <Text style={styles.infoCardLabel}>Mensal necessário</Text>
            <Text style={[styles.infoCardValue, { color: COLORS.purple.text }]}>
              {months > 0 ? formatCurrency(requiredMonthly) : '—'}
            </Text>
            <Text style={styles.infoCardHint}>
              {months > 0 ? 'para atingir no prazo' : 'prazo expirado'}
            </Text>
          </View>

          {/* Card: Prazo restante */}
          <View style={[styles.infoCard, { backgroundColor: COLORS.savings.bg, borderColor: COLORS.savings.border }]}>
            <Text style={styles.infoCardLabel}>Prazo restante</Text>
            <Text style={[styles.infoCardValue, { color: COLORS.savings.text }]}>
              {months > 0 ? `${months} meses` : 'Expirado'}
            </Text>
            <Text style={styles.infoCardHint}>
              {months > 0 ? `≈ ${(months / 12).toFixed(1)} anos` : 'revise o prazo'}
            </Text>
          </View>
        </View>

        {/* ── Análise da IA (Groq) ───────────────────────────────────── */}
        <View style={styles.aiSection}>
          <View style={styles.aiSectionHeader}>
            <Text style={styles.aiSectionEmoji}>🤖</Text>
            <View style={styles.aiSectionTitleContainer}>
              <Text style={styles.aiSectionTitle}>Análise da IA</Text>
              <Text style={styles.aiSectionSubtitle}>
                Avaliação de viabilidade com base no seu perfil financeiro
              </Text>
            </View>
          </View>

          {/* Botão de análise */}
          {!isAnalyzing && (
            <TouchableOpacity
              onPress={handleAnalyze}
              activeOpacity={0.85}
              style={styles.analyzeButton}
            >
              <Text style={styles.analyzeButtonText}>
                {hasAnalyzed ? '🔄 Analisar novamente' : '🚀 Analisar viabilidade'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Loading da IA */}
          {isAnalyzing && (
            <View style={styles.aiLoadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.aiLoadingText}>
                Analisando sua meta com inteligência artificial…
              </Text>
              <Text style={styles.aiLoadingHint}>
                Isso pode levar alguns segundos
              </Text>
            </View>
          )}

          {/* Erro da IA */}
          {aiError !== null && !isAnalyzing && (
            <View style={styles.aiErrorContainer}>
              <Text style={styles.aiErrorEmoji}>⚠️</Text>
              <Text style={styles.aiErrorText}>{aiError}</Text>
            </View>
          )}

          {/* Resultado da IA */}
          {aiAnalysis.length > 0 && !isAnalyzing && (
            <View style={styles.aiResultContainer}>
              <View style={styles.aiResultHeader}>
                <Text style={styles.aiResultHeaderEmoji}>💡</Text>
                <Text style={styles.aiResultHeaderText}>Resultado da análise</Text>
              </View>
              <Text style={styles.aiResultText}>{aiAnalysis}</Text>
              <View style={styles.aiResultFooter}>
                <Text style={styles.aiResultFooterText}>
                  Powered by Groq — LLaMA 3.3 70B
                </Text>
              </View>
            </View>
          )}

          {/* Aviso sobre configurações */}
          {!hasAnalyzed && !isAnalyzing && aiError === null && (
            <View style={styles.aiInfoContainer}>
              <Text style={styles.aiInfoEmoji}>ℹ️</Text>
              <Text style={styles.aiInfoText}>
                A análise utiliza sua renda mensal (Configurações), média de gastos
                e economias do banco de dados para avaliar a viabilidade da meta.
                Certifique-se de que a chave da API Groq e a renda mensal estão
                configuradas.
              </Text>
            </View>
          )}
        </View>

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

  // ── Estados centralizados ────────────────────────────────────────────────
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Cabeçalho da meta ───────────────────────────────────────────────────
  headerCard: {
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
  headerCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  headerEmoji: {
    fontSize: 32,
    marginTop: 2,
  },
  headerCardInfo: {
    flex: 1,
  },
  headerGoalName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerDeadline: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeActive: {
    backgroundColor: '#eff6ff',
  },
  statusBadgeCompleted: {
    backgroundColor: '#f0fdf4',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: COLORS.primary,
  },
  statusBadgeTextCompleted: {
    color: COLORS.income.text,
  },

  // ── Barra de progresso ──────────────────────────────────────────────────
  progressSection: {
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
  progressSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 14,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabelLeft: {
    alignItems: 'flex-start',
  },
  progressLabelRight: {
    alignItems: 'flex-end',
  },
  progressLabelTitle: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  progressLabelValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 7,
    minWidth: 4,
  },
  progressBarPercent: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
  remainingText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Cards informativos ──────────────────────────────────────────────────
  infoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  infoCardLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  infoCardHint: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // ── Seção da IA ─────────────────────────────────────────────────────────
  aiSection: {
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
  aiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  aiSectionEmoji: {
    fontSize: 24,
    marginTop: 1,
  },
  aiSectionTitleContainer: {
    flex: 1,
  },
  aiSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  aiSectionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // ── Botão de análise ────────────────────────────────────────────────────
  analyzeButton: {
    backgroundColor: COLORS.purple.bg,
    borderWidth: 1.5,
    borderColor: COLORS.purple.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  analyzeButtonText: {
    color: COLORS.purple.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Loading da IA ───────────────────────────────────────────────────────
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  aiLoadingText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  aiLoadingHint: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // ── Erro da IA ──────────────────────────────────────────────────────────
  aiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 10,
  },
  aiErrorEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  aiErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#dc2626',
    lineHeight: 19,
  },

  // ── Resultado da IA ─────────────────────────────────────────────────────
  aiResultContainer: {
    backgroundColor: '#faf5ff',
    borderWidth: 1.5,
    borderColor: '#e9d5ff',
    borderRadius: 14,
    padding: 16,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  aiResultHeaderEmoji: {
    fontSize: 18,
  },
  aiResultHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.purple.text,
  },
  aiResultText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  aiResultFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9d5ff',
    alignItems: 'center',
  },
  aiResultFooterText: {
    fontSize: 10,
    color: '#a78bfa',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Info container ──────────────────────────────────────────────────────
  aiInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  aiInfoEmoji: {
    fontSize: 14,
    marginTop: 1,
  },
  aiInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 17,
  },
});
