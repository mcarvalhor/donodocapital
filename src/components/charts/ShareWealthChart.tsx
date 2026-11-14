'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { SimulationResult } from '@/core/types/simulation';
import { buildWealthChartData } from './wealthChartData';

export interface ShareWealthChartProps {
  primary: SimulationResult;
  comparison?: SimulationResult | null;
  width?: number;
  height?: number;
}

/**
 * Versão estática e minimalista do gráfico de evolução patrimonial, usada apenas
 * dentro do `ShareCard` (capturado como imagem para compartilhamento). Sem tooltip,
 * sem alternância de escala — somente o impacto visual bruto da trajetória, em
 * escala linear (a mais intuitiva para transmitir o "abismo" de magnitude em um
 * card estático). Animações são desativadas para garantir uma captura confiável.
 */
export function ShareWealthChart({
  primary,
  comparison,
  width = 680,
  height = 260,
}: ShareWealthChartProps) {
  const data = buildWealthChartData(primary, comparison ?? null, 'linear');

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <XAxis
            dataKey="age"
            tick={{ fill: '#fafaf899', fontSize: 11 }}
            axisLine={{ stroke: '#fafaf822' }}
            tickLine={false}
            tickFormatter={(age: number) => `${Math.round(age)}a`}
          />
          <YAxis hide domain={[0, 'auto']} />
          <Line
            type="monotone"
            dataKey="primaryWealth"
            stroke="#dbe6f7"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
          {comparison && (
            <Line
              type="monotone"
              dataKey="comparisonWealth"
              stroke="#f3e3c3"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
