/**
 * Geração de texto e estatísticas para o card de compartilhamento, a partir dos
 * resultados já calculados pelo motor puro (`SimulationResult`). Não há nenhuma
 * fórmula financeira aqui — apenas templating e remapeamento de números que o motor
 * já produziu.
 */
import type { SimulationResult } from '@/core/types/simulation';
import { formatCompactBRL } from '@/utils/formatters';

/**
 * Monta a frase de impacto principal do card, no formato:
 * "Quem começa com X no bolso e ganha Y por mês aposenta aos N anos com Z, e nunca
 * será dono do capital." — a frase final alterna entre "nunca será dono do capital"
 * (quando a renda passiva nunca cobre o custo de vida) e "sendo dono do capital"
 * (quando a independência financeira é alcançada dentro da simulação).
 */
export function buildShareHeadline(result: SimulationResult): string {
  const { input, summary } = result;

  const startPart =
    input.initialWealth > 0
      ? `Quem começa com ${formatCompactBRL(input.initialWealth)} no bolso`
      : 'Quem começa sem nada no bolso';

  const workPart =
    input.monthlySalary > 0
      ? ` e ganha ${formatCompactBRL(input.monthlySalary)} por mês`
      : ' e nunca trabalha';

  const outcomePart = ` aposenta aos ${input.targetAge} anos com ${formatCompactBRL(summary.finalWealth)}`;

  const capitalOwnershipPart =
    summary.financialIndependenceAge === null
      ? ', e nunca será dono do capital.'
      : ', sendo dono do capital.';

  return `${startPart}${workPart}${outcomePart}${capitalOwnershipPart}`;
}

/**
 * Quando há uma simulação de comparação e ela termina em situação financeira melhor
 * (patrimônio final maior), gera uma frase de ênfase destacando esse contraste —
 * incluindo o múltiplo de diferença quando ele é grande o suficiente para ser
 * impactante. Retorna `null` quando não há comparação ou quando ela não é "melhor".
 */
export function buildComparisonEmphasis(
  primary: SimulationResult,
  comparison: SimulationResult | null,
): string | null {
  if (!comparison) return null;

  const primaryWealth = primary.summary.finalWealth;
  const comparisonWealth = comparison.summary.finalWealth;

  if (comparisonWealth <= primaryWealth) return null;

  const multiplier = primaryWealth > 0 ? comparisonWealth / primaryWealth : null;
  const multiplierPart =
    multiplier !== null && Number.isFinite(multiplier) && multiplier >= 1.5
      ? ` — ${multiplier.toFixed(multiplier >= 10 ? 0 : 1)}x mais`
      : '';

  return `Para comparação, ${comparison.input.label} termina com ${formatCompactBRL(comparisonWealth)}${multiplierPart}.`;
}

/** Uma "fotografia" resumida (já formatada para exibição) de um ponto da simulação. */
export interface ShareStatSnapshot {
  ageLabel: string;
  wealth: number;
  netSalary: number;
  passiveIncome: number;
  expenses: number;
}

/**
 * Monta os dois snapshots (início e fim da simulação) exibidos lado a lado no card
 * de compartilhamento.
 *
 * Nota sobre `passiveIncome` no snapshot inicial: por definição do motor, o mês 0
 * ainda não gerou nenhum rendimento de capital (R_0 = 0 — o patrimônio inicial só
 * passa a render a partir do 1º mês). Usar o valor literal do mês 0 sempre mostraria
 * "R$ 0" de renda passiva inicial, mesmo para quem já começa com milhões. Por isso,
 * usamos o rendimento do 1º mês como uma aproximação honesta de "quanto o patrimônio
 * inicial já rende por mês, desde o início".
 */
export function buildShareStats(result: SimulationResult): {
  initial: ShareStatSnapshot;
  final: ShareStatSnapshot;
} {
  const { input, timeline, summary } = result;
  const firstSnapshot = timeline[0];
  const earlyPassiveIncome = timeline[1]?.passiveIncome ?? 0;

  return {
    initial: {
      ageLabel: `Aos ${input.initialAge} anos`,
      wealth: firstSnapshot?.wealth ?? input.initialWealth,
      netSalary: firstSnapshot?.netSalary ?? 0,
      passiveIncome: earlyPassiveIncome,
      expenses: firstSnapshot?.expenses ?? input.monthlyExpenses,
    },
    final: {
      ageLabel: `Aos ${input.targetAge} anos`,
      wealth: summary.finalWealth,
      netSalary: summary.finalMonthlyNetSalary,
      passiveIncome: summary.finalMonthlyPassiveIncome,
      expenses: summary.finalMonthlyExpenses,
    },
  };
}
