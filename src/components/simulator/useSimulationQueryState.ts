'use client';

import {
  createParser,
  parseAsBoolean,
  parseAsFloat,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';
import type { SimulationEvent, SimulationInput } from '@/core/types/simulation';
import { DEFAULT_INITIAL_AGE, DEFAULT_TARGET_AGE } from '@/data/economicConstants';
import { getPreset, PRESETS } from '@/data/presets';
import { deserializeEvents, serializeEvents } from './eventsQueryCodec';

/**
 * Sincroniza os parâmetros da simulação principal (e, opcionalmente, de uma simulação
 * de comparação) com a URL via `nuqs`. Isso garante que qualquer link gerado pelo
 * simulador reproduza exatamente o mesmo estado para quem o abrir — ver seção 6.3 do
 * AGENTS.md ("Persistência na URL").
 *
 * Chaves curtas de URL (ex.: `/simulador?w0=0&sal=1518&exp=1480&cmp=herdeiro-5m`).
 */
// A simulação "Classe Média Qualificada" é usada como padrão para que uma visita
// direta a /simulador (sem query string) já mostre um resultado significativo.
const DEFAULT_PRESET = PRESETS['classe-media'] as SimulationInput;

/**
 * Parser customizado do `nuqs` para a lista de eventos (ver `eventsQueryCodec.ts`
 * para o formato compacto e a discussão sobre limites de tamanho de URL).
 */
const parseAsEvents = createParser<SimulationEvent[]>({
  parse: (value) => deserializeEvents(value),
  serialize: (value) => serializeEvents(value),
}).withDefault([]);

const queryParsers = {
  preset: parseAsString.withDefault(DEFAULT_PRESET.id),
  age0: parseAsFloat.withDefault(DEFAULT_INITIAL_AGE),
  age1: parseAsFloat.withDefault(DEFAULT_TARGET_AGE),
  w0: parseAsFloat.withDefault(DEFAULT_PRESET.initialWealth),
  sal: parseAsFloat.withDefault(DEFAULT_PRESET.monthlySalary),
  exp: parseAsFloat.withDefault(DEFAULT_PRESET.monthlyExpenses),
  gs: parseAsFloat.withDefault(DEFAULT_PRESET.annualSalaryGrowth),
  ge: parseAsFloat.withDefault(DEFAULT_PRESET.annualExpenseGrowth),
  ret: parseAsFloat.withDefault(DEFAULT_PRESET.annualRealReturn),
  debt: parseAsFloat.withDefault(DEFAULT_PRESET.annualDebtRate),
  tax: parseAsBoolean.withDefault(DEFAULT_PRESET.applyBrazilianTaxModel),
  cmp: parseAsString.withDefault(''),
  scale: parseAsStringEnum<'linear' | 'log'>(['linear', 'log']).withDefault('linear'),
  ev: parseAsEvents,
};

export function useSimulationQueryState() {
  const [state, setState] = useQueryStates(queryParsers, {
    history: 'push',
  });

  const primaryInput: SimulationInput = {
    id: state.preset,
    label: PRESETS[state.preset]?.label ?? 'Sua Simulação',
    initialAge: state.age0,
    targetAge: state.age1,
    initialWealth: state.w0,
    monthlySalary: state.sal,
    monthlyExpenses: state.exp,
    annualSalaryGrowth: state.gs,
    annualExpenseGrowth: state.ge,
    annualRealReturn: state.ret,
    annualDebtRate: state.debt,
    applyBrazilianTaxModel: state.tax,
    events: state.ev,
  };

  const comparisonInput: SimulationInput | null = state.cmp ? (getPreset(state.cmp) ?? null) : null;

  function applyPreset(presetId: string) {
    const preset = getPreset(presetId);
    if (!preset) return;
    void setState({
      preset: presetId,
      age0: preset.initialAge,
      age1: preset.targetAge,
      w0: preset.initialWealth,
      sal: preset.monthlySalary,
      exp: preset.monthlyExpenses,
      gs: preset.annualSalaryGrowth,
      ge: preset.annualExpenseGrowth,
      ret: preset.annualRealReturn,
      debt: preset.annualDebtRate,
      tax: preset.applyBrazilianTaxModel,
      // Trocar de preset reinicia os eventos ad-hoc, já que eles não fazem parte da
      // definição do preset e poderiam deixar de fazer sentido no novo cenário.
      ev: [],
    });
  }

  function updateField(field: keyof typeof fieldToQueryKey, value: number | boolean) {
    const key = fieldToQueryKey[field];
    void setState({ [key]: value, preset: 'custom' } as Partial<typeof state>);
  }

  function setComparison(presetId: string | null) {
    void setState({ cmp: presetId ?? '' });
  }

  function setScale(scale: 'linear' | 'log') {
    void setState({ scale });
  }

  function addEvent() {
    const newEvent: SimulationEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      monthIndex: 0,
      target: 'salary',
      operation: 'set',
      value: state.sal,
    };
    void setState({ ev: [...state.ev, newEvent], preset: 'custom' });
  }

  function updateEvent(id: string, patch: Partial<Omit<SimulationEvent, 'id'>>) {
    const next = state.ev.map((event) => (event.id === id ? { ...event, ...patch } : event));
    void setState({ ev: next, preset: 'custom' });
  }

  function removeEvent(id: string) {
    void setState({ ev: state.ev.filter((event) => event.id !== id), preset: 'custom' });
  }

  return {
    primaryInput,
    comparisonInput,
    comparisonId: state.cmp || null,
    scale: state.scale,
    applyPreset,
    updateField,
    setComparison,
    setScale,
    addEvent,
    updateEvent,
    removeEvent,
  };
}

const fieldToQueryKey = {
  initialAge: 'age0',
  targetAge: 'age1',
  initialWealth: 'w0',
  monthlySalary: 'sal',
  monthlyExpenses: 'exp',
  annualSalaryGrowth: 'gs',
  annualExpenseGrowth: 'ge',
  annualRealReturn: 'ret',
  annualDebtRate: 'debt',
  applyBrazilianTaxModel: 'tax',
} as const;
