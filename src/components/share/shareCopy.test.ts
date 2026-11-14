import { describe, expect, it } from 'vitest';
import { runSimulation } from '@/core/math/engine';
import type { SimulationInput } from '@/core/types/simulation';
import { buildComparisonEmphasis, buildShareHeadline, buildShareStats } from './shareCopy';

function baseInput(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    id: 'test',
    label: 'Teste',
    initialAge: 18,
    targetAge: 65,
    initialWealth: 0,
    monthlySalary: 0,
    monthlyExpenses: 0,
    annualSalaryGrowth: 0,
    annualExpenseGrowth: 0,
    annualRealReturn: 0,
    annualDebtRate: 0,
    applyBrazilianTaxModel: false,
    ...overrides,
  };
}

describe('buildShareHeadline', () => {
  it('menciona "nunca trabalha" quando o salário é zero', () => {
    const result = runSimulation(
      baseInput({ initialWealth: 5_000_000, monthlySalary: 0, monthlyExpenses: 15_000 }),
    );
    const headline = buildShareHeadline(result);
    expect(headline).toContain('nunca trabalha');
    expect(headline).not.toContain('ganha');
  });

  it('menciona o salário quando ele é maior que zero', () => {
    const result = runSimulation(
      baseInput({ monthlySalary: 4_500, monthlyExpenses: 3_600, annualRealReturn: 0.06 }),
    );
    const headline = buildShareHeadline(result);
    expect(headline).toContain('ganha');
    expect(headline).not.toContain('nunca trabalha');
  });

  it('indica "sem nada no bolso" quando o patrimônio inicial é zero', () => {
    const result = runSimulation(baseInput({ monthlySalary: 1_500, monthlyExpenses: 1_400 }));
    expect(buildShareHeadline(result)).toContain('sem nada no bolso');
  });

  it('acrescenta "nunca será dono do capital" quando a independência nunca é atingida', () => {
    const result = runSimulation(
      baseInput({ monthlySalary: 1_518, monthlyExpenses: 1_480, annualRealReturn: 0.01 }),
    );
    expect(result.summary.financialIndependenceAge).toBeNull();
    expect(buildShareHeadline(result)).toContain('nunca será dono do capital');
  });

  it('acrescenta "sendo dono do capital" quando a independência é atingida', () => {
    const result = runSimulation(
      baseInput({ initialWealth: 5_000_000, monthlyExpenses: 15_000, annualRealReturn: 0.06 }),
    );
    expect(result.summary.financialIndependenceAge).not.toBeNull();
    expect(buildShareHeadline(result)).toContain('sendo dono do capital');
    expect(buildShareHeadline(result)).not.toContain('nunca será dono do capital');
  });
});

describe('buildShareStats', () => {
  it('usa o rendimento do 1º mês como renda passiva inicial (mês 0 é sempre zero por definição)', () => {
    const result = runSimulation(
      baseInput({ initialWealth: 5_000_000, monthlyExpenses: 15_000, annualRealReturn: 0.06 }),
    );
    const stats = buildShareStats(result);

    expect(stats.initial.passiveIncome).toBeGreaterThan(0);
    expect(stats.initial.ageLabel).toBe('Aos 18 anos');
    expect(stats.initial.wealth).toBe(5_000_000);
  });

  it('usa os valores do resumo final para o snapshot final', () => {
    const result = runSimulation(
      baseInput({ monthlySalary: 4_500, monthlyExpenses: 3_600, annualRealReturn: 0.06 }),
    );
    const stats = buildShareStats(result);

    expect(stats.final.ageLabel).toBe('Aos 65 anos');
    expect(stats.final.wealth).toBe(result.summary.finalWealth);
    expect(stats.final.netSalary).toBe(result.summary.finalMonthlyNetSalary);
    expect(stats.final.passiveIncome).toBe(result.summary.finalMonthlyPassiveIncome);
    expect(stats.final.expenses).toBe(result.summary.finalMonthlyExpenses);
  });

  it('não lança erro quando a simulação tem 0 meses (targetAge === initialAge)', () => {
    const result = runSimulation(baseInput({ targetAge: 18, initialWealth: 1_000 }));
    const stats = buildShareStats(result);
    expect(stats.initial.passiveIncome).toBe(0);
    expect(stats.initial.wealth).toBe(1_000);
  });
});

describe('buildComparisonEmphasis', () => {
  it('retorna null quando não há comparação', () => {
    const result = runSimulation(baseInput({ monthlySalary: 1_500, monthlyExpenses: 1_400 }));
    expect(buildComparisonEmphasis(result, null)).toBeNull();
  });

  it('retorna null quando a comparação termina pior que a simulação principal', () => {
    const primary = runSimulation(
      baseInput({ initialWealth: 5_000_000, monthlyExpenses: 15_000, annualRealReturn: 0.06 }),
    );
    const comparison = runSimulation(baseInput({ monthlySalary: 1_500, monthlyExpenses: 1_400 }));
    expect(buildComparisonEmphasis(primary, comparison)).toBeNull();
  });

  it('inclui o múltiplo de diferença quando a comparação é significativamente melhor', () => {
    const primary = runSimulation(baseInput({ monthlySalary: 1_500, monthlyExpenses: 1_400 }));
    const comparison = runSimulation(
      baseInput({
        id: 'herdeiro-5m',
        label: 'O Herdeiro de 5 Milhões',
        initialWealth: 5_000_000,
        monthlyExpenses: 15_000,
        annualRealReturn: 0.06,
      }),
    );
    const emphasis = buildComparisonEmphasis(primary, comparison);
    expect(emphasis).toContain('O Herdeiro de 5 Milhões');
    expect(emphasis).toMatch(/x mais/);
  });
});
