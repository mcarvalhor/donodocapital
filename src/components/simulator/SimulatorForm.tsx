import type { SimulationInput } from '@/core/types/simulation';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Slider } from '@/components/ui/Slider';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatPercentage } from '@/utils/formatters';

/** Campos da simulação que podem ser editados diretamente pelo usuário no formulário. */
export type EditableSimulationField = Exclude<keyof SimulationInput, 'id' | 'label' | 'events'>;

export interface SimulatorFormProps {
  input: SimulationInput;
  onChange: (field: EditableSimulationField, value: number | boolean) => void;
}

/**
 * Controles interativos da simulação. Nenhuma lógica financeira vive aqui — este
 * componente apenas coleta valores do usuário e delega ao chamador (que invoca o
 * motor puro em `src/core/math`).
 */
export function SimulatorForm({ input, onChange }: SimulatorFormProps) {
  return (
    <Card>
      <CardTitle>Configure sua simulação</CardTitle>
      <CardDescription>
        Ajuste os parâmetros abaixo para simular sua própria trajetória patrimonial dos{' '}
        {input.initialAge} aos {input.targetAge} anos.
      </CardDescription>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MoneyInput
          id="initialWealth"
          label="Patrimônio inicial"
          value={input.initialWealth}
          onValueChange={(v) => onChange('initialWealth', v)}
        />
        <MoneyInput
          id="monthlySalary"
          label="Salário mensal (bruto)"
          value={input.monthlySalary}
          onValueChange={(v) => onChange('monthlySalary', v)}
        />
        <MoneyInput
          id="monthlyExpenses"
          label="Custo de vida mensal"
          value={input.monthlyExpenses}
          onValueChange={(v) => onChange('monthlyExpenses', v)}
        />
      </div>

      <div className="mt-6 space-y-5">
        <SliderField
          label="Reajuste salarial anual (real)"
          value={input.annualSalaryGrowth}
          onValueChange={(v) => onChange('annualSalaryGrowth', v)}
          min={0}
          max={0.15}
          step={0.001}
        />
        <SliderField
          label="Crescimento do custo de vida anual (real)"
          value={input.annualExpenseGrowth}
          onValueChange={(v) => onChange('annualExpenseGrowth', v)}
          min={0}
          max={0.15}
          step={0.001}
        />
        <SliderField
          label="Rentabilidade real anual dos investimentos"
          value={input.annualRealReturn}
          onValueChange={(v) => onChange('annualRealReturn', v)}
          min={0}
          max={0.2}
          step={0.001}
        />
        <SliderField
          label="Juros reais de dívida (se o saldo ficar negativo)"
          value={input.annualDebtRate}
          onValueChange={(v) => onChange('annualDebtRate', v)}
          min={0}
          max={1.5}
          step={0.005}
        />
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={input.applyBrazilianTaxModel}
          onChange={(e) => onChange('applyBrazilianTaxModel', e.target.checked)}
          className="h-4 w-4 rounded border-ink/30 text-capital focus:ring-capital"
        />
        Aplicar assimetria tributária brasileira (IRPF/INSS vs. capital)
      </label>
    </Card>
  );
}

function SliderField({
  label,
  value,
  onValueChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-ink/80">{label}</span>
        <span className="font-medium text-ink">{formatPercentage(value)}</span>
      </div>
      <Slider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        aria-label={label}
      />
    </div>
  );
}
