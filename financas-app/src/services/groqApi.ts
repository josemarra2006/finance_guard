// caminho: src/services/groqApi.ts

/**
 * Serviço de comunicação com a API do Groq para análise financeira
 * de viabilidade de metas.
 *
 * Usa o endpoint compatível com OpenAI:
 *   POST https://api.groq.com/openai/v1/chat/completions
 *
 * O modelo utilizado é o `llama-3.3-70b-versatile` por ter boa capacidade
 * de raciocínio matemático e geração de texto em português.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Dados financeiros do usuário necessários para a análise da IA */
export interface FinancialContext {
  /** Renda mensal informada pelo usuário (do Zustand) */
  monthlyIncome: number;
  /** Média de gastos mensais (calculada do SQLite) */
  averageMonthlyExpenses: number;
  /** Média de economias mensais (calculada do SQLite) */
  averageMonthlySavings: number;
  /** Nome da meta (ex: "Apartamento PG") */
  goalName: string;
  /** Valor alvo da meta (ex: 250000) */
  targetAmount: number;
  /** Valor já acumulado para esta meta (soma das economias vinculadas) */
  currentAmount: number;
  /** Data limite da meta no formato ISO 8601 */
  deadlineDate: string;
  /** Meses restantes até o prazo */
  monthsRemaining: number;
}

