'use client';

import * as React from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Copia a URL atual (com o estado da simulação já sincronizado) para a área de
 * transferência.
 *
 * Nota: `navigator.clipboard` (API moderna) só existe em contexto seguro (HTTPS ou
 * `localhost`) — em HTTP puro (ex.: testando via IP local tipo `http://10.0.x.x:3000`),
 * ela é `undefined` e a cópia falharia silenciosamente. Por isso, há um fallback via
 * `document.execCommand('copy')` (API antiga, mas sem essa restrição de contexto
 * seguro), garantindo que o botão funcione mesmo nesses cenários de teste.
 */
export function CopyLinkButton() {
  const [copied, setCopied] = React.useState(false);

  function showCopiedFeedback() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyWithFallback(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = text;
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
    const url = window.location.href;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        showCopiedFeedback();
        return;
      } catch {
        // Cai para o fallback abaixo (ex.: permissão negada ou API indisponível).
      }
    }

    if (copyWithFallback(url)) {
      showCopiedFeedback();
    }
  }

  return (
    <Button variant="outline" size="md" onClick={handleCopy}>
      {copied ? <Check size={16} /> : <LinkIcon size={16} />}
      {copied ? 'Link copiado!' : 'Copiar link da simulação'}
    </Button>
  );
}
