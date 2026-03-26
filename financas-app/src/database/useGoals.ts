// caminho: src/database/useGoals.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { Goal, NewGoal } from '../types/database';

// ─── Types para retorno do hook ───────────────────────────────────────────────

/** Meta enriquecida com o valor calculado dinamicamente das economias vinculadas */
export interface GoalWithProgress extends Goal {
  /** Soma das transações do tipo 'economia' cujo título = nome da meta */
  computed_current_amount: number;
  /** Percentual de progresso (0 a 100, pode ultrapassar 100 se já atingiu) */
  progress_percent: number;
}

interface UseGoalsReturn {
  /** Lista de metas ordenadas pelo prazo mais próximo primeiro */
  goals: Goal[];
  /** Lista de metas enriquecidas com o progresso calculado das economias */
  goalsWithProgress: GoalWithProgress[];
  /** True enquanto a query inicial ou um refresh está em andamento */
  isLoading: boolean;
  /** Mensagem de erro da última operação, ou null se não houve erro */
  error: string | null;
  /**
   * Insere uma nova meta no banco e atualiza a lista.
   * @returns O `id` gerado pelo SQLite para a nova linha.
   */
  addGoal: (data: NewGoal) => Promise<number>;
  /**
   * Atualiza o `current_amount` de uma meta para um valor absoluto.
   * Use quando quiser definir o total acumulado diretamente.
   *
   * Para somar um aporte, calcule `goal.current_amount + aporte` antes de chamar.
   */
  updateGoalProgress: (id: number, newCurrentAmount: number) => Promise<void>;
  /**
   * Remove uma meta pelo id e atualiza a lista.
   */
  deleteGoal: (id: number) => Promise<void>;
  /**
   * Busca uma única meta pelo id sem afetar a lista principal.
   * Retorna `null` se não encontrada.
   */
  getGoalById: (id: number) => Promise<Goal | null>;
  /**
   * Busca uma meta pelo id e calcula o valor atual das economias vinculadas.
   * Retorna `null` se a meta não for encontrada.
   */
  getGoalWithProgressById: (id: number) => Promise<GoalWithProgress | null>;
  /**
   * Calcula a soma de todas as transações do tipo 'economia'
   * cujo título (title) seja exatamente igual ao nome fornecido.
   *
   * Esta é a regra de vínculo entre metas e economias:
   * o usuário cria uma transação de economia com o mesmo título da meta.
   *
   * @param goalName Nome exato da meta (case-sensitive)
   * @returns Soma total das economias vinculadas, ou 0 se não houver
   */
  getEconomySumByGoalName: (goalName: string) => Promise<number>;
  /**
   * Calcula a média mensal de gastos do usuário considerando todos os meses
   * com dados no banco. Usado pela IA para avaliar a viabilidade da meta.
   *
   * @returns Média mensal de gastos (valor positivo), ou 0 se não houver dados
   */
  getAverageMonthlyExpenses: () => Promise<number>;
  /**
   * Calcula a média mensal de economias do usuário.
   * Usado pela IA para projetar o ritmo de poupança.
   *
   * @returns Média mensal de economias, ou 0 se não houver dados
   */
  getAverageMonthlySavings: () => Promise<number>;
  /**
   * Recarrega a lista do banco manualmente.
   */
  refreshGoals: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook para operações CRUD na tabela `goals` com cálculo dinâmico
 * do progresso a partir das transações de economia vinculadas.
 *
 * **Requisito:** deve ser chamado dentro de um componente filho
 * do `<SQLiteProvider>` definido em `App.tsx`.
 *
 * Regra de Vínculo:
 *   O valor atual de uma meta é calculado somando todas as transações
 *   do tipo 'economia' cujo `title` seja exatamente igual ao `name` da meta.
 *   Exemplo: Meta "Apartamento PG" → soma de todas economias com título "Apartamento PG".
 *
 * Exemplo de uso:
 * ```tsx
 * function MetasScreen() {
 *   const { goalsWithProgress, addGoal } = useGoals();
 *   // goalsWithProgress[0].computed_current_amount → soma das economias
 *   // goalsWithProgress[0].progress_percent → percentual de progresso
 * }
 * ```
 */
export function useGoals(): UseGoalsReturn {
  const db = useSQLiteContext();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsWithProgress, setGoalsWithProgress] = useState<GoalWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── getEconomySumByGoalName ─────────────────────────────────────────────
  /**
   * Query:
   *   SELECT COALESCE(SUM(amount), 0) AS total
   *   FROM transactions
   *   WHERE type = 'economia' AND title = ?
   *
   * COALESCE garante retorno 0 em vez de NULL quando não há registros.
   */
  const getEconomySumByGoalName = useCallback(
    async (goalName: string): Promise<number> => {
      const row = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM transactions
         WHERE type = 'economia' AND title = ?`,
        goalName
      );
      return row?.total ?? 0;
    },
    [db]
  );

  // ── getAverageMonthlyExpenses ───────────────────────────────────────────
  /**
   * Calcula a média mensal de gastos agrupando por mês (YYYY-MM)
   * e tirando a média das somas mensais.
   *
   * SQL:
   *   SELECT AVG(monthly_total) AS avg_expenses
   *   FROM (
   *     SELECT SUM(amount) AS monthly_total
   *     FROM transactions
   *     WHERE type = 'gasto'
   *     GROUP BY strftime('%Y-%m', date)
   *   )
   */
  const getAverageMonthlyExpenses = useCallback(async (): Promise<number> => {
    const row = await db.getFirstAsync<{ avg_expenses: number | null }>(
      `SELECT AVG(monthly_total) AS avg_expenses
       FROM (
         SELECT SUM(amount) AS monthly_total
         FROM transactions
         WHERE type = 'gasto'
         GROUP BY strftime('%Y-%m', date)
       )`
    );
    return row?.avg_expenses ?? 0;
  }, [db]);

  // ── getAverageMonthlySavings ────────────────────────────────────────────
  /**
   * Calcula a média mensal de economias agrupando por mês (YYYY-MM).
   */
  const getAverageMonthlySavings = useCallback(async (): Promise<number> => {
    const row = await db.getFirstAsync<{ avg_savings: number | null }>(
      `SELECT AVG(monthly_total) AS avg_savings
       FROM (
         SELECT SUM(amount) AS monthly_total
         FROM transactions
         WHERE type = 'economia'
         GROUP BY strftime('%Y-%m', date)
       )`
    );
    return row?.avg_savings ?? 0;
  }, [db]);

  // ── loadGoals ───────────────────────────────────────────────────────────
  const loadGoals = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const rows = await db.getAllAsync<Goal>(
        `SELECT id, name, target_amount, current_amount, deadline_date
         FROM goals
         ORDER BY deadline_date ASC`
      );

      setGoals(rows);

      // Enriquece cada meta com o valor calculado das economias vinculadas
      const enriched: GoalWithProgress[] = await Promise.all(
        rows.map(async (goal) => {
          const computedAmount = await getEconomySumByGoalName(goal.name);
          const progressPercent =
            goal.target_amount > 0
              ? Math.round((computedAmount / goal.target_amount) * 100)
              : 0;

          return {
            ...goal,
            computed_current_amount: computedAmount,
            progress_percent: progressPercent,
          };
        })
      );

      setGoalsWithProgress(enriched);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Erro ao carregar metas';
      setError(message);
      console.error('[useGoals] loadGoals:', message);
    } finally {
      setIsLoading(false);
    }
  }, [db, getEconomySumByGoalName]);

  // Carrega na montagem do componente
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // ── addGoal ─────────────────────────────────────────────────────────────
  const addGoal = useCallback(
    async (data: NewGoal): Promise<number> => {
      const currentAmount = data.current_amount ?? 0;

      const result = await db.runAsync(
        `INSERT INTO goals (name, target_amount, current_amount, deadline_date)
         VALUES (?, ?, ?, ?)`,
        data.name,
        data.target_amount,
        currentAmount,
        data.deadline_date
      );

      await loadGoals();
      return result.lastInsertRowId;
    },
    [db, loadGoals]
  );

  // ── updateGoalProgress ──────────────────────────────────────────────────
  const updateGoalProgress = useCallback(
    async (id: number, newCurrentAmount: number): Promise<void> => {
      const safeAmount = Math.max(0, newCurrentAmount);

      await db.runAsync(
        'UPDATE goals SET current_amount = ? WHERE id = ?',
        safeAmount,
        id
      );

      await loadGoals();
    },
    [db, loadGoals]
  );

  // ── deleteGoal ──────────────────────────────────────────────────────────
  const deleteGoal = useCallback(
    async (id: number): Promise<void> => {
      await db.runAsync('DELETE FROM goals WHERE id = ?', id);
      await loadGoals();
    },
    [db, loadGoals]
  );

  // ── getGoalById ─────────────────────────────────────────────────────────
  const getGoalById = useCallback(
    async (id: number): Promise<Goal | null> => {
      return await db.getFirstAsync<Goal>(
        `SELECT id, name, target_amount, current_amount, deadline_date
         FROM goals
         WHERE id = ?`,
        id
      );
    },
    [db]
  );

  // ── getGoalWithProgressById ─────────────────────────────────────────────
  const getGoalWithProgressById = useCallback(
    async (id: number): Promise<GoalWithProgress | null> => {
      const goal = await db.getFirstAsync<Goal>(
        `SELECT id, name, target_amount, current_amount, deadline_date
         FROM goals
         WHERE id = ?`,
        id
      );

      if (!goal) return null;

      const computedAmount = await getEconomySumByGoalName(goal.name);
      const progressPercent =
        goal.target_amount > 0
          ? Math.round((computedAmount / goal.target_amount) * 100)
          : 0;

      return {
        ...goal,
        computed_current_amount: computedAmount,
        progress_percent: progressPercent,
      };
    },
    [db, getEconomySumByGoalName]
  );

  // ── Retorno do hook ─────────────────────────────────────────────────────
  return {
    goals,
    goalsWithProgress,
    isLoading,
    error,
    addGoal,
    updateGoalProgress,
    deleteGoal,
    getGoalById,
    getGoalWithProgressById,
    getEconomySumByGoalName,
    getAverageMonthlyExpenses,
    getAverageMonthlySavings,
    refreshGoals: loadGoals,
  };
}
