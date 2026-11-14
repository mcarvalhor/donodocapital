'use client';

import * as React from 'react';
import Link from 'next/link';
import { runSimulation } from '@/core/math/engine';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ScenarioSelector } from '@/components/simulator/ScenarioSelector';
import { SimulatorForm } from '@/components/simulator/SimulatorForm';
import { EventsEditor } from '@/components/simulator/EventsEditor';
import { MetricsPanel } from '@/components/simulator/MetricsPanel';
import { WealthEvolutionChart } from '@/components/charts/WealthEvolutionChart';
import { CompositionChart } from '@/components/charts/CompositionChart';
import { CopyLinkButton } from '@/components/share/CopyLinkButton';
import { ShareCardButton } from '@/components/share/ShareCardButton';
import { useSimulationQueryState } from '@/components/simulator/useSimulationQueryState';
import { PRESET_LIST } from '@/data/presets';
import { cn } from '@/utils/cn';

function SimuladorContent() {
  const {
    primaryInput,
    comparisonInput,
    comparisonId,
    scale,
    applyPreset,
    updateField,
    setComparison,
    setScale,
    addEvent,
    updateEvent,
    removeEvent,
  } = useSimulationQueryState();

  const primaryResult = React.useMemo(() => runSimulation(primaryInput), [primaryInput]);
  const comparisonResult = React.useMemo(
    () => (comparisonInput ? runSimulation(comparisonInput) : null),
    [comparisonInput],
  );

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-sm font-medium text-ink/60 hover:text-ink">
          ← Voltar
        </Link>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton />
          <ShareCardButton result={primaryResult} comparison={comparisonResult} />
        </div>
      </div>

      <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">{primaryInput.label}</h1>

      {/*
        Em telas pequenas, a seção de configuração aparece PRIMEIRO, mas FECHADA por
        padrão (ver `CollapsibleSection`) — assim a pessoa já percebe, logo abaixo do
        título, que existe a opção de editar a simulação (cabeçalho compacto e
        clicável), mas sem precisar rolar por um formulário inteiro antes de chegar
        nos resultados. Em telas grandes (lg:), vira a sidebar à esquerda, sempre
        aberta, lado a lado com os resultados — igual a antes.
      */}
      <section className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[360px_1fr] lg:items-start">
        <div className="space-y-6">
          <CollapsibleSection
            title="Cenários e configurações"
            description="Escolha um cenário pronto ou ajuste os parâmetros manualmente."
          >
            <div className="space-y-6">
              <ScenarioSelector selectedId={primaryInput.id} onSelect={applyPreset} heading="" />
              <SimulatorForm input={primaryInput} onChange={updateField} />
              <EventsEditor
                events={primaryInput.events ?? []}
                initialAge={primaryInput.initialAge}
                targetAge={primaryInput.targetAge}
                onAdd={addEvent}
                onUpdate={updateEvent}
                onRemove={removeEvent}
              />
            </div>
          </CollapsibleSection>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
            <WealthEvolutionChart
              primary={primaryResult}
              comparison={comparisonResult}
              scale={scale}
              onScaleChange={setScale}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink/70">Modo comparação (lado a lado):</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setComparison(null)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  !comparisonId
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/20 text-ink/60 hover:border-ink/40',
                )}
              >
                Nenhuma
              </button>
              {PRESET_LIST.filter((p) => p.id !== primaryInput.id).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setComparison(p.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    comparisonId === p.id
                      ? 'border-capital bg-capital text-ink'
                      : 'border-ink/20 text-ink/60 hover:border-capital/60',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <MetricsPanel result={primaryResult} />

          <div className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
            <CompositionChart result={primaryResult} />
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * `useSearchParams` (usado internamente por `nuqs`) exige um limite de Suspense no App
 * Router para habilitar renderização estática parcial da shell da página.
 */
export default function SimuladorPage() {
  return (
    <React.Suspense fallback={<SimuladorFallback />}>
      <SimuladorContent />
    </React.Suspense>
  );
}

function SimuladorFallback() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm text-ink/50">Carregando simulação...</p>
    </main>
  );
}
