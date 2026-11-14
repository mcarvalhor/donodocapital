/**
 * Parâmetros macroeconômicos de referência para o Brasil.
 *
 * Estes valores são estimativas simplificadas para fins didáticos, calibradas com a
 * realidade socioeconômica brasileira. Devem ser atualizados periodicamente conforme
 * novas tabelas oficiais (Receita Federal, INSS, DIEESE, IBGE) sejam publicadas.
 *
 * Fontes de referência: Receita Federal (tabela IRPF), INSS (tabela de contribuição),
 * DIEESE (salário mínimo necessário), IBGE/PNAD (distribuição de renda).
 */

/** Salário mínimo nacional vigente (referência 2026), em R$. */
export const SALARIO_MINIMO = 1_621;

/** Faixa de contribuição progressiva do INSS (trabalhador CLT), referência 2026. */
export interface ProgressiveBracket {
  /** Limite superior da faixa, em R$. Use `Infinity` para a última faixa. */
  upTo: number;
  /** Alíquota marginal aplicada à parcela do salário dentro desta faixa. */
  rate: number;
}

export const INSS_BRACKETS: ProgressiveBracket[] = [
  { upTo: 1_621.0, rate: 0.075 },
  { upTo: 2_902.84, rate: 0.09 },
  { upTo: 4_354.27, rate: 0.12 },
  { upTo: 8_475.55, rate: 0.14 },
];

/** Teto de contribuição mensal do INSS (contribuição máxima possível), em R$. */
export const INSS_CEILING_CONTRIBUTION = 988.09;

/** Tabela progressiva mensal do IRPF (referência 2026), com dedução simplificada. */
export interface IrpfBracket {
  /** Limite superior da base de cálculo, em R$. Use `Infinity` para a última faixa. */
  upTo: number;
  /** Alíquota marginal da faixa. */
  rate: number;
  /** Parcela a deduzir do imposto calculado sobre a base total (modelo simplificado). */
  deduction: number;
}

export const IRPF_BRACKETS: IrpfBracket[] = [
  { upTo: 2_428.8, rate: 0, deduction: 0 },
  { upTo: 2_826.65, rate: 0.075, deduction: 182.16 },
  { upTo: 3_751.05, rate: 0.15, deduction: 394.16 },
  { upTo: 4_664.68, rate: 0.225, deduction: 675.49 },
  { upTo: Infinity, rate: 0.275, deduction: 908.73 },
];

/**
 * Reforma do Imposto de Renda de 2026 (isenção ampliada), sancionada em 2025 e em
 * vigor a partir de janeiro de 2026:
 *
 * - Isenção TOTAL de IRPF para quem recebe até `IRPF_2026_EXEMPTION_LIMIT` por mês.
 * - Faixa de transição (redução parcial) entre `IRPF_2026_EXEMPTION_LIMIT` e
 *   `IRPF_2026_TRANSITION_LIMIT`: o imposto apurado pela tabela progressiva cheia
 *   (`IRPF_BRACKETS`) é reduzido proporcionalmente à posição da renda dentro dessa
 *   faixa, crescendo de 0% (no piso) até 100% do valor da tabela (no teto).
 * - Acima do teto de transição, a tabela progressiva cheia continua valendo sem
 *   nenhuma alteração.
 *
 * Nota sobre escopo: a reforma também cria um "imposto mínimo" sobre dividendos
 * (historicamente isentos) para rendas anuais muito altas (> R$ 600 mil/ano,
 * alíquota mínima crescendo até 10% em R$ 1,2 milhão/ano). Este simulador não
 * modela dividendos separadamente — usa uma alíquota única de capital
 * (`CAPITAL_GAINS_TAX_RATE`, 15%), já acima do teto de 10% dessa regra — portanto
 * essa camada específica da reforma não altera o cálculo de capital deste simulador.
 */
export const IRPF_2026_EXEMPTION_LIMIT = 5_000;
export const IRPF_2026_TRANSITION_LIMIT = 7_000;

/**
 * Alíquota simplificada aplicada sobre rendimentos de capital (regime regressivo de
 * renda fixa / ganho de capital). O regime real brasileiro é mais granular (isenção
 * de dividendos, tabela regressiva de 22,5% a 15% conforme prazo, etc.) — aqui usamos
 * uma alíquota única representativa para fins didáticos e de transparência de cálculo.
 */
export const CAPITAL_GAINS_TAX_RATE = 0.15;

/**
 * Taxa real anual padrão de juros de dívida (ex.: cheque especial/crédito rotativo),
 * usada quando o patrimônio simulado fica negativo e o usuário não especifica outra.
 */
export const DEFAULT_ANNUAL_DEBT_RATE = 0.25;

/** Taxa de retirada segura anual padrão ("regra dos 4%"), usada como referência de UI. */
export const SAFE_WITHDRAWAL_RATE = 0.04;

/** Faixa etária padrão da simulação. */
export const DEFAULT_INITIAL_AGE = 18;
export const DEFAULT_TARGET_AGE = 65;
