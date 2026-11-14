import { describe, expect, it } from 'vitest';
import type { SimulationEvent } from '@/core/types/simulation';
import {
  applyEvent,
  applyEventsForMonth,
  groupEventsByMonth,
  type EventApplicationState,
} from './events';

function makeEvent(overrides: Partial<SimulationEvent> = {}): SimulationEvent {
  return {
    id: 'evt-test',
    monthIndex: 12,
    target: 'wealth',
    operation: 'set',
    value: 0,
    ...overrides,
  };
}

function baseState(overrides: Partial<EventApplicationState> = {}): EventApplicationState {
  return {
    wealth: 0,
    salary: 0,
    expenses: 0,
    annualSalaryGrowth: 0,
    annualExpenseGrowth: 0,
    annualRealReturn: 0,
    annualDebtRate: 0,
    ...overrides,
  };
}

describe('applyEvent — campos monetários', () => {
  it('define o valor absoluto com a operação "set"', () => {
    const next = applyEvent(
      baseState({ wealth: 1_000, salary: 2_000, expenses: 1_500 }),
      makeEvent({ target: 'salary', operation: 'set', value: 6_000 }),
    );
    expect(next.salary).toBe(6_000);
    expect(next.wealth).toBe(1_000);
    expect(next.expenses).toBe(1_500);
  });

  it('soma um valor absoluto com a operação "add" (aceita negativos)', () => {
    const next = applyEvent(
      baseState({ wealth: 100_000 }),
      makeEvent({ target: 'wealth', operation: 'add', value: 50_000 }),
    );
    expect(next.wealth).toBe(150_000);

    const decreased = applyEvent(
      baseState({ wealth: 100_000 }),
      makeEvent({ target: 'wealth', operation: 'add', value: -30_000 }),
    );
    expect(decreased.wealth).toBe(70_000);
  });

  it('aplica percentual multiplicativo com a operação "addPercent"', () => {
    const increased = applyEvent(
      baseState({ salary: 4_000 }),
      makeEvent({ target: 'salary', operation: 'addPercent', value: 0.1 }),
    );
    expect(increased.salary).toBeCloseTo(4_400, 6);

    const decreased = applyEvent(
      baseState({ expenses: 2_000 }),
      makeEvent({ target: 'expenses', operation: 'addPercent', value: -0.25 }),
    );
    expect(decreased.expenses).toBeCloseTo(1_500, 6);
  });

  it('permite patrimônio negativo (dívida), mas nunca salário ou gastos negativos', () => {
    const negativeWealth = applyEvent(
      baseState(),
      makeEvent({ target: 'wealth', operation: 'add', value: -10_000 }),
    );
    expect(negativeWealth.wealth).toBe(-10_000);

    const clampedSalary = applyEvent(
      baseState({ salary: 1_000 }),
      makeEvent({ target: 'salary', operation: 'add', value: -5_000 }),
    );
    expect(clampedSalary.salary).toBe(0);

    const clampedExpenses = applyEvent(
      baseState({ expenses: 500 }),
      makeEvent({ target: 'expenses', operation: 'addPercent', value: -2 }),
    );
    expect(clampedExpenses.expenses).toBe(0);
  });

  it('não muta o estado recebido (retorna um novo objeto)', () => {
    const state = baseState({ wealth: 100 });
    const next = applyEvent(state, makeEvent({ target: 'wealth', operation: 'add', value: 1 }));
    expect(state.wealth).toBe(100);
    expect(next).not.toBe(state);
  });
});

