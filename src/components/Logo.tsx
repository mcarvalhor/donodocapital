import { cn } from '@/utils/cn';

export interface LogoMarkProps {
  className?: string;
}

/**
 * Marca gráfica (ícone) do "Dono do Capital": um anel (moeda/capital) atravessado por
 * barras ascendentes (crescimento), lendo-se também como um "d" estilizado. Mesma
 * geometria usada no favicon (`src/app/icon.svg`) — mantidas em sincronia manualmente,
 * já que o favicon precisa ser um arquivo estático e este componente precisa ser JSX.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('h-8 w-8', className)}
      role="img"
      aria-label="Dono do Capital"
    >
      <rect width="64" height="64" rx="14" fill="#0f1115" />
      <circle cx="32" cy="36" r="15" fill="none" stroke="#b8862f" strokeWidth="3.5" />
      <g fill="#b8862f">
        <rect x="17" y="40" width="7" height="12" rx="1.5" opacity="0.55" />
        <rect x="28.5" y="30" width="7" height="22" rx="1.5" opacity="0.8" />
        <rect x="40" y="16" width="7" height="36" rx="1.5" />
      </g>
    </svg>
  );
}

export interface LogoProps {
  className?: string;
  markClassName?: string;
  /** Se falso, exibe apenas a marca gráfica, sem o nome por extenso. */
  showWordmark?: boolean;
  /** `dark`: texto escuro, para fundos claros. `light`: texto claro, para fundos escuros. */
  variant?: 'dark' | 'light';
}

/** Logotipo completo (marca + nome), usado no cabeçalho das páginas. */
export function Logo({
  className,
  markClassName,
  showWordmark = true,
  variant = 'dark',
}: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('h-8 w-8 shrink-0', markClassName)} />
      {showWordmark && (
        <span
          className={cn(
            'font-serif text-lg font-bold leading-none tracking-tight',
            variant === 'dark' ? 'text-ink' : 'text-paper',
          )}
        >
          Dono do <span className="text-capital">Capital</span>
        </span>
      )}
    </span>
  );
}
