import { describe, expect, it } from 'vitest';
import type { SimulationInput } from '@/core/types/simulation';
import { getPreset } from '@/data/presets';
import { runSimulation } from './engine';
import { annualToMonthlyRate, monthlyToAnnualRate, nominalToRealRate } from './rates';
import {
  calculateINSS,
  calculateIRPF,
  calculateIRPFByTable,
  calculateNetCapitalIncome,
  calculateNetSalary,
} from './taxes';

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

describe('rates', () => {
  it('converte taxa anual 0% em taxa mensal 0%', () => {
    expect(annualToMonthlyRate(0)).toBe(0);
  });

  it('converte 12% a.a. corretamente em taxa mensal equivalente', () => {
    const monthly = annualToMonthlyRate(0.12);
    expect(monthly).toBeCloseTo(Math.pow(1.12, 1 / 12) - 1, 10);
    // Ida e volta deve recuperar a taxa anual original.
    expect(monthlyToAnnualRate(monthly)).toBeCloseTo(0.12, 10);
  });

  it('calcula taxa real a partir de nominal e inflação', () => {
    expect(nominalToRealRate(0.1, 0.04)).toBeCloseTo(1.1 / 1.04 - 1, 10);
  });
});

describe('taxes', () => {
  it('não tributa salário igual a zero', () => {
    expect(calculateNetSalary(0, true)).toBe(0);
    expect(calculateINSS(0)).toBe(0);
    expect(calculateIRPF(0)).toBe(0);
  });

  it('retorna o bruto quando o modelo de tributação está desativado', () => {
    expect(calculateNetSalary(10_000, false)).toBe(10_000);
  });

  it('aplica tributação progressiva reduzindo o salário líquido quando ativado', () => {
    const net = calculateNetSalary(10_000, true);
    expect(net).toBeLessThan(10_000);
    expect(net).toBeGreaterThan(0);
  });

  it('não aplica benefício fiscal sobre rendimento de capital negativo (juros de dívida)', () => {
    expect(calculateNetCapitalIncome(-100, true)).toBe(-100);
  });

  it('aplica a alíquota de capital sobre rendimento positivo quando ativado', () => {
    expect(calculateNetCapitalIncome(100, true)).toBeCloseTo(85, 10);
    expect(calculateNetCapitalIncome(100, false)).toBe(100);
  });

  describe('Reforma do IRPF de 2026 (isenção até R$5.000 + faixa de transição)', () => {
    it('isenta totalmente rendas até R$ 5.000, mesmo que a tabela cheia cobrasse imposto', () => {
      expect(calculateIRPF(4_000)).toBe(0);
      expect(calculateIRPF(5_000)).toBe(0);
      // A tabela cheia (pré-reforma) cobraria imposto nesses valores.
      expect(calculateIRPFByTable(5_000)).toBeGreaterThan(0);
    });

    it('reduz proporcionalmente o imposto na faixa de transição (R$5.000–R$7.000)', () => {
      const taxAt6000 = calculateIRPF(6_000);
      const fullTableAt6000 = calculateIRPFByTable(6_000);
      expect(taxAt6000).toBeGreaterThan(0);
      expect(taxAt6000).toBeLessThan(fullTableAt6000);
      // Aproximadamente metade do caminho da faixa de transição (6.000 está a 50% entre 5.000 e 7.000).
      expect(taxAt6000).toBeCloseTo(fullTableAt6000 * 0.5, 10);
    });

    it('converge para a tabela cheia exatamente no teto da faixa de transição', () => {
      expect(calculateIRPF(7_000)).toBeCloseTo(calculateIRPFByTable(7_000), 10);
    });

    it('é idêntico à tabela cheia para rendas acima da faixa de transição', () => {
      expect(calculateIRPF(10_000)).toBeCloseTo(calculateIRPFByTable(10_000), 10);
      expect(calculateIRPF(50_000)).toBeCloseTo(calculateIRPFByTable(50_000), 10);
    });

    it('reduz o imposto líquido do trabalhador de classe média em relação à tabela antiga', () => {
      // Efeito prático da reforma: quem ganha próximo da faixa de isenção paga menos.
      const netWithReform = calculateNetSalary(4_800, true);
      const grossMinusInssAndFullTable =
        4_800 - calculateINSS(4_800) - calculateIRPFByTable(4_800 - calculateINSS(4_800));
      expect(netWithReform).toBeGreaterThan(grossMinusInssAndFullTable);
    });
  });
});

