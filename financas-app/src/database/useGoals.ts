// caminho: src/database/useGoals.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { Goal, NewGoal } from '../types/database';

// ─── Types para retorno do hook ───────────────────────────────────────────────

interface UseGoalsReturn {
  /** Lista de metas ordenadas pelo prazo mais próximo primeiro */
  goals: Goal[];
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
   * Recarrega a lista do banco manualmente.
   */
  refreshGoals: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook para operações CRUD na tabela `goals`.
 *
 * **Requisito:** deve ser chamado dentro de um componente filho
 * do `<SQLiteProvider>` definido em `App.tsx`.
 *
 * Exemplo de uso na tela de Metas:
 * ```tsx
 * function MetasScreen() {
 *   const { goals, addGoal, updateGoalProgress } = useGoals();
 *   // ...
 * }
 * ```
 *
 * Exemplo — registrar aporte na meta do apartamento:
 * ```tsx
 * const meta = goals.find(g => g.name === 'Apartamento PG');
 * if (meta) {
 *   await updateGoalProgress(meta.id, meta.current_amount + 500);
 * }
 * ```
 */
export function useGoals(): UseGoalsReturn {
  const db = useSQLiteContext();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Erro ao carregar metas';
      setError(message);
      console.error('[useGoals] loadGoals:', message);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

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
      // Garante que o valor nunca fique negativo
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

  // ── Retorno do hook ─────────────────────────────────────────────────────
  return {
    goals,
    isLoading,
    error,
    addGoal,
    updateGoalProgress,
    deleteGoal,
    getGoalById,
    refreshGoals: loadGoals,
  };
}
