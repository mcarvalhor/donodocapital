'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface MoneyInputProps {
  id?: string;
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Input monetário com digitação fluida em formato brasileiro (vírgula como separador
 * decimal), sem travar o cursor do usuário. O estado textual é mantido localmente e
 * só é convertido para número ao perder o foco ou a cada tecla válida — a formatação
 * "bonita" completa só é reaplicada quando o campo não está em foco.
 */
export function MoneyInput({
  id,
  label,
  value,
  onValueChange,
  prefix = 'R$',
  suffix,
  className,
}: MoneyInputProps) {
  const [text, setText] = React.useState(() => formatForDisplay(value));
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) setText(formatForDisplay(value));
  }, [value, isFocused]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    // Permite apenas dígitos, vírgula e ponto durante a digitação.
    const sanitized = raw.replace(/[^\d,.-]/g, '');
    setText(sanitized);

    const numeric = parseBrazilianNumber(sanitized);
    if (!Number.isNaN(numeric)) onValueChange(numeric);
  }

  return (
    <label htmlFor={id} className={cn('block', className)}>
      <span className="mb-1 block text-sm font-medium text-ink/80">{label}</span>
      <span className="flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-capital">
        {prefix && <span className="text-sm text-ink/50">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setText(formatForDisplay(value));
          }}
          onChange={handleChange}
          className="w-full bg-transparent text-sm text-ink outline-none"
        />
        {suffix && <span className="text-sm text-ink/50">{suffix}</span>}
      </span>
    </label>
  );
}

function formatForDisplay(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function parseBrazilianNumber(text: string): number {
  if (!text) return 0;
  // Remove separador de milhar (ponto) e troca vírgula decimal por ponto.
  const normalized = text.replace(/\./g, '').replace(',', '.');
  return Number(normalized);
}