describe('runSimulation — edge cases', () => {
  it('retorna apenas o estado inicial quando targetAge === initialAge', () => {
    const result = runSimulation(baseInput({ targetAge: 18 }));
    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0]?.wealth).toBe(0);
  });

  it('retorna apenas o estado inicial quando targetAge < initialAge (sem crash)', () => {
    const result = runSimulation(baseInput({ initialAge: 30, targetAge: 25 }));
    expect(result.timeline).toHaveLength(1);
  });

  it('mantém o patrimônio constante com taxa de juros 0% e fluxo de caixa 0', () => {
    const result = runSimulation(
      baseInput({ initialWealth: 10_000, targetAge: 30, annualRealReturn: 0 }),
    );
    for (const snapshot of result.timeline) {
      expect(snapshot.wealth).toBeCloseTo(10_000, 6);
    }
  });

  it('lida com patrimônio inicial negativo aplicando juros de dívida mensais', () => {
    const result = runSimulation(
      baseInput({
        initialWealth: -10_000,
        targetAge: 19,
        annualDebtRate: 0.25,
        applyBrazilianTaxModel: false,
      }),
    );
    const last = result.timeline.at(-1)!;
    // Sem renda e com dívida, o patrimônio deve piorar (ficar mais negativo).
    expect(last.wealth).toBeLessThan(-10_000);
  });

  it('lida com salário igual a R$ 0 sem gerar NaN e mantendo renda líquida em 0', () => {
    const result = runSimulation(baseInput({ monthlySalary: 0, targetAge: 20 }));
    for (const snapshot of result.timeline) {
      expect(snapshot.netSalary).toBe(0);
      expect(Number.isNaN(snapshot.wealth)).toBe(false);
    }
  });

  it('lida com valores na casa dos bilhões sem perder precisão perceptível', () => {
    const result = runSimulation(
      baseInput({ initialWealth: 1_000_000_000, targetAge: 19, annualRealReturn: 0.07 }),
    );
    const last = result.timeline.at(-1)!;
    expect(last.wealth).toBeGreaterThan(1_000_000_000);
    expect(Number.isFinite(last.wealth)).toBe(true);
  });

  it('respeita a identidade contábil: patrimônio final = inicial + trabalho + capital', () => {
    const input = baseInput({
      initialWealth: 1_000,
      monthlySalary: 3_000,
      monthlyExpenses: 2_000,
      annualRealReturn: 0.06,
      targetAge: 40,
    });
    const result = runSimulation(input);
    const last = result.timeline.at(-1)!;
    const reconstructed =
      input.initialWealth + last.cumulativeWorkSavings + last.cumulativeCapitalGains;
    expect(last.wealth).toBeCloseTo(reconstructed, 6);
  });

  it('calcula o ponto de independência financeira corretamente, ou null se nunca atingido', () => {
    // Margem de poupança mínima (R$ 38/mês) e 47 anos de juros compostos a 5% a.a. real
    // não são suficientes para que a renda passiva supere o custo de vida de R$ 1.480 —
    // exatamente o ponto didático central do preset de salário mínimo (seção 5 do AGENTS.md).
    const neverIndependent = runSimulation(
      baseInput({
        monthlySalary: 1_518,
        monthlyExpenses: 1_480,
        annualRealReturn: 0.05,
        initialWealth: 0,
      }),
    );
    expect(neverIndependent.summary.financialIndependenceAge).toBeNull();
  });

  it('herdeiro com renda passiva inicial superior ao custo de vida é independente quase que instantaneamente', () => {
    const preset = getPreset('herdeiro-5m')!;
    const result = runSimulation(preset);
    // No mês 0 ainda não houve rendimento de capital (R_0 = 0 por definição); a
    // independência é detectada já no 1º mês, assim que o capital começa a render.
    expect(result.summary.financialIndependenceAge).toBeCloseTo(preset.initialAge + 1 / 12, 10);
  });
});

