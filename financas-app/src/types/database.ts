// caminho: src/types/database.ts

/**
 * Tipos compartilhados para as entidades do banco de dados SQLite.
 * Usados pelos hooks de banco e opcionalmente pelas telas.
 */

// ─── Transactions ────────────────────────────────────────────────────────────

/** Tipos de transação aceitos pelo CHECK constraint da tabela */
export type TransactionType = 'gasto' | 'entrada' | 'economia';

/** Linha completa da tabela `transactions` (com id gerado pelo banco) */
export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: TransactionType;
  /** Data no formato ISO 8601: ex. "2025-06-15T10:30:00.000Z" */
  date: string;
}

/** Payload para inserção de uma nova transação */
export interface NewTransaction {
  title: string;
  /** Sempre positivo — o tipo define se é saída (gasto/economia) ou entrada */
  amount: number;
  type: TransactionType;
  /**
   * ISO 8601. Se omitido, o hook usa `new Date().toISOString()` automaticamente.
   */
  date?: string;
}

/** Resumo financeiro calculado a partir das transações */
export interface FinancialSummary {
  /** Soma de todas as transações do tipo 'entrada' */
  totalIncome: number;
  /** Soma de todas as transações do tipo 'gasto' */
  totalExpenses: number;
  /** Soma de todas as transações do tipo 'economia' */
  totalSavings: number;
  /** totalIncome - totalExpenses - totalSavings */
  balance: number;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

/** Linha completa da tabela `goals` (com id gerado pelo banco) */
export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  /**
   * Prazo final no formato ISO 8601: ex. "2026-12-31T00:00:00.000Z".
   * Importante para o cálculo de progresso mensal necessário.
   */
  deadline_date: string;
}

/** Payload para inserção de uma nova meta */
export interface NewGoal {
  name: string;
  /** Valor total alvo (ex.: preço do apartamento em Ponta Grossa) */
  target_amount: number;
  /**
   * Prazo ISO 8601. Recomendado usar meia-noite do dia desejado:
   * ex. new Date('2026-12-31').toISOString()
   */
  deadline_date: string;
  /**
   * Valor já acumulado ao criar a meta. Padrão: 0.
   * Útil para migrar economias já existentes.
   */
  current_amount?: number;
}
