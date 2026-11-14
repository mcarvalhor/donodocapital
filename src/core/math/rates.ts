/**
 * Conversão de taxas financeiras.
 *
 * Funções puras e determinísticas — ZERO dependências de React/DOM.
 * Ver seção 3.2 do AGENTS.md para as fórmulas de referência.
 */

/**
 * Converte uma taxa anual efetiva `i_a` (decimal, ex.: 0.06 para 6%) na taxa mensal
 * equivalente `i_m`, por juros compostos:
 *
 *   i_m = (1 + i_a) ^ (1/12) - 1
 *
 * Edge case: taxa 0% retorna exatamente 0 (sem erro de ponto flutuante perceptível).
 */
export function annualToMonthlyRate(annualRate: number): number {
  if (annualRate === 0) return 0;
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Converte uma taxa mensal efetiva `i_m` na taxa anual equivalente `i_a`:
 *
 *   i_a = (1 + i_m) ^ 12 - 1
 */
export function monthlyToAnnualRate(monthlyRate: number): number {
  if (monthlyRate === 0) return 0;
  return Math.pow(1 + monthlyRate, 12) - 1;
}

/**
 * Calcula a taxa real `r_real` a partir de uma taxa nominal `r_nom` e uma inflação `π`:
 *
 *   r_real = (1 + r_nom) / (1 + π) - 1
 *
 * Útil quando o usuário informa retornos nominais e uma inflação esperada, em vez de
 * já fornecer diretamente a rentabilidade real (modo padrão do simulador).
 */
export function nominalToRealRate(nominalRate: number, inflation: number): number {
  return (1 + nominalRate) / (1 + inflation) - 1;
}
