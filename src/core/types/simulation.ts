/**
 * Contratos de dados do motor de simulação financeira.
 *
 * Estas interfaces são a fonte da verdade para a forma dos dados trocados entre
 * `src/core/math` (motor puro) e as camadas de UI/URL. Qualquer alteração aqui deve
 * ser cuidadosamente avaliada quanto à compatibilidade retroativa — veja a seção 4
 * do AGENTS.md na raiz do repositório.
 */

/**
 * Parâmetros de entrada de uma simulação de trajetória de vida financeira.
 * Todas as taxas são expressas em formato decimal e, por padrão, em termos
 * **reais** (já descontada a inflação) — ver seção 3.1 do AGENTS.md.
 */
export interface SimulationInput {
  /** Identificador único da simulação (ex.: id de um preset, ou "custom"). */
  id: string;
  /** Rótulo legível exibido na UI (ex.: "Trabalhador de Salário Mínimo"). */
  label: string;
  /** Idade inicial da simulação, em anos. Padrão: 18. */
  initialAge: number;
  /** Idade final (alvo) da simulação, em anos. Padrão: 65. */
  targetAge: number;
  /** Patrimônio inicial em R$ (ex: 0 ou 5_000_000). */
  initialWealth: number;
  /** Salário bruto mensal inicial em R$. */
  monthlySalary: number;
  /** Custo de vida mensal inicial em R$. */
  monthlyExpenses: number;
  /** Crescimento real anual do salário (ex: 0.015 = 1,5% a.a.). */
  annualSalaryGrowth: number;
  /** Crescimento real anual dos gastos (ex: 0.01 = 1% a.a.). */
  annualExpenseGrowth: number;
  /** Rentabilidade real anual dos investimentos (ex: 0.06 = 6% a.a.). */
  annualRealReturn: number;
  /** Juros reais anuais cobrados caso o saldo fique negativo (ex: 0.25 = 25% a.a.). */
  annualDebtRate: number;
  /** Se verdadeiro, aplica a assimetria fiscal brasileira (IRPF/INSS vs. tributação do capital). */
  applyBrazilianTaxModel: boolean;
  /**
   * Eventos pontuais e opcionais que alteram salário, gastos ou patrimônio em um mês
   * específico da simulação (ex.: uma herança recebida, uma promoção, um corte de
   * gastos). Ver `src/core/math/events.ts` para a lógica de aplicação.
   */
  events?: SimulationEvent[];
}

/**
 * Campo da simulação que um evento pode alterar — valores monetários (`wealth`,
 * `salary`, `expenses`) ou taxas anuais (`annualSalaryGrowth`, `annualExpenseGrowth`,
 * `annualRealReturn`, `annualDebtRate`). Taxas só aceitam as operações `set` e
 * `addPercent` na UI (ver `EventsEditor.tsx`) — `add` em R$ não faz sentido para um
 * campo que é uma taxa percentual, não um valor monetário.
 */
export type SimulationEventTarget =
  | 'wealth'
  | 'salary'
  | 'expenses'
  | 'annualSalaryGrowth'
  | 'annualExpenseGrowth'
  | 'annualRealReturn'
  | 'annualDebtRate';

/**
 * Operação aplicada pelo evento sobre o campo-alvo:
 * - `set`: define o campo para `value` (em R$ para campos monetários, ou em decimal
 *   para taxas — ex.: 0.08 = 8% a.a.).
 * - `add`: soma `value` ao valor atual, em R$ (use negativo para diminuir). Só faz
 *   sentido para campos monetários.
 * - `addPercent`: multiplica o valor atual por `(1 + value)` (`value` em decimal,
 *   ex.: 0.1 = +10%, -0.15 = -15%). Funciona tanto para campos monetários quanto
 *   para taxas (nesse caso, é uma variação relativa da própria taxa).
 */
export type SimulationEventOperation = 'set' | 'add' | 'addPercent';

/** Um evento pontual na linha do tempo da simulação. */
export interface SimulationEvent {
  /** Identificador estável, usado apenas como chave de UI/lista — sem significado financeiro. */
  id: string;
  /** Mês da simulação em que o evento é aplicado (0 = idade inicial, N = idade final). */
  monthIndex: number;
  /** Campo afetado pelo evento. */
  target: SimulationEventTarget;
  /** Como o valor é aplicado ao campo-alvo. */
  operation: SimulationEventOperation;
  /** Valor do evento — em R$ para `set`/`add`, ou decimal para `addPercent`. */
  value: number;
}

/** Fotografia do estado da simulação ao final de um mês específico. */
export interface MonthlySnapshot {
  /** Índice do mês dentro da simulação, começando em 0 (estado inicial). */
  monthIndex: number;
  /** Idade exata (fracionária) nesse mês. Ex: 18.0, 18.083... */
  age: number;
  /** Idade inteira (ano) correspondente a este mês. */
  year: number;
  /** Patrimônio acumulado no mês (P_t). */
  wealth: number;
  /** Salário líquido no mês (S_liq,t). */
  netSalary: number;
  /** Custo de vida no mês (C_t). */
  expenses: number;
  /** Rendimento líquido do capital no mês (R_liq,t). */
  passiveIncome: number;
  /** Saldo do trabalho no mês (S_liq,t - C_t). */
  monthlyCashFlow: number;
  /** Total acumulado vindo exclusivamente do esforço do trabalho (ΣF_t). */
  cumulativeWorkSavings: number;
  /** Total acumulado vindo exclusivamente de juros/rendimentos (ΣR_liq,t). */
  cumulativeCapitalGains: number;
}

/** Resultado completo de uma simulação: entrada, série temporal e indicadores finais. */
export interface SimulationResult {
  input: SimulationInput;
  timeline: MonthlySnapshot[];
  summary: {
    /** Patrimônio final (P_N). */
    finalWealth: number;
    /** Quanto o dinheiro gera sozinho por mês no último mês simulado. */
    finalMonthlyPassiveIncome: number;
    /** Quanto o trabalho gera por mês (líquido) no último mês simulado. */
    finalMonthlyNetSalary: number;
    /** Custo de vida mensal no último mês simulado. */
    finalMonthlyExpenses: number;
    /** Quanto a pessoa poderia gastar por mês ao final sem corroer o patrimônio principal. */
    sustainableMonthlySpending: number;
    /** Soma de todo o fluxo de caixa proveniente do trabalho (ΣF_t). */
    totalWorkContribution: number;
    /**
     * Soma do patrimônio inicial (capital herdado/inicial) com todos os rendimentos
     * de capital acumulados (ΣR_liq,t). Representa a parcela do patrimônio final que
     * não exigiu esforço de trabalho durante a simulação.
     */
    totalCapitalContribution: number;
    /** % do patrimônio final proveniente do capital (ver totalCapitalContribution). */
    capitalSharePercentage: number;
    /** Idade exata (fracionária) em que a renda passiva passa a cobrir o custo de vida, ou null se nunca atingida. */
    financialIndependenceAge: number | null;
  };
}
