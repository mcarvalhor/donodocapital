/**
 * Formatadores de exibição (BRL, percentuais, compactação de números e idades).
 * Puramente apresentacional — não contém nenhuma regra de negócio financeira.
 */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const brlCompactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/** Formata um valor numérico como moeda brasileira completa (ex.: "R$ 1.234,56"). */
export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0,00';
  return brlFormatter.format(value);
}

/**
 * Formata um valor numérico como moeda brasileira compacta, adequada para eixos de
 * gráfico e KPIs em destaque (ex.: "R$ 1,5 mi", "R$ 1,2 bi").
 */
export function formatCompactBRL(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0';
  return brlCompactFormatter.format(value);
}

/** Formata um valor decimal (ex.: 0.275) como percentual (ex.: "27,5%"). */
export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return percentFormatter.format(value);
}

/** Formata uma idade fracionária (ex.: 34.25) como "34 anos e 3 meses". */
export function formatAge(age: number): string {
  if (!Number.isFinite(age)) return '—';
  const years = Math.floor(age);
  const months = Math.round((age - years) * 12);

  if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}
