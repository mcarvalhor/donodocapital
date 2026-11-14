import type { SimulationResult } from '@/core/types/simulation';

export interface WealthChartPoint {
  age: number;
  primaryWealth: number;
  comparisonWealth?: number;
  primaryPassiveIncome: number;
  primaryNetSalary: number;
  primaryExpenses: number;
  comparisonExpenses?: number;
}

/**
 * Monta a série de dados (idade → patrimônio/renda/gastos) usada pelos gráficos de
 * evolução patrimonial, tanto na tela do simulador quanto no card de compartilhamento.
 * Função pura de apresentação — apenas remapeia a timeline já calculada pelo motor.
 *
 * Em escala logarítmica, valores não-positivos são convertidos para `NaN` (o log não é
 * definido para zero ou negativos), conforme esperado pelo Recharts.
 */
export function buildWealthChartData(
  primary: SimulationResult,
  comparison: SimulationResult | null,
  scale: 'linear' | 'log' = 'linear',
): WealthChartPoint[] {
  const isLog = scale === 'log';

  return primary.timeline.map((snapshot, index) => {
    const comparisonSnapshot = comparison?.timeline[index];
    const primaryWealth = isLog && snapshot.wealth <= 0 ? Number.NaN : snapshot.wealth;
    const comparisonWealth =
      comparisonSnapshot !== undefined
        ? isLog && comparisonSnapshot.wealth <= 0
          ? Number.NaN
          : comparisonSnapshot.wealth
        : undefined;

    return {
      age: snapshot.age,
      primaryWealth,
      comparisonWealth,
      primaryPassiveIncome: snapshot.passiveIncome,
      primaryNetSalary: snapshot.netSalary,
      primaryExpenses: snapshot.expenses,
      comparisonExpenses: comparisonSnapshot?.expenses,
    };
  });
}
