/**
 * Aplicação de eventos pontuais da linha do tempo (ex.: herança, promoção, corte de
 * gastos, mudança de rentabilidade) ao estado da simulação. Funções puras e
 * determinísticas — ZERO dependências de React/DOM. Consumidas por
 * `src/core/math/engine.ts`.
 */
import type { SimulationEvent, SimulationEventTarget } from '@/core/types/simulation';

/**
 * Estado mutável ao qual um evento é aplicado: os três valores monetários do mês
 * (patrimônio, salário, gastos) e as quatro taxas anuais configuráveis. As chaves
 * desta interface correspondem 1:1 aos valores de `SimulationEventTarget`.
 */
export interface EventApplicationState {
  wealth: number;
  salary: number;
  expenses: number;
  annualSalaryGrowth: number;
  annualExpenseGrowth: number;
  annualRealReturn: number;
  annualDebtRate: number;
}

/**
 * Campos monetários (R$) — travados em zero ou mais, já que valores negativos não
 * fazem sentido para salário ou gastos. Patrimônio pode ficar negativo (dívida) e as
 * quatro taxas podem legitimamente ser negativas (ex.: retorno real negativo numa
 * crise, ou deflação de custo de vida) — por isso não entram nesta lista.
 */
const NON_NEGATIVE_TARGETS = new Set<SimulationEventTarget>(['salary', 'expenses']);

/**
 * Aplica um único evento a um estado, retornando um novo estado (não há mutação do
 * argumento recebido).
 */
export function applyEvent(
  state: EventApplicationState,
  event: SimulationEvent,
): EventApplicationState {
  const field = event.target;
  const current = state[field];

  let next: number;
  switch (event.operation) {
    case 'set':
      next = event.value;
      break;
    case 'add':
      next = current + event.value;
      break;
    case 'addPercent':
      next = current * (1 + event.value);
      break;
  }

  const safeNext = NON_NEGATIVE_TARGETS.has(field) ? Math.max(next, 0) : next;

  return { ...state, [field]: safeNext };
}

/**
 * Agrupa uma lista de eventos por `monthIndex`, para consulta O(1) a cada mês do
 * loop do motor. Eventos com o mesmo `monthIndex` preservam a ordem original da
 * lista de entrada — são aplicados nessa mesma ordem, sequencialmente.
 */
export function groupEventsByMonth(events: SimulationEvent[]): Map<number, SimulationEvent[]> {
  const map = new Map<number, SimulationEvent[]>();

  for (const event of events) {
    const existing = map.get(event.monthIndex);
    if (existing) existing.push(event);
    else map.set(event.monthIndex, [event]);
  }

  return map;
}

/** Resultado de aplicar uma lista de eventos (de um mesmo mês) sequencialmente. */
export interface EventsApplicationResult {
  state: EventApplicationState;
  /**
   * Soma líquida das variações de patrimônio causadas diretamente por eventos com
   * `target: 'wealth'` (ex.: uma herança, uma compra grande). Eventos de salário ou
   * gastos não geram ajuste aqui — seus efeitos já são capturados naturalmente pelo
   * fluxo de caixa dos meses seguintes, sem precisar de contabilização especial.
   */
  wealthAdjustment: number;
}

/**
 * Aplica uma lista de eventos (tipicamente todos agendados para o mesmo mês) em
 * sequência, e retorna tanto o estado final quanto o quanto desse estado veio
 * especificamente de ajustes diretos de patrimônio — necessário para que o KPI
 * "origem do patrimônio" continue contabilizando corretamente eventos como herança
 * (capital) sem exigir esforço de trabalho na simulação.
 */
export function applyEventsForMonth(
  state: EventApplicationState,
  events: SimulationEvent[],
): EventsApplicationResult {
  let current = state;
  let wealthAdjustment = 0;

  for (const event of events) {
    const next = applyEvent(current, event);
    if (event.target === 'wealth') {
      wealthAdjustment += next.wealth - current.wealth;
    }
    current = next;
  }

  return { state: current, wealthAdjustment };
}