/** Resposta parseada da API do Groq */
export interface GroqAnalysisResult {
  /** Texto completo da análise gerada pela IA */
  analysis: string;
  /** True se a requisição foi bem-sucedida */
  success: boolean;
  /** Mensagem de erro em caso de falha */
  errorMessage: string | null;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 1024;
const TEMPERATURE = 0.4; // Mais determinístico para análise financeira

// ─── Utilitário de formatação ─────────────────────────────────────────────────

/**
 * Formata um número como moeda BRL para o prompt da IA.
 * @example formatBRL(1234.5) → "R$ 1.234,50"
 */
function formatBRL(value: number): string {
  return 'R$ ' + Math.abs(value)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ─── System Prompt ────────────────────────────────────────────────────────────

/**
 * Constrói o system prompt com o contexto financeiro completo do usuário.
 *
 * Diretriz: A IA deve agir como um consultor financeiro objetivo,
 * analisar matematicamente a viabilidade do prazo e, se necessário,
 * calcular uma previsão realista e oferecer 2-3 recomendações diretas.
 */
function buildSystemPrompt(ctx: FinancialContext): string {
  const surplus = ctx.monthlyIncome - ctx.averageMonthlyExpenses;
  const remaining = ctx.targetAmount - ctx.currentAmount;
  const requiredMonthly = ctx.monthsRemaining > 0
    ? remaining / ctx.monthsRemaining
    : remaining;

  return `Você é um consultor financeiro pessoal objetivo e direto, especialista em planejamento de metas.
Analise a viabilidade da meta financeira do usuário com base nos dados reais abaixo.

═══ PERFIL FINANCEIRO DO USUÁRIO ═══
• Renda mensal: ${formatBRL(ctx.monthlyIncome)}
• Média de gastos mensais: ${formatBRL(ctx.averageMonthlyExpenses)}
• Sobra mensal estimada: ${formatBRL(surplus)}
• Média de economia mensal: ${formatBRL(ctx.averageMonthlySavings)}

═══ META FINANCEIRA ═══
• Nome da meta: ${ctx.goalName}
• Valor alvo: ${formatBRL(ctx.targetAmount)}
• Valor já acumulado: ${formatBRL(ctx.currentAmount)}
• Valor restante: ${formatBRL(remaining)}
• Prazo estipulado: ${ctx.monthsRemaining} meses (até ${formatDeadline(ctx.deadlineDate)})
• Valor mensal necessário para atingir no prazo: ${formatBRL(requiredMonthly)}

═══ SUAS TAREFAS ═══

1. **Análise de Viabilidade**: Avalie matematicamente se o prazo é viável considerando a sobra mensal e a média de economia atual. Seja claro e direto: diga "SIM, é viável" ou "NÃO, o prazo é apertado/inviável".

2. **Previsão Realista**: Se o prazo NÃO for viável, calcule em quantos meses o usuário realmente conseguiria atingir a meta mantendo o ritmo atual de economia. Apresente o cálculo de forma simples.

3. **Recomendações**: Forneça exatamente 2 a 3 recomendações práticas e diretas para atingir a meta mais facilmente, sem sacrificar o bem-estar. Considere a realidade financeira do usuário (ex: investimentos, ajustes de gastos, renda extra).

═══ FORMATO DA RESPOSTA ═══
Responda em português brasileiro. Use parágrafos curtos e objetivos.
Use emojis com moderação para tornar a leitura mais agradável.
Não use markdown complexo (sem tabelas ou headers com #).
Mantenha a resposta concisa: máximo 400 palavras.`;
}

/**
 * Formata a data deadline para exibição humana no prompt.
 * @example "2026-12-31T00:00:00.000Z" → "31/12/2026"
 */
function formatDeadline(isoDate: string): string {
  const datePart = isoDate.split('T')[0];
  if (!datePart) return isoDate;
  const parts = datePart.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Envia o contexto financeiro para a API do Groq e retorna a análise da IA.
 *
 * @param apiKey   Chave da API do Groq (armazenada no Zustand)
 * @param context  Dados financeiros completos do usuário e da meta
 * @returns        Resultado da análise com campo de sucesso/erro
 *
 * Tratamento de erros:
 *  - API key vazia → erro amigável orientando configuração
 *  - Erro de rede → mensagem de conectividade
 *  - Erro 401     → chave inválida
 *  - Erro 429     → rate limit excedido
 *  - Outros       → mensagem genérica com detalhes
 */
export async function analyzeGoalViability(
  apiKey: string,
  context: FinancialContext
): Promise<GroqAnalysisResult> {
  // Validação da API key
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      analysis: '',
      success: false,
      errorMessage:
        'Chave da API do Groq não configurada. ' +
        'Vá em Configurações e informe sua chave para usar a análise com IA.',
    };
  }

  // Validação de renda
  if (context.monthlyIncome <= 0) {
    return {
      analysis: '',
      success: false,
      errorMessage:
        'Renda mensal não informada. ' +
        'Vá em Configurações e informe sua renda mensal para obter uma análise precisa.',
    };
  }

  const systemPrompt = buildSystemPrompt(context);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content:
              `Analise a viabilidade da minha meta "${context.goalName}" ` +
              `e me dê sua avaliação completa com recomendações.`,
          },
        ],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        top_p: 0.9,
        stream: false,
      }),
    });

    // ── Tratamento de erros HTTP ──────────────────────────────────────────
    if (!response.ok) {
      const status = response.status;

      if (status === 401) {
        return {
          analysis: '',
          success: false,
          errorMessage:
            'Chave da API do Groq inválida ou expirada. ' +
            'Verifique sua chave em Configurações.',
        };
      }

      if (status === 429) {
        return {
          analysis: '',
          success: false,
          errorMessage:
            'Limite de requisições excedido. ' +
            'Aguarde alguns segundos e tente novamente.',
        };
      }

      // Tenta extrair mensagem de erro do corpo da resposta
      let errorDetail = '';
      try {
        const errorBody = await response.json();
        errorDetail = errorBody?.error?.message ?? '';
      } catch {
        // Ignora erro ao parsear o corpo
      }

      return {
        analysis: '',
        success: false,
        errorMessage:
          `Erro na API do Groq (HTTP ${status}). ` +
          (errorDetail ? `Detalhes: ${errorDetail}` : 'Tente novamente mais tarde.'),
      };
    }

    // ── Parse da resposta de sucesso ──────────────────────────────────────
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return {
        analysis: '',
        success: false,
        errorMessage: 'A IA não retornou uma resposta válida. Tente novamente.',
      };
    }

    return {
      analysis: content.trim(),
      success: true,
      errorMessage: null,
    };
  } catch (e) {
    // ── Erros de rede / timeout ──────────────────────────────────────────
    const isNetworkError =
      e instanceof TypeError && (e.message.includes('Network') || e.message.includes('fetch'));

    return {
      analysis: '',
      success: false,
      errorMessage: isNetworkError
        ? 'Sem conexão com a internet. Verifique sua rede e tente novamente.'
        : `Erro inesperado: ${e instanceof Error ? e.message : 'Tente novamente.'}`,
    };
  }
}
