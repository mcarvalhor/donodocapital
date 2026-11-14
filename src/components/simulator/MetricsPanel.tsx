import type { SimulationResult } from '@/core/types/simulation';
import { Card, CardDescription } from '@/components/ui/Card';
import { formatAge, formatBRL, formatCompactBRL, formatPercentage } from '@/utils/formatters';

export interface MetricsPanelProps {
  result: SimulationResult;
}

/** Painel de KPIs calculados pelo motor puro — apenas exibição, zero lógica financeira. */
export function MetricsPanel({ result }: MetricsPanelProps) {
  const { summary } = result;
  const capitalShare = Math.min(100, Math.max(0, summary.capitalSharePercentage));
  const workShare = 100 - capitalShare;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Metric
        label="Patrimônio final"
        value={formatCompactBRL(summary.finalWealth)}
        fullValue={formatBRL(summary.finalWealth)}
        description={`Aos ${result.input.targetAge} anos.`}
      />
      <Metric
        label="Renda passiva mensal final"
        value={formatCompactBRL(summary.finalMonthlyPassiveIncome)}
        fullValue={formatBRL(summary.finalMonthlyPassiveIncome)}
        description="Quanto o dinheiro rende sozinho por mês, ao final."
        accent="capital"
      />
      <Metric
        label="Salário mensal final (líquido)"
        value={formatCompactBRL(summary.finalMonthlyNetSalary)}
        fullValue={formatBRL(summary.finalMonthlyNetSalary)}
        description="Quanto o trabalho rende por mês, ao final."
        accent="work"
      />
      <Metric
        label="Independência financeira"
        value={
          summary.financialIndependenceAge !== null
            ? formatAge(summary.financialIndependenceAge)
            : 'Nunca atingida'
        }
        description="Idade em que a renda passiva passa a cobrir o custo de vida."
      />
      <Metric
        label="Origem do patrimônio"
        value={`${formatPercentage(capitalShare / 100)} capital`}
        description={`vs. ${formatPercentage(workShare / 100)} trabalho.`}
      />
      <Metric
        label="Consumo sustentável mensal"
        value={formatCompactBRL(summary.sustainableMonthlySpending)}
        fullValue={formatBRL(summary.sustainableMonthlySpending)}
        description="Quanto dá para gastar por mês sem corroer o principal."
      />
    </div>
  );
}

function Metric({
  label,
  value,
  fullValue,
  description,
  accent,
}: {
  label: string;
  value: string;
  /** Valor completo (não compactado), exibido via `title` para precisão no hover. */
  fullValue?: string;
  description: string;
  accent?: 'capital' | 'work';
}) {
  return (
    <Card className="overflow-hidden">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p
        title={fullValue}
        className={`mt-1 break-words font-serif text-xl font-bold leading-tight sm:text-2xl ${
          accent === 'capital' ? 'text-capital' : accent === 'work' ? 'text-work' : 'text-ink'
        }`}
      >
        {value}
      </p>
      <CardDescription className="mt-1">{description}</CardDescription>
    </Card>
  );
}
