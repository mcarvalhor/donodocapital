'use client';

import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CopyTextButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
}

/**
 * Copia um texto arbitrário (ex.: chave PIX) para a área de transferência.
 *
 * Mesma estratégia de fallback usada em `CopyLinkButton`: tenta a API moderna
 * `navigator.clipboard` (que exige contexto seguro — HTTPS ou `localhost`) e cai para
 * `document.execCommand('copy')` via um `<textarea>` temporário quando a API moderna
 * não está disponível (ex.: acesso via HTTP puro).
 */
export function CopyTextButton({
  text,
  label = 'Copiar',
  copiedLabel = 'Copiado!',
}: CopyTextButtonProps) {
  const [copied, setCopied] = React.useState(false);

  function showCopiedFeedback() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyWithFallback(value: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let succeeded = false;
    try {
      succeeded = document.execCommand('copy');
    } catch {
      succeeded = false;
    } finally {
      document.body.removeChild(textarea);
    }
    return succeeded;
  }

  async function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        showCopiedFeedback();
        return;
      } catch {
        // Cai para o fallback abaixo (ex.: permissão negada ou API indisponível).
      }
    }

    if (copyWithFallback(text)) {
      showCopiedFeedback();
    }
  }

  return (
    <Button variant="outline" size="md" onClick={handleCopy}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
