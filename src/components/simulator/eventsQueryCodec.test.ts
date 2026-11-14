import { describe, expect, it } from 'vitest';
import type { SimulationEvent } from '@/core/types/simulation';
import { deserializeEvents, serializeEvents } from './eventsQueryCodec';

describe('serializeEvents / deserializeEvents', () => {
  it('faz ida e volta sem perda de dados para um único evento', () => {
    const events: SimulationEvent[] = [
      { id: 'x', monthIndex: 12, target: 'salary', operation: 'set', value: 6_000 },
    ];
    const serialized = serializeEvents(events);
    const parsed = deserializeEvents(serialized);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.monthIndex).toBe(12);
    expect(parsed[0]?.target).toBe('salary');
    expect(parsed[0]?.operation).toBe('set');
    expect(parsed[0]?.value).toBe(6_000);
  });

  it('serializa e recupera múltiplos eventos com todos os alvos e operações', () => {
    const events: SimulationEvent[] = [
      { id: 'a', monthIndex: 12, target: 'salary', operation: 'set', value: 6_000 },
      { id: 'b', monthIndex: 24, target: 'wealth', operation: 'add', value: 50_000 },
      { id: 'c', monthIndex: 36, target: 'expenses', operation: 'addPercent', value: -0.1 },
    ];
    const parsed = deserializeEvents(serializeEvents(events));

    expect(parsed.map((e) => e.monthIndex)).toEqual([12, 24, 36]);
    expect(parsed.map((e) => e.target)).toEqual(['salary', 'wealth', 'expenses']);
    expect(parsed.map((e) => e.operation)).toEqual(['set', 'add', 'addPercent']);
    expect(parsed.map((e) => e.value)).toEqual([6_000, 50_000, -0.1]);
  });

  it('serializa e recupera eventos para as quatro taxas anuais', () => {
    const events: SimulationEvent[] = [
      { id: 'a', monthIndex: 12, target: 'annualSalaryGrowth', operation: 'set', value: 0.03 },
      {
        id: 'b',
        monthIndex: 24,
        target: 'annualExpenseGrowth',
        operation: 'addPercent',
        value: -0.5,
      },
      { id: 'c', monthIndex: 36, target: 'annualRealReturn', operation: 'set', value: -0.02 },
      { id: 'd', monthIndex: 48, target: 'annualDebtRate', operation: 'set', value: 0.5 },
    ];
    const parsed = deserializeEvents(serializeEvents(events));

    expect(parsed.map((e) => e.target)).toEqual([
      'annualSalaryGrowth',
      'annualExpenseGrowth',
      'annualRealReturn',
      'annualDebtRate',
    ]);
    expect(parsed.map((e) => e.value)).toEqual([0.03, -0.5, -0.02, 0.5]);
  });

  it('preserva valores negativos corretamente (não confunde com o separador)', () => {
    const events: SimulationEvent[] = [
      { id: 'a', monthIndex: 6, target: 'wealth', operation: 'add', value: -25_000 },
    ];
    const parsed = deserializeEvents(serializeEvents(events));
    expect(parsed[0]?.value).toBe(-25_000);
  });

  it('retorna lista vazia para string vazia', () => {
    expect(deserializeEvents('')).toEqual([]);
  });

  it('ignora blocos malformados sem derrubar o parse dos demais', () => {
    const parsed = deserializeEvents('12:s:d:6000,isso-nao-eh-valido,24:w:a:1000');
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.monthIndex).toBe(12);
    expect(parsed[1]?.monthIndex).toBe(24);
  });

  it('ignora alvo ou operação com código desconhecido', () => {
    expect(deserializeEvents('12:x:d:100')).toEqual([]);
    expect(deserializeEvents('12:s:z:100')).toEqual([]);
  });

  it('ignora valores não numéricos', () => {
    expect(deserializeEvents('abc:s:d:100')).toEqual([]);
    expect(deserializeEvents('12:s:d:abc')).toEqual([]);
  });
});
