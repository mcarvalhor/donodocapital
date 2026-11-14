'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationResult } from '@/core/types/simulation';
import { formatBRL, formatCompactBRL } from '@/utils/formatters';
import { ScaleToggle } from './ScaleToggle';
import { buildWealthChartData, type WealthChartPoint } from './wealthChartData';

export interface WealthEvolutionChartProps {
  primary: SimulationResult;
  comparison?: SimulationResult | null;
  scale: 'linear' | 'log';
  onScaleChange: (scale: 'linear' | 'log') => void;
}

/**
 * Gráfico principal de evolução patrimonial. Suporta sobreposição de uma segunda
 * trajetória (modo comparação) e alternância de escala linear/logarítmica.
 * Em escala logarítmica, valores não-positivos são omitidos (log não é definido para
 * zero ou negativos), conforme esperado pelo Recharts.
 */
export function WealthEvolutionChart({
  primary,
  comparison,
  scale,
  onScaleChange,
}: WealthEvolutionChartProps) {
  const data = buildWealthChartData(primary, comparison ?? null, scale);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold text-ink">Evolução Patrimonial</h3>
        <ScaleToggle scale={scale} onChange={onScaleChange} />
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00000012" />
          <XAxis
            dataKey="age"
            tickFormatter={(age: number) => `${Math.round(age)}a`}
            stroke="#00000055"
            fontSize={12}
          />
          <YAxis
            scale={scale === 'log' ? 'log' : 'linear'}
            domain={scale === 'log' ? ['auto', 'auto'] : [0, 'auto']}
            tickFormatter={(value: number) => formatCompactBRL(value)}
            stroke="#00000055"
            fontSize={12}
            width={70}
          />
          <RechartsTooltip
            content={
              <RichTooltip
                primaryLabel={primary.input.label}
                comparisonLabel={comparison?.input.label}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="primaryWealth"
            name={primary.input.label}
            stroke="#1f4b99"
            strokeWidth={2.5}
            dot={false}
          />
          {comparison && (
            <Line
              type="monotone"
              dataKey="comparisonWealth"
              name={comparison.input.label}
              stroke="#b8862f"
              strokeWidth={2.5}
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RichTooltip({
  active,
  payload,
  label,
  primaryLabel,
  comparisonLabel,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; payload: WealthChartPoint }>;
  label?: number;
  primaryLabel: string;
  comparisonLabel?: string;
}) {
  if (!active || !payload || payload.length === 0 || label === undefined) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-3 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-ink">Idade: {label.toFixed(1)} anos</p>
      <p className="text-work">
        {primaryLabel} — Patrimônio: {formatBRL(point.primaryWealth)}
      </p>
      <p className="text-ink/70">Renda do trabalho/mês: {formatBRL(point.primaryNetSalary)}</p>
      <p className="text-ink/70">Renda passiva/mês: {formatBRL(point.primaryPassiveIncome)}</p>
      <p className="text-danger/80">Custo de vida/mês: {formatBRL(point.primaryExpenses)}</p>
      {comparisonLabel && point.comparisonWealth !== undefined && (
        <>
          <p className="mt-2 text-capital">
            {comparisonLabel} — Patrimônio: {formatBRL(point.comparisonWealth)}
          </p>
          {point.comparisonExpenses !== undefined && (
            <p className="text-danger/80">
              Custo de vida/mês: {formatBRL(point.comparisonExpenses)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