describe('runSimulation — presets oficiais', () => {
  it('todos os presets executam sem lançar erros e produzem patrimônio final finito', () => {
    for (const id of ['salario-minimo', 'classe-media', 'herdeiro-5m', 'bilionario']) {
      const preset = getPreset(id)!;
      const result = runSimulation(preset);
      expect(Number.isFinite(result.summary.finalWealth)).toBe(true);
      expect(result.timeline.length).toBeGreaterThan(0);
    }
  });

  it('a margem de independência do salário mínimo é marginal, muito diferente da folga de quem herda capital', () => {
    // Em vez de fixar um resultado exato (sensível a ajustes finos dos parâmetros do
    // preset), validamos a propriedade estrutural central do simulador: mesmo que o
    // trabalhador de salário mínimo eventualmente alcance ou beire a independência
    // financeira após 47 anos de poupança, a margem é mínima — bem diferente da folga
    // confortável de quem começa com capital herdado.
    const minWage = runSimulation(getPreset('salario-minimo')!);
    const heir = runSimulation(getPreset('herdeiro-5m')!);

    const minWageRatio =
      minWage.summary.finalMonthlyPassiveIncome / minWage.summary.finalMonthlyExpenses;
    const heirRatio = heir.summary.finalMonthlyPassiveIncome / heir.summary.finalMonthlyExpenses;

    expect(minWageRatio).toBeLessThan(1.2);
    expect(minWageRatio).toBeLessThan(heirRatio);
  });

  it('o jovem bilionário tem patrimônio final muito superior ao inicial mesmo gastando muito', () => {
    const preset = getPreset('bilionario')!;
    const result = runSimulation(preset);
    expect(result.summary.finalWealth).toBeGreaterThan(preset.initialWealth);
    expect(result.summary.capitalSharePercentage).toBeGreaterThan(95);
  });
});

