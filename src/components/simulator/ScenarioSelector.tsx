import { PRESET_LIST } from '@/data/presets';
import { formatCompactBRL } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export interface ScenarioSelectorProps {
  selectedId: string | null;
  onSelect: (presetId: string) => void;
  className?: string;
  heading?: string;
}

/** Grade de cenários pré-definidos (arquétipos sociais brasileiros) em 1-clique. */
export function ScenarioSelector({
  selectedId,
  onSelect,
  className,
  heading = 'Cenários prontos',
}: ScenarioSelectorProps) {
  return (
    <div className={className}>
      {heading && <h2 className="mb-3 font-serif text-xl font-semibold text-ink">{heading}</h2>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PRESET_LIST.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={cn(
              'rounded-2xl border p-4 text-left transition-colors',
              selectedId === preset.id
                ? 'border-capital bg-capital-soft'
                : 'border-ink/10 bg-paper hover:border-capital/60',
            )}
          >
            <p className="font-serif text-base font-semibold text-ink">{preset.label}</p>
            <p className="mt-1 text-xs text-ink/60">
              Patrimônio inicial: {formatCompactBRL(preset.initialWealth)} · Salário:{' '}
              {formatCompactBRL(preset.monthlySalary)}/mês
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
