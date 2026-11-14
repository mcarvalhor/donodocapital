/**
 * Motor financeiro puro: evolução mensal do patrimônio.
 *
 * Função determinística, sem efeitos colaterais e sem dependências de React/DOM.
 * Implementa a dinâmica mensal descrita na seção 3.3 do AGENTS.md e produz os KPIs
 * descritos na seção 3.4. Componentes de UI devem apenas CONSUMIR o resultado desta
 * função — nenhuma fórmula financeira deve ser reescrita em `.tsx`.
 */
import type { MonthlySnapshot, SimulationInput, SimulationResult } from '@/core/types/simulation';
import { applyEventsForMonth, groupEventsByMonth, type EventApplicationState } from './events';
import { annualToMonthlyRate } from './rates';
import { calculateNetCapitalIncome, calculateNetSalary } from './taxes';

/**
 * Executa a simulação completa de trajetória de vida financeira para um conjunto de
 * parâmetros de entrada, mês a mês, do `initialAge` até o `targetAge`.
 *
 * Edge cases tratados:
 * - `targetAge <= initialAge`: retorna uma timeline com apenas o estado inicial (0 meses).
 * - `annualRealReturn` ou `annualDebtRate` iguais a 0: rendimento mensal correspondente é 0.
 * - `monthlySalary` igual a 0: salário líquido permanece 0 durante toda a simulação.
 * - `initialWealth` negativo: juros de dívida (`annualDebtRate`) são aplicados desde o mês 1.
 * - Valores na casa de bilhões/trilhões: aritmética de ponto flutuante do JS suporta
 *   com precisão adequada até 2^53 (muito acima de qualquer cenário realista aqui).
 * - `events` fora do intervalo [0, N] simplesmente nunca são acionados (sem erro).
 *
 * Eventos (`input.events`): cada evento é aplicado no **início** do mês indicado
 * (`monthIndex`), antes de qualquer outro cálculo daquele mês — isso significa que um
 * evento que altera o patrimônio já rende capital no mesmo mês em que ocorre, e um
 * evento que altera o salário já afeta o salário líquido daquele mesmo mês. Eventos no
 * mesmo mês são aplicados em sequência, na ordem em que aparecem em `input.events`.
 *
 * Além de patrimônio/salário/gastos, eventos também podem alterar as quatro taxas
 * anuais (`annualSalaryGrowth`, `annualExpenseGrowth`, `annualRealReturn`,
 * `annualDebtRate`) a partir de um mês específico — útil para simular uma mudança de
 * cenário econômico (ex.: "a rentabilidade cai para 3% a.a. a partir dos 40 anos").
 * As taxas mensais derivadas (`monthlyReturnRate`/`monthlyDebtRate`) são recalculadas
 * automaticamente sempre que a taxa anual correspondente muda.
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  const totalMonths = Math.max(0, Math.round((input.targetAge - input.initialAge) * 12));
  const eventsByMonth = groupEventsByMonth(input.events ?? []);

  let wealth = input.initialWealth;
  let currentSalary = Math.max(input.monthlySalary, 0);
  let currentExpenses = Math.max(input.monthlyExpenses, 0);
  let currentSalaryGrowth = input.annualSalaryGrowth;
  let currentExpenseGrowth = input.annualExpenseGrowth;
  let currentAnnualReturn = input.annualRealReturn;
  let currentAnnualDebtRate = input.annualDebtRate;
  let monthlyReturnRate = annualToMonthlyRate(currentAnnualReturn);
  let monthlyDebtRate = annualToMonthlyRate(currentAnnualDebtRate);

  let cumulativeWorkSavings = 0;
  let cumulativeCapitalGains = 0;
  // Soma de todo ajuste de patrimônio injetado diretamente por eventos (ex.: herança),
  // contabilizado como "capital" no KPI de origem do patrimônio — ver events.ts.
  let cumulativeEventWealthAdjustments = 0;

  /** Aplica os eventos agendados para `month`, sincronizando todas as variáveis mutáveis. */
  function applyMonthEvents(month: number): void {
    const currentState: EventApplicationState = {
      wealth,
      salary: currentSalary,
      expenses: currentExpenses,
      annualSalaryGrowth: currentSalaryGrowth,
      annualExpenseGrowth: currentExpenseGrowth,
      annualRealReturn: currentAnnualReturn,
      annualDebtRate: currentAnnualDebtRate,
    };

    const result = applyEventsForMonth(currentState, eventsByMonth.get(month) ?? []);

    wealth = result.state.wealth;
    currentSalary = result.state.salary;
    currentExpenses = result.state.expenses;
    currentSalaryGrowth = result.state.annualSalaryGrowth;
    currentExpenseGrowth = result.state.annualExpenseGrowth;
    currentAnnualReturn = result.state.annualRealReturn;
    currentAnnualDebtRate = result.state.annualDebtRate;
    cumulativeEventWealthAdjustments += result.wealthAdjustment;

    // Recalcula as taxas mensais derivadas sempre que as anuais podem ter mudado
    // (custo trivial — um Math.pow — então recalculamos incondicionalmente).
    monthlyReturnRate = annualToMonthlyRate(currentAnnualReturn);
    monthlyDebtRate = annualToMonthlyRate(currentAnnualDebtRate);
  }

  // Eventos agendados para o mês 0 afetam o próprio estado inicial, antes do snapshot.
  applyMonthEvents(0);

  const timeline: MonthlySnapshot[] = [];

  // Estado inicial (mês 0): nenhum rendimento de capital ainda ocorreu.
  const initialNetSalary = calculateNetSalary(currentSalary, input.applyBrazilianTaxModel);
  timeline.push({
    monthIndex: 0,
    age: input.initialAge,
    year: Math.floor(input.initialAge),
    wealth,
    netSalary: initialNetSalary,
    expenses: currentExpenses,
    passiveIncome: 0,
    monthlyCashFlow: initialNetSalary - currentExpenses,
    cumulativeWorkSavings,
    cumulativeCapitalGains,
  });

  for (let month = 1; month <= totalMonths; month++) {
    // 0. Eventos agendados para este mês (ex.: herança recebida, corte de gastos,
    // mudança na rentabilidade esperada dos investimentos).
    applyMonthEvents(month);

    // 1. Reajuste anual de salário e custo de vida (a cada 12 meses completos).
    if (month % 12 === 0) {
      currentSalary *= 1 + currentSalaryGrowth;
      currentExpenses *= 1 + currentExpenseGrowth;
    }

    // 2. Tributação líquida da renda do trabalho.
    const netSalary = calculateNetSalary(currentSalary, input.applyBrazilianTaxModel);

    // 3. Rendimento do capital no mês, calculado sobre o patrimônio do mês anterior.
    const grossCapitalIncome = wealth >= 0 ? wealth * monthlyReturnRate : wealth * monthlyDebtRate;
    const netCapitalIncome = calculateNetCapitalIncome(
      grossCapitalIncome,
      input.applyBrazilianTaxModel,
    );

    // 4. Fluxo de caixa mensal e novo patrimônio.
    const monthlyCashFlow = netSalary - currentExpenses;
    wealth = wealth + netCapitalIncome + monthlyCashFlow;

    cumulativeWorkSavings += monthlyCashFlow;
    cumulativeCapitalGains += netCapitalIncome;

    const age = input.initialAge + month / 12;

    timeline.push({
      monthIndex: month,
      age,
      year: Math.floor(age),
      wealth,
      netSalary,
      expenses: currentExpenses,
      passiveIncome: netCapitalIncome,
      monthlyCashFlow,
      cumulativeWorkSavings,
      cumulativeCapitalGains,
    });
  }

  return {
    input,
    timeline,
    summary: buildSummary(input, timeline, monthlyReturnRate, cumulativeEventWealthAdjustments),
  };
}