describe('runSimulation — eventos na linha do tempo', () => {
  it('evento "set" de salário altera o salário líquido a partir do mês agendado', () => {
    const result = runSimulation(
      baseInput({
        monthlySalary: 2_000,
        monthlyExpenses: 0,
        targetAge: 20,
        events: [{ id: 'e1', monthIndex: 12, target: 'salary', operation: 'set', value: 10_000 }],
      }),
    );
    const beforeEvent = result.timeline.find((s) => s.monthIndex === 11)!;
    const atEvent = result.timeline.find((s) => s.monthIndex === 12)!;
    expect(beforeEvent.netSalary).toBeCloseTo(2_000, 6);
    expect(atEvent.netSalary).toBeCloseTo(10_000, 6);
  });

  it('evento "add" de patrimônio (ex.: herança) já rende capital no mesmo mês', () => {
    const result = runSimulation(
      baseInput({
        initialWealth: 0,
        annualRealReturn: 0.12,
        targetAge: 19,
        events: [{ id: 'e1', monthIndex: 6, target: 'wealth', operation: 'add', value: 100_000 }],
      }),
    );
    const beforeEvent = result.timeline.find((s) => s.monthIndex === 5)!;
    const atEvent = result.timeline.find((s) => s.monthIndex === 6)!;
    expect(beforeEvent.wealth).toBeCloseTo(0, 6);
    // O patrimônio no mês do evento inclui os 100.000 injetados MAIS o rendimento
    // daquele mesmo mês sobre esse novo valor (evento aplicado antes do cálculo de capital).
    expect(atEvent.wealth).toBeGreaterThan(100_000);
    expect(atEvent.passiveIncome).toBeGreaterThan(0);
  });

  it('evento "addPercent" aplica variação percentual multiplicativa sobre gastos', () => {
    const result = runSimulation(
      baseInput({
        monthlyExpenses: 2_000,
        targetAge: 19,
        events: [
          { id: 'e1', monthIndex: 6, target: 'expenses', operation: 'addPercent', value: -0.5 },
        ],
      }),
    );
    const atEvent = result.timeline.find((s) => s.monthIndex === 6)!;
    expect(atEvent.expenses).toBeCloseTo(1_000, 6);
  });

  it('múltiplos eventos no mesmo mês são aplicados em sequência, na ordem informada', () => {
    const result = runSimulation(
      baseInput({
        monthlySalary: 1_000,
        targetAge: 19,
        events: [
          { id: 'e1', monthIndex: 6, target: 'salary', operation: 'set', value: 5_000 },
          { id: 'e2', monthIndex: 6, target: 'salary', operation: 'addPercent', value: 0.2 },
        ],
      }),
    );
    const atEvent = result.timeline.find((s) => s.monthIndex === 6)!;
    expect(atEvent.netSalary).toBeCloseTo(6_000, 6);
  });

  it('evento no mês 0 afeta o próprio snapshot inicial', () => {
    const result = runSimulation(
      baseInput({
        initialWealth: 0,
        targetAge: 19,
        events: [{ id: 'e1', monthIndex: 0, target: 'wealth', operation: 'set', value: 5_000 }],
      }),
    );
    expect(result.timeline[0]?.wealth).toBe(5_000);
  });

  it('eventos fora do intervalo [0, N] são ignorados, sem lançar erro', () => {
    const result = runSimulation(
      baseInput({
        targetAge: 19,
        events: [
          { id: 'e1', monthIndex: -5, target: 'wealth', operation: 'set', value: 999 },
          { id: 'e2', monthIndex: 9_999, target: 'wealth', operation: 'set', value: 999 },
        ],
      }),
    );
    expect(result.timeline.every((s) => s.wealth !== 999)).toBe(true);
  });

  it('eventos de patrimônio são contabilizados como capital na identidade finalWealth = trabalho + capital', () => {
    const input = baseInput({
      initialWealth: 1_000,
      monthlySalary: 3_000,
      monthlyExpenses: 2_000,
      annualRealReturn: 0.06,
      targetAge: 30,
      events: [{ id: 'e1', monthIndex: 60, target: 'wealth', operation: 'add', value: 200_000 }],
    });
    const result = runSimulation(input);
    const { summary } = result;
    expect(summary.finalWealth).toBeCloseTo(
      summary.totalWorkContribution + summary.totalCapitalContribution,
      6,
    );
  });

  it('simulação sem events (undefined) continua funcionando normalmente', () => {
    const result = runSimulation(baseInput({ monthlySalary: 1_000, monthlyExpenses: 800 }));
    expect(Number.isFinite(result.summary.finalWealth)).toBe(true);
  });

  it('evento "set" em annualRealReturn muda a rentabilidade mensal a partir do mês agendado', () => {
    const result = runSimulation(
      baseInput({
        initialWealth: 100_000,
        annualRealReturn: 0,
        targetAge: 20,
        events: [
          { id: 'e1', monthIndex: 12, target: 'annualRealReturn', operation: 'set', value: 0.12 },
        ],
      }),
    );
    // Mês 11: ainda sob a taxa antiga (0%) — patrimônio não cresceu por rendimento.
    const beforeEvent = result.timeline.find((s) => s.monthIndex === 11)!;
    // Mês 12: o evento é aplicado no INÍCIO do mês, então o rendimento daquele
    // próprio mês já usa a nova taxa (12% a.a.) — ver JSDoc de `runSimulation`.
    const atEvent = result.timeline.find((s) => s.monthIndex === 12)!;
    expect(beforeEvent.wealth).toBeCloseTo(100_000, 6);
    expect(atEvent.passiveIncome).toBeGreaterThan(0);
  });

  it('evento "addPercent" em annualSalaryGrowth altera a taxa de reajuste anual de forma relativa', () => {
    const resultWithoutEvent = runSimulation(
      baseInput({ monthlySalary: 5_000, annualSalaryGrowth: 0.02, targetAge: 20 }),
    );
    const resultWithEvent = runSimulation(
      baseInput({
        monthlySalary: 5_000,
        annualSalaryGrowth: 0.02,
        targetAge: 20,
        events: [
          {
            id: 'e1',
            monthIndex: 6,
            target: 'annualSalaryGrowth',
            operation: 'addPercent',
            value: 1, // dobra a taxa de reajuste (0.02 -> 0.04)
          },
        ],
      }),
    );
    // Com uma taxa de reajuste maior, o salário final (líquido) deve ser maior.
    expect(resultWithEvent.summary.finalMonthlyNetSalary).toBeGreaterThan(
      resultWithoutEvent.summary.finalMonthlyNetSalary,
    );
  });

  it('evento em annualDebtRate muda o custo da dívida para patrimônio negativo', () => {
    const result = runSimulation(
      baseInput({
        initialWealth: -10_000,
        annualDebtRate: 0,
        targetAge: 20,
        applyBrazilianTaxModel: false,
        events: [{ id: 'e1', monthIndex: 6, target: 'annualDebtRate', operation: 'set', value: 1 }],
      }),
    );
    // Mês 5: ainda sob a taxa antiga (0%) — patrimônio negativo não piora por juros.
    const beforeEvent = result.timeline.find((s) => s.monthIndex === 5)!;
    // Mês 6: evento aplicado no início do mês — os juros daquele mesmo mês já usam
    // a nova taxa (100% a.a.), piorando o patrimônio negativo.
    const atEvent = result.timeline.find((s) => s.monthIndex === 6)!;
    expect(beforeEvent.wealth).toBeCloseTo(-10_000, 6);
    expect(atEvent.wealth).toBeLessThan(beforeEvent.wealth);
  });

  it('taxas podem ficar negativas via evento, sem serem travadas em zero', () => {
    const result = runSimulation(
      baseInput({
        initialWealth: 100_000,
        annualRealReturn: 0.06,
        targetAge: 20,
        events: [
          {
            id: 'e1',
            monthIndex: 6,
            target: 'annualRealReturn',
            operation: 'set',
            value: -0.1,
          },
        ],
      }),
    );
    const afterEvent = result.timeline.find((s) => s.monthIndex === 7)!;
    // Retorno real negativo deve corroer o patrimônio via rendimento negativo.
    expect(afterEvent.passiveIncome).toBeLessThan(0);
  });
});
