'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Breakpoint (em px) a partir do qual a seção já aparece expandida por padrão.
   * Em telas menores que isso, começa recolhida — reduzindo a rolagem necessária
   * para chegar nos resultados/gráficos em celulares. Padrão: 1024px (`lg:`).
   */
  desktopBreakpoint?: number;
}

/**
 * Seção retrátil (disclosure) sem dependências externas: em telas grandes começa
 * aberta (replicando o comportamento anterior, sem nenhuma mudança visual no
 * desktop); em telas pequenas começa fechada, para que o usuário veja o
 * gráfico/resultados com bem menos rolagem, e abra isto apenas se quiser mexer nos
 * parâmetros.
 *
 * A detecção de breakpoint roda em `useEffect` (só existe `window` no cliente), por
 * isso o estado inicial no primeiro render é sempre "fechado" — evita qualquer
 * dependência de `window` durante a exportação estática (`output: 'export'`).
 */
export function CollapsibleSection({
  title,
  description,
  children,
  className,
  desktopBreakpoint = 1024,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${desktopBreakpoint}px)`);
    setIsOpen(mql.matches);

    const handleChange = (event: MediaQueryListEvent) => setIsOpen(event.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [desktopBreakpoint]);

  return (
    <div className={cn('rounded-2xl border border-ink/10 bg-paper shadow-sm', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span>
          <span className="block font-serif text-lg font-semibold text-ink">{title}</span>
          {description && <span className="mt-1 block text-sm text-ink/60">{description}</span>}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            'shrink-0 text-ink/40 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
