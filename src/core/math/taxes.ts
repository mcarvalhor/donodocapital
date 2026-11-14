/**
 * Estimativa simplificada de tributação no Brasil: Trabalho vs. Capital.
 *
 * Funções puras e determinísticas — ZERO dependências de React/DOM.
 * Ver seção 3.3.2 do AGENTS.md. Os parâmetros numéricos (alíquotas, faixas) vivem em
 * `src/data/economicConstants.ts`; este arquivo contém apenas a lógica de cálculo.
 */
import {
  CAPITAL_GAINS_TAX_RATE,
  INSS_BRACKETS,
  INSS_CEILING_CONTRIBUTION,
  IRPF_2026_EXEMPTION_LIMIT,
  IRPF_2026_TRANSITION_LIMIT,
  IRPF_BRACKETS,
  type IrpfBracket,
  type ProgressiveBracket,
} from '@/data/economicConstants';

/**
 * Calcula a contribuição progressiva do INSS sobre um salário bruto mensal.
 * Cada faixa é tributada apenas sobre a parcela do salário contida nela (cálculo
 * progressivo "por dentro"), respeitando o teto de contribuição.
 */
export function calculateINSS(grossSalary: number): number {
  if (grossSalary <= 0) return 0;

  let contribution = 0;
  let previousLimit = 0;

  for (const bracket of INSS_BRACKETS as ProgressiveBracket[]) {
    if (grossSalary <= previousLimit) break;
    const taxableInBracket = Math.min(grossSalary, bracket.upTo) - previousLimit;
    contribution += taxableInBracket * bracket.rate;
    previousLimit = bracket.upTo;
  }

  return Math.min(contribution, INSS_CEILING_CONTRIBUTION);
}

/**
 * Calcula o IRPF mensal devido pela tabela progressiva cheia (sem a isenção/transição
 * da Reforma de 2026), sobre uma base de cálculo já descontada do INSS:
 *
 *   IRPF = max(0, base * aliquota_da_faixa - deducao_da_faixa)
 *
 * Exportada separadamente para permitir a comparação "antes/depois da reforma" e para
 * ser reutilizada por `calculateIRPF` como base de cálculo da faixa de transição.
 */
export function calculateIRPFByTable(taxableBase: number): number {
  if (taxableBase <= 0) return 0;

  // A última faixa tem `upTo: Infinity`, então `find` sempre encontra um resultado
  // para `taxableBase` finito e >= 0. O fallback cobre apenas o edge case teórico de
  // `noUncheckedIndexedAccess`, nunca acionado na prática.
  const lastBracket = IRPF_BRACKETS[IRPF_BRACKETS.length - 1] as IrpfBracket;
  const bracket: IrpfBracket = IRPF_BRACKETS.find((b) => taxableBase <= b.upTo) ?? lastBracket;

  const tax = taxableBase * bracket.rate - bracket.deduction;
  return Math.max(0, tax);
}

/**
 * Calcula o IRPF mensal devido já considerando a Reforma do Imposto de Renda de 2026
 * (ver `IRPF_2026_EXEMPTION_LIMIT`/`IRPF_2026_TRANSITION_LIMIT` em `economicConstants.ts`):
 *
 * - Isenção total até `IRPF_2026_EXEMPTION_LIMIT`.
 * - Faixa de transição até `IRPF_2026_TRANSITION_LIMIT`: o imposto da tabela cheia é
 *   reduzido proporcionalmente à posição da renda dentro da faixa (0% no piso, 100%
 *   do valor da tabela no teto), garantindo uma transição contínua e sem "degraus".
 * - Acima do teto de transição, equivale exatamente à tabela progressiva cheia.
 */
export function calculateIRPF(taxableBase: number): number {
  if (taxableBase <= IRPF_2026_EXEMPTION_LIMIT) return 0;

  const fullTableTax = calculateIRPFByTable(taxableBase);
  if (taxableBase >= IRPF_2026_TRANSITION_LIMIT) return fullTableTax;

  const transitionRange = IRPF_2026_TRANSITION_LIMIT - IRPF_2026_EXEMPTION_LIMIT;
  const progress = (taxableBase - IRPF_2026_EXEMPTION_LIMIT) / transitionRange;
  return fullTableTax * progress;
}

/**
 * Calcula o salário líquido mensal a partir do salário bruto.
 *
 * Quando `applyBrazilianTaxModel` é falso, retorna o próprio valor bruto (clampado a
 * zero), representando uma visão simplificada sem tributação — útil para comparações
 * puramente de matemática financeira sem ruído fiscal.
 */
export function calculateNetSalary(grossSalary: number, applyBrazilianTaxModel: boolean): number {
  const safeGross = Math.max(grossSalary, 0);
  if (!applyBrazilianTaxModel || safeGross === 0) return safeGross;

  const inss = calculateINSS(safeGross);
  const irpfBase = safeGross - inss;
  const irpf = calculateIRPF(irpfBase);

  return safeGross - inss - irpf;
}

/**
 * Calcula o rendimento líquido do capital a partir do rendimento bruto do mês.
 *
 * A assimetria tributária brasileira é modelada aqui: o capital é tributado a uma
 * alíquota única e favorecida (`CAPITAL_GAINS_TAX_RATE`), bem abaixo da alíquota
 * marginal máxima do trabalho (27,5%). Rendimentos negativos (ex.: juros de dívida
 * quando o patrimônio está negativo) NÃO recebem benefício fiscal e são retornados
 * integralmente, já que representam uma despesa, não um ganho tributável.
 */
export function calculateNetCapitalIncome(
  grossCapitalIncome: number,
  applyBrazilianTaxModel: boolean,
): number {
  if (!applyBrazilianTaxModel || grossCapitalIncome <= 0) return grossCapitalIncome;
  return grossCapitalIncome * (1 - CAPITAL_GAINS_TAX_RATE);
}
