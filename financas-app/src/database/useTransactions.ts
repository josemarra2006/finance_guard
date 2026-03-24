// caminho: src/database/useTransactions.ts
import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type {
  Transaction,
  NewTransaction,
  FinancialSummary,
  TransactionType,
} from '../types/database';

// ─── Types para retorno do hook ───────────────────────────────────────────────

interface UseTransactionsReturn {
  /** Lista de transações ordenadas da mais recente para a mais antiga */
  transactions: Transaction[];
  /** True enquanto a query inicial ou um refresh está em andamento */
  isLoading: boolean;
  /** Mensagem de erro da última operação, ou null se não houve erro */
  error: string | null;
  /**
   * Insere uma nova transação no banco e atualiza a lista.
   * @returns O `id` gerado pelo SQLite para a nova linha.
   */
  addTransaction: (data: NewTransaction) => Promise<number>;
  /**
   * Remove uma transação pelo id e atualiza a lista.
   */
  deleteTransaction: (id: number) => Promise<void>;
  /**
   * Retorna todas as transações de um tipo específico,
   * sem afetar a lista principal.
   */
  getTransactionsByType: (type: TransactionType) => Promise<Transaction[]>;
  /**
   * Calcula o resumo financeiro (totais por tipo e saldo disponível)
   * diretamente do banco, sem depender da lista em memória.
   */
  getFinancialSummary: () => Promise<FinancialSummary>;
  /**
   * Recarrega a lista do banco manualmente.
   * Útil após navegação entre telas ou pull-to-refresh.
   */
  refreshTransactions: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook para operações CRUD na tabela `transactions`.
 *
 * **Requisito:** deve ser chamado dentro de um componente filho
 * do `<SQLiteProvider>` definido em `App.tsx`.
 *
 * Exemplo de uso:
 * ```tsx
 * function MyScreen() {
 *   const { transactions, addTransaction, isLoading } = useTransactions();
 *   // ...
 * }
 * ```
 */
export function useTransactions(): UseTransactionsReturn {
  const db = useSQLiteContext();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── loadTransactions ────────────────────────────────────────────────────
  const loadTransactions = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const rows = await db.getAllAsync<Transaction>(
        'SELECT id, title, amount, type, date FROM transactions ORDER BY date DESC'
      );

      setTransactions(rows);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Erro ao carregar transações';
      setError(message);
      console.error('[useTransactions] loadTransactions:', message);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Carrega na montagem do componente
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // ── addTransaction ──────────────────────────────────────────────────────
  const addTransaction = useCallback(
    async (data: NewTransaction): Promise<number> => {
      // Se não vier data, usa o momento atual em UTC (ISO 8601)
      const date = data.date ?? new Date().toISOString();

      const result = await db.runAsync(
        `INSERT INTO transactions (title, amount, type, date)
         VALUES (?, ?, ?, ?)`,
        data.title,
        data.amount,
        data.type,
        date
      );

      // Atualiza a lista em memória após a inserção
      await loadTransactions();

      return result.lastInsertRowId;
    },
    [db, loadTransactions]
  );

  // ── deleteTransaction ───────────────────────────────────────────────────
  const deleteTransaction = useCallback(
    async (id: number): Promise<void> => {
      await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
      await loadTransactions();
    },
    [db, loadTransactions]
  );

  // ── getTransactionsByType ───────────────────────────────────────────────
  const getTransactionsByType = useCallback(
    async (type: TransactionType): Promise<Transaction[]> => {
      return await db.getAllAsync<Transaction>(
        `SELECT id, title, amount, type, date
         FROM transactions
         WHERE type = ?
         ORDER BY date DESC`,
        type
      );
    },
    [db]
  );

  // ── getFinancialSummary ─────────────────────────────────────────────────
  const getFinancialSummary = useCallback(async (): Promise<FinancialSummary> => {
    // Uma única query agrupa os totais por tipo
    const rows = await db.getAllAsync<{ type: string; total: number }>(
      `SELECT type, SUM(amount) AS total
       FROM transactions
       GROUP BY type`
    );

    const totalIncome =
      rows.find((r) => r.type === 'entrada')?.total ?? 0;
    const totalExpenses =
      rows.find((r) => r.type === 'gasto')?.total ?? 0;
    const totalSavings =
      rows.find((r) => r.type === 'economia')?.total ?? 0;

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      // Saldo disponível: o que sobrou após despesas e transferências para poupança
      balance: totalIncome - totalExpenses - totalSavings,
    };
  }, [db]);

  // ── Retorno do hook ─────────────────────────────────────────────────────
  return {
    transactions,
    isLoading,
    error,
    addTransaction,
    deleteTransaction,
    getTransactionsByType,
    getFinancialSummary,
    refreshTransactions: loadTransactions,
  };
}
