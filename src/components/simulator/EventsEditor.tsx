'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  SimulationEvent,
  SimulationEventOperation,
  SimulationEventTarget,
} from '@/core/types/simulation';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';

export interface EventsEditorProps {
  events: SimulationEvent[];
  initialAge: number;
  targetAge: number;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Omit<SimulationEvent, 'id'>>) => void;
  onRemove: (id: string) => void;
}

const TARGET_LABELS: Record<SimulationEventTarget, string> = {
  wealth: 'Patrimônio',
  salary: 'Salário',
  expenses: 'Gastos',
  annualSalaryGrowth: 'Reajuste salarial anual',
  annualExpenseGrowth: 'Reajuste de gastos anual',
  annualRealReturn: 'Rentabilidade dos investimentos',
  annualDebtRate: 'Juros reais de dívida',
};

const OPERATION_LABELS: Record<SimulationEventOperation, string> = {
  set: 'Definir para',
  add: 'Aumentar/diminuir (R$)',
  addPercent: 'Aumentar/diminuir (%)',
};

/**
 * Campos que são taxas anuais (não valores monetários). Para esses campos, a
 * operação `add` (soma em R$) não faz sentido — só `set` e `addPercent` são
 * expostas na UI, e ambas são sempre expressas em percentual.
 */
const RATE_TARGETS = new Set<SimulationEventTarget>([
  'annualSalaryGrowth',
  'annualExpenseGrowth',
  'annualRealReturn',
  'annualDebtRate',
]);

const MONEY_OPERATIONS: SimulationEventOperation[] = ['set', 'add', 'addPercent'];
const RATE_OPERATIONS: SimulationEventOperation[] = ['set', 'addPercent'];

/**
 * Editor de eventos pontuais e opcionais da linha do tempo (ex.: uma herança
 * recebida, uma promoção, um corte de gastos, ou uma mudança na rentabilidade
 * esperada em uma idade específica). Nenhuma fórmula financeira vive aqui — apenas
 * coleta de dados, delegados ao motor puro (`src/core/math/events.ts`) via
 * `runSimulation`.
 *
 * Layout pensado para caber numa coluna estreita (a sidebar do simulador tem ~360px),
 * por isso cada campo ocupa a largura toda, empilhado verticalmente, em vez de um
 * grid horizontal apertado que trunca textos como "Patrimônio" ou "Definir para".
 */
export function EventsEditor({
  events,
  initialAge,
  targetAge,
  onAdd,
  onUpdate,
  onRemove,
}: EventsEditorProps) {
  return (
    <Card>
      <CardTitle>Eventos na linha do tempo</CardTitle>
      <CardDescription>
        Opcional: simule acontecimentos pontuais em uma idade específica — uma herança, uma
        promoção, um corte de gastos ou uma mudança na rentabilidade dos investimentos.
      </CardDescription>

      <Button variant="outline" size="sm" onClick={onAdd} className="mt-3 w-full">
        <Plus size={14} /> Adicionar evento
      </Button>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">
          Nenhum evento adicionado — a simulação segue a trajetória padrão, sem sobressaltos.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {events.map((event, index) => (
            <EventRow
              key={event.id}
              index={index}
              event={event}
              initialAge={initialAge}
              targetAge={targetAge}
              onUpdate={(patch) => onUpdate(event.id, patch)}
              onRemove={() => onRemove(event.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function EventRow({
  index,
  event,
  initialAge,
  targetAge,
  onUpdate,
  onRemove,
}: {
  index: number;
  event: SimulationEvent;
  initialAge: number;
  targetAge: number;
  onUpdate: (patch: Partial<Omit<SimulationEvent, 'id'>>) => void;
  onRemove: () => void;
}) {
  const age = initialAge + event.monthIndex / 12;
  const isRateTarget = RATE_TARGETS.has(event.target);
  // Para taxas, o valor é sempre percentual (tanto "definir para" quanto "%");
  // para campos monetários, só a operação "addPercent" usa valor percentual.
  const valueIsPercent = isRateTarget || event.operation === 'addPercent';
  const availableOperations = isRateTarget ? RATE_OPERATIONS : MONEY_OPERATIONS;

  function handleAgeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextAge = Number(e.target.value);
    if (!Number.isFinite(nextAge)) return;
    const monthIndex = Math.round((nextAge - initialAge) * 12);
    onUpdate({ monthIndex });
  }

  function handleTargetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextTarget = e.target.value as SimulationEventTarget;
    const patch: Partial<Omit<SimulationEvent, 'id'>> = { target: nextTarget };
    // "add" (R$ absoluto) não existe para taxas — se o usuário estava usando essa
    // operação e trocou para um campo de taxa, caímos de volta para "set".
    if (RATE_TARGETS.has(nextTarget) && event.operation === 'add') {
      patch.operation = 'set';
    }
    onUpdate(patch);
  }

  return (
    <div className="rounded-xl border border-ink/15 bg-white/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          Evento {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover evento"
          className="rounded-full p-1.5 text-ink/40 hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2.5">
        <Field label="Idade">
          <input
            type="number"
            min={initialAge}
            max={targetAge}
            step={1}
            value={Math.round(age * 10) / 10}
            onChange={handleAgeChange}
            className="w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-sm"
          />
        </Field>

        <Field label="Campo">
          <select
            value={event.target}
            onChange={handleTargetChange}
            className="w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-sm"
          >
            {Object.entries(TARGET_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ação" className="col-span-2">
          <select
            value={event.operation}
            onChange={(e) => onUpdate({ operation: e.target.value as SimulationEventOperation })}
            className="w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-sm"
          >
            {availableOperations.map((value) => (
              <option key={value} value={value}>
                {OPERATION_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>

        <Field label={valueIsPercent ? 'Valor (%)' : 'Valor (R$)'} className="col-span-2">
          <input
            type="number"
            step={valueIsPercent ? 1 : 100}
            value={valueIsPercent ? event.value * 100 : event.value}
            onChange={(e) => {
              const raw = Number(e.target.value);
              if (!Number.isFinite(raw)) return;
              onUpdate({ value: valueIsPercent ? raw / 100 : raw });
            }}
            className="w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-sm"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-ink/60">{label}</span>
      {children}
    </label>
  );
}