/** Constrói os indicadores-chave de saída (KPIs) a partir da timeline já calculada. */
function buildSummary(
  input: SimulationInput,
  timeline: MonthlySnapshot[],
  monthlyReturnRate: number,
  cumulativeEventWealthAdjustments: number,
): SimulationResult['summary'] {
  // `timeline` sempre tem ao menos 1 elemento (o estado inicial), mesmo com 0 meses.
  const last = timeline[timeline.length - 1] as MonthlySnapshot;

  const finalWealth = last.wealth;
  const totalWorkContribution = last.cumulativeWorkSavings;
  // O patrimônio inicial (ex.: herança) e qualquer ajuste direto de patrimônio vindo
  // de eventos (ex.: uma herança recebida no meio da simulação) são contabilizados
  // como "capital", já que não exigiram esforço de trabalho — consistente com a
  // identidade geral: finalWealth = totalWorkContribution + totalCapitalContribution.
  const totalCapitalContribution =
    input.initialWealth + last.cumulativeCapitalGains + cumulativeEventWealthAdjustments;

  const capitalSharePercentage =
    finalWealth !== 0 ? (totalCapitalContribution / finalWealth) * 100 : 0;

  // Poder de consumo sustentável: gastar exatamente o rendimento real mensal mantém
  // o principal intacto para sempre. Usa a taxa mensal vigente ao FINAL da simulação
  // (já refletindo qualquer evento que tenha alterado a rentabilidade pelo caminho).
  const sustainableMonthlySpending = finalWealth > 0 ? finalWealth * monthlyReturnRate : 0;

  // Ponto de independência financeira: primeiro mês em que a renda passiva líquida
  // cobre o custo de vida. Se o custo de vida inicial já é 0, a independência é trivial.
  const independenceSnapshot = timeline.find(
    (snapshot) => snapshot.expenses <= 0 || snapshot.passiveIncome >= snapshot.expenses,
  );

  return {
    finalWealth,
    finalMonthlyPassiveIncome: last.passiveIncome,
    finalMonthlyNetSalary: last.netSalary,
    finalMonthlyExpenses: last.expenses,
    sustainableMonthlySpending,
    totalWorkContribution,
    totalCapitalContribution,
    capitalSharePercentage,
    financialIndependenceAge: independenceSnapshot ? independenceSnapshot.age : null,
  };
}
