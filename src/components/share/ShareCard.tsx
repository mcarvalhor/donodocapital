import * as React from 'react';
import type { SimulationResult } from '@/core/types/simulation';
import { ShareWealthChart } from '@/components/charts/ShareWealthChart';
import { LogoMark } from '@/components/Logo';
import { formatCompactBRL } from '@/utils/formatters';
import {
  buildComparisonEmphasis,
  buildShareHeadline,
  buildShareStats,
  type ShareStatSnapshot,
} from './shareCopy';

export interface ShareCardProps {
  result: SimulationResult;
  comparison?: SimulationResult | null;
}

/**
 * Card visual de alto contraste (proporção 4:5) para compartilhamento em redes
 * sociais. Ver seção 6.3 do AGENTS.md. Renderizado fora da tela e capturado via
 * `html-to-image` pelo `ShareCardButton`.
 */
export const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>(
  ({ result, comparison }, ref) => {
    const headline = buildShareHeadline(result);
    const comparisonEmphasis = buildComparisonEmphasis(result, comparison ?? null);
    const stats = buildShareStats(result);

    return (
      <div
        ref={ref}
        className="flex h-[1000px] w-[800px] flex-col justify-between bg-ink p-12 text-paper"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <p className="text-sm font-medium uppercase tracking-widest text-capital">
              Dono do Capital
            </p>
          </div>
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight">{headline}</h1>
        </div>

        <ShareWealthChart primary={result} comparison={comparison} />

        <div className="grid grid-cols-2 gap-8 rounded-2xl border border-paper/10 bg-white/5 p-6">
          <StatsColumn snapshot={stats.initial} />
          <StatsColumn snapshot={stats.final} />
        </div>

        {comparisonEmphasis && (
          <div className="rounded-2xl border border-capital/40 bg-white/5 p-6">
            <p className="text-sm text-paper/80">{comparisonEmphasis}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-paper/10 pt-6 text-xs text-paper/50">
          <span>donodocapital.com.br</span>
          <span>Simulação baseada em matemática financeira real, r {'>'} g</span>
        </div>
      </div>
    );
  },
);
ShareCard.displayName = 'ShareCard';

function StatsColumn({ snapshot }: { snapshot: ShareStatSnapshot }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-capital">
        {snapshot.ageLabel}
      </p>
      <dl className="space-y-2 text-sm">
        <StatRow label="Patrimônio" value={formatCompactBRL(snapshot.wealth)} />
        <StatRow label="Salário do trabalho" value={formatCompactBRL(snapshot.netSalary)} />
        <StatRow label="Rendimento passivo" value={formatCompactBRL(snapshot.passiveIncome)} />
        <StatRow label="Gastos mensais" value={formatCompactBRL(snapshot.expenses)} />
      </dl>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-paper/60">{label}</dt>
      <dd className="font-semibold text-paper">{value}</dd>
    </div>
  );
}
