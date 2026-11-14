/**
 * Cenários pré-definidos (arquétipos sociais brasileiros), prontos para uso em
 * 1-clique na página inicial. Ver seção 5 do AGENTS.md para a descrição completa e
 * o objetivo didático de cada preset.
 */
import type { SimulationInput } from '@/core/types/simulation';
import {
  DEFAULT_ANNUAL_DEBT_RATE,
  DEFAULT_INITIAL_AGE,
  DEFAULT_TARGET_AGE,
  SALARIO_MINIMO,
} from './economicConstants';

export const PRESETS: Record<string, SimulationInput> = {
  'salario-minimo': {
    id: 'salario-minimo',
    label: 'Trabalhador de Salário Mínimo',
    initialAge: DEFAULT_INITIAL_AGE,
    targetAge: DEFAULT_TARGET_AGE,
    initialWealth: 0,
    monthlySalary: SALARIO_MINIMO,
    monthlyExpenses: 1_500,
    annualSalaryGrowth: 0.015,
    annualExpenseGrowth: 0.015,
    annualRealReturn: 0.05,
    annualDebtRate: DEFAULT_ANNUAL_DEBT_RATE,
    applyBrazilianTaxModel: true,
  },
  'classe-media-baixa': {
    id: 'classe-media-baixa',
    label: 'Classe Média Baixa',
    initialAge: DEFAULT_INITIAL_AGE,
    targetAge: DEFAULT_TARGET_AGE,
    initialWealth: 0,
    monthlySalary: 4_400,
    monthlyExpenses: 3_900,
    annualSalaryGrowth: 0.02,
    annualExpenseGrowth: 0.015,
    annualRealReturn: 0.06,
    annualDebtRate: DEFAULT_ANNUAL_DEBT_RATE,
    applyBrazilianTaxModel: true,
  },
  'classe-media': {
    id: 'classe-media',
    label: 'Classe Média',
    initialAge: DEFAULT_INITIAL_AGE,
    targetAge: DEFAULT_TARGET_AGE,
    initialWealth: 0,
    monthlySalary: 10_885,
    monthlyExpenses: 8_100,
    annualSalaryGrowth: 0.02,
    annualExpenseGrowth: 0.018,
    annualRealReturn: 0.06,
    annualDebtRate: DEFAULT_ANNUAL_DEBT_RATE,
    applyBrazilianTaxModel: true,
  },
  'classe-media-alta': {
    id: 'classe-media-alta',
    label: 'Classe Média Alta',
    initialAge: DEFAULT_INITIAL_AGE,
    targetAge: DEFAULT_TARGET_AGE,
    initialWealth: 0,
    monthlySalary: 20_000,
    monthlyExpenses: 14_500,
    annualSalaryGrowth: 0.018,
    annualExpenseGrowth: 0.013,
    annualRealReturn: 0.06,
    annualDebtRate: DEFAULT_ANNUAL_DEBT_RATE,
    applyBrazilianTaxModel: true,
  },
  'herdeiro-5m': {
    id: 'herdeiro-5m',
    label: 'O Herdeiro de 5 Milhões (nunca trabalhou)',
    initialAge: DEFAULT_INITIAL_AGE,
    targetAge: DEFAULT_TARGET_AGE,
    initialWealth: 5_000_000,
    monthlySalary: 0,
    monthlyExpenses: 15_000,
    annualSalaryGrowth: 0,
    annualExpenseGrowth: 0.015,
    annualRealReturn: 0.06,
    annualDebtRate: DEFAULT_ANNUAL_DEBT_RATE,
    applyBrazilianTaxModel: true,
  },
  bilionario: {
    id: 'bilionario',
    label: 'O Jovem Bilionário (nunca trabalhou)',
    initialAge: DEFAULT_INITIAL_AGE,
    targetAge: DEFAULT_TARGET_AGE,
    initialWealth: 1_000_000_000,
    monthlySalary: 0,
    monthlyExpenses: 250_000,
    annualSalaryGrowth: 0,
    annualExpenseGrowth: 0.015,
    annualRealReturn: 0.07,
    annualDebtRate: DEFAULT_ANNUAL_DEBT_RATE,
    applyBrazilianTaxModel: true,
  },
};

export const PRESET_LIST: SimulationInput[] = Object.values(PRESETS);

export function getPreset(id: string): SimulationInput | undefined {
  return PRESETS[id];
}
