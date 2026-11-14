import { cn } from '@/utils/cn';

export interface ScaleToggleProps {
  scale: 'linear' | 'log';
  onChange: (scale: 'linear' | 'log') => void;
}

/**
 * Alternância obrigatória entre escala linear e logarítmica (ver seção 6.2 do
 * AGENTS.md). Essencial ao comparar cenários com ordens de magnitude muito distintas
 * (ex.: Salário Mínimo vs. Herdeiro), onde a escala linear achata a linha menor.
 */
export function ScaleToggle({ scale, onChange }: ScaleToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-ink/15 bg-paper p-1 text-xs">
      {(['linear', 'log'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-full px-3 py-1 font-medium transition-colors',
            scale === option ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink',
          )}
        >
          {option === 'linear' ? 'Escala Linear' : 'Escala Logarítmica'}
        </button>
      ))}
    </div>
  );
}
