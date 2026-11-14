import type { SimulationInput } from '@/core/types/simulation';

/**
 * Monta a query string completa de uma simulação a partir de um preset, para uso em
 * links diretos (ex.: da Home para o Simulador) sem depender de efeitos de montagem.
 *
 * Função pura, sem dependência de React/hooks — pode ser importada tanto por Server
 * quanto por Client Components (ao contrário de `useSimulationQueryState.ts`, que é
 * `'use client'` e teria todos os seus exports tratados como referências de cliente).
 */
export function presetToQueryString(preset: SimulationInput): string {
  const params = new URLSearchParams({
    preset: preset.id,
    age0: String(preset.initialAge),
    age1: String(preset.targetAge),
    w0: String(preset.initialWealth),
    sal: String(preset.monthlySalary),
    exp: String(preset.monthlyExpenses),
    gs: String(preset.annualSalaryGrowth),
    ge: String(preset.annualExpenseGrowth),
    ret: String(preset.annualRealReturn),
    debt: String(preset.annualDebtRate),
    tax: String(preset.applyBrazilianTaxModel),
  });
  return params.toString();
}
