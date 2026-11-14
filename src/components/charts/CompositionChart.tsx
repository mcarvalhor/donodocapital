'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationResult } from '@/core/types/simulation';
import { formatBRL, formatCompactBRL } from '@/utils/formatters';

export interface CompositionChartProps {
  result: SimulationResult;
}

/**
 * Gráfico de composição: quanto do patrimônio acumulado veio do suor (poupança do
 * salário) vs. quanto veio do dinheiro trabalhando sozinho (rendimentos de capital).
 * Ver seção 6.2.2 do AGENTS.md.
 */
export function CompositionChart({ result }: CompositionChartProps) {
  const data = result.timeline.map((snapshot) => ({
    age: snapshot.age,
    trabalho: Math.max(0, snapshot.cumulativeWorkSavings),
    capital: result.input.initialWealth + snapshot.cumulativeCapitalGains,
  }));

  return (
    <div>
      <h3 className="mb-4 font-serif text-lg font-semibold text-ink">
        Esforço (Trabalho) vs. Capital Trabalhando Sozinho
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00000012" />
          <XAxis
            dataKey="age"
            tickFormatter={(age: number) => `${Math.round(age)}a`}
            stroke="#00000055"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value: number) => formatCompactBRL(value)}
            stroke="#00000055"
            fontSize={12}
            width={70}
          />
          <RechartsTooltip
            formatter={(value: number, name: string) => [formatBRL(value), name]}
            labelFormatter={(age: number) => `Idade: ${age.toFixed(1)} anos`}
          />
          <Area
            type="monotone"
            dataKey="trabalho"
            name="Poupança do trabalho"
            stackId="1"
            stroke="#1f4b99"
            fill="#dbe6f7"
          />
          <Area
            type="monotone"
            dataKey="capital"
            name="Capital (inicial + rendimentos)"
            stackId="1"
            stroke="#b8862f"
            fill="#f3e3c3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