describe('applyEvent — taxas anuais', () => {
  it('define uma taxa anual diretamente com "set" (valor em decimal)', () => {
    const next = applyEvent(
      baseState({ annualRealReturn: 0.06 }),
      makeEvent({ target: 'annualRealReturn', operation: 'set', value: 0.03 }),
    );
    expect(next.annualRealReturn).toBe(0.03);
  });

  it('aplica variação percentual relativa sobre uma taxa com "addPercent"', () => {
    const next = applyEvent(
      baseState({ annualSalaryGrowth: 0.02 }),
      makeEvent({ target: 'annualSalaryGrowth', operation: 'addPercent', value: 0.5 }),
    );
    expect(next.annualSalaryGrowth).toBeCloseTo(0.03, 10);
  });

  it('permite taxas negativas (ex.: retorno real negativo numa crise) sem travar em zero', () => {
    const next = applyEvent(
      baseState({ annualRealReturn: 0.02 }),
      makeEvent({ target: 'annualRealReturn', operation: 'set', value: -0.05 }),
    );
    expect(next.annualRealReturn).toBe(-0.05);
  });

  it('também aceita "add" em termos absolutos para taxas (ponto percentual)', () => {
    // A UI não expõe essa combinação para taxas, mas o motor continua genérico e
    // matematicamente correto para qualquer combinação alvo/operação.
    const next = applyEvent(
      baseState({ annualDebtRate: 0.25 }),
      makeEvent({ target: 'annualDebtRate', operation: 'add', value: 0.1 }),
    );
    expect(next.annualDebtRate).toBeCloseTo(0.35, 10);
  });
});

describe('groupEventsByMonth', () => {
  it('agrupa eventos pelo monthIndex, preservando a ordem original', () => {
    const events = [
      makeEvent({ id: 'a', monthIndex: 12 }),
      makeEvent({ id: 'b', monthIndex: 24 }),
      makeEvent({ id: 'c', monthIndex: 12 }),
    ];
    const grouped = groupEventsByMonth(events);
    expect(grouped.get(12)?.map((e) => e.id)).toEqual(['a', 'c']);
    expect(grouped.get(24)?.map((e) => e.id)).toEqual(['b']);
    expect(grouped.get(99)).toBeUndefined();
  });
});

describe('applyEventsForMonth', () => {
  it('aplica múltiplos eventos em sequência, na ordem recebida', () => {
    const result = applyEventsForMonth(baseState({ salary: 1_000 }), [
      makeEvent({ target: 'salary', operation: 'set', value: 5_000 }),
      makeEvent({ target: 'salary', operation: 'addPercent', value: 0.1 }),
    ]);
    expect(result.state.salary).toBeCloseTo(5_500, 6);
  });

  it('contabiliza o ajuste líquido de patrimônio apenas para eventos de wealth', () => {
    const result = applyEventsForMonth(
      baseState({ wealth: 10_000, salary: 3_000, expenses: 2_000 }),
      [
        makeEvent({ target: 'wealth', operation: 'add', value: 50_000 }),
        makeEvent({ target: 'salary', operation: 'set', value: 8_000 }),
        makeEvent({ target: 'wealth', operation: 'add', value: -5_000 }),
      ],
    );
    expect(result.state.wealth).toBe(55_000);
    expect(result.state.salary).toBe(8_000);
    // Ajuste de patrimônio = +50.000 - 5.000 = +45.000 (a mudança de salário não conta aqui).
    expect(result.wealthAdjustment).toBe(45_000);
  });

  it('retorna ajuste zero e estado inalterado quando não há eventos', () => {
    const state = baseState({ wealth: 1, salary: 2, expenses: 3 });
    const result = applyEventsForMonth(state, []);
    expect(result.state).toEqual(state);
    expect(result.wealthAdjustment).toBe(0);
  });

  it('aplica eventos de taxas junto com eventos monetários no mesmo mês', () => {
    const result = applyEventsForMonth(baseState({ wealth: 1_000, annualRealReturn: 0.06 }), [
      makeEvent({ target: 'wealth', operation: 'add', value: 500 }),
      makeEvent({ target: 'annualRealReturn', operation: 'set', value: 0.03 }),
    ]);
    expect(result.state.wealth).toBe(1_500);
    expect(result.state.annualRealReturn).toBe(0.03);
    expect(result.wealthAdjustment).toBe(500);
  });
});
