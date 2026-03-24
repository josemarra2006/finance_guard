// caminho: src/database/db.ts
import type { SQLiteDatabase } from 'expo-sqlite';

/** Nome do arquivo de banco de dados criado no sistema de arquivos do app */
export const DATABASE_NAME = 'financas.db';

/**
 * Versão atual do esquema.
 * Incremente este número toda vez que adicionar uma nova migração.
 *
 * Histórico:
 *   0 → 1  Criação das tabelas `transactions` e `goals` (versão inicial)
 */
export const DATABASE_VERSION = 1;

/**
 * Executa as migrações necessárias para trazer o banco à versão atual.
 *
 * Estratégia:
 *  - `PRAGMA user_version` armazena a versão atual do esquema.
 *  - Cada bloco `if (currentVersion < X)` aplica as mudanças incrementais.
 *  - Após todas as migrações, atualiza `user_version` para `DATABASE_VERSION`.
 *
 * Esta função é passada para `SQLiteProvider` via prop `onInit`.
 * O provider aguarda sua resolução antes de renderizar os filhos,
 * garantindo que nenhum componente acesse o banco antes das tabelas existirem.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  // Lê a versão atual gravada no arquivo do banco
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionRow?.user_version ?? 0;

  // Se já está na versão mais recente, não há nada a fazer
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  // ── Migração 0 → 1: esquema inicial ──────────────────────────────────────
  if (currentVersion < 1) {
    await db.execAsync(`
      -- Ativa WAL mode para melhor performance de leitura/escrita concorrente
      PRAGMA journal_mode = WAL;

      -- Tabela de transações financeiras
      CREATE TABLE IF NOT EXISTS transactions (
        id      INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title   TEXT    NOT NULL,
        amount  REAL    NOT NULL,
        type    TEXT    NOT NULL
                  CHECK(type IN ('gasto', 'entrada', 'economia')),
        date    TEXT    NOT NULL
      );

      -- Índice para acelerar filtros e ordenações por data
      CREATE INDEX IF NOT EXISTS idx_transactions_date
        ON transactions (date);

      -- Índice para acelerar filtros por tipo (ex.: soma de 'economia')
      CREATE INDEX IF NOT EXISTS idx_transactions_type
        ON transactions (type);

      -- Tabela de metas financeiras (ex.: compra do apartamento em PG)
      CREATE TABLE IF NOT EXISTS goals (
        id              INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name            TEXT    NOT NULL,
        target_amount   REAL    NOT NULL,
        current_amount  REAL    NOT NULL DEFAULT 0.0,
        deadline_date   TEXT    NOT NULL
      );

      -- Índice para ordenar metas por prazo
      CREATE INDEX IF NOT EXISTS idx_goals_deadline
        ON goals (deadline_date);
    `);
  }

  // Atualiza a versão DEPOIS que todas as migrações foram aplicadas com sucesso.
  // Se qualquer passo anterior lançar erro, esta linha não é atingida,
  // então na próxima abertura do app as migrações serão tentadas novamente.
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
