'use client';

import * as React from 'react';
import { Download, Share2 } from 'lucide-react';
import type { SimulationResult } from '@/core/types/simulation';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { ShareCard } from './ShareCard';

export interface ShareCardButtonProps {
  result: SimulationResult;
  comparison?: SimulationResult | null;
}

const SHARE_FILE_NAME = 'dono-do-capital.png';
const SHARE_TITLE = 'Dono do Capital';
const SHARE_TEXT = 'Veja minha simulação de capital vs. trabalho em donodocapital.com.br';

/**
 * Botão "Compartilhar": gera o `ShareCard` oculto como imagem (PNG), abre uma
 * pré-visualização e oferece duas formas de compartilhar:
 * - Compartilhamento nativo do sistema (Web Share API), disponível em iOS/Android
 *   (e alguns navegadores desktop compatíveis).
 * - Download direto da imagem, sempre disponível como alternativa.
 *
 * Nota sobre a Web Share API e por que o botão nativo pode não aparecer:
 * 1. **Exige contexto seguro (HTTPS)** — em iOS/Android, `navigator.share` nem
 *    existe fora de HTTPS (ou `localhost`). Testar via IP local em HTTP (ex.:
 *    `http://10.0.x.x:3000`) nunca vai mostrar o botão nativo — isso é esperado e
 *    funciona normalmente assim que publicado em produção com HTTPS.
 * 2. **Compartilhar arquivos é sensível a tempo no Safari/iOS** — `canShare({ files })`
 *    chamado depois de uma operação assíncrona (como gerar a imagem) pode retornar
 *    `false` mesmo quando o compartilhamento funcionaria. Por isso, a visibilidade do
 *    botão nativo aqui depende apenas da existência de `navigator.share` (checagem
 *    estável), e a tentativa de compartilhar o arquivo acontece só no clique (um
 *    gesto do usuário nativo e "fresco"), com fallback automático para
 *    compartilhar só o link caso o arquivo seja recusado.
 */
export function ShareCardButton({ result, comparison }: ShareCardButtonProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const previewUrlRef = React.useRef<string | null>(null);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const [canUseNativeShare, setCanUseNativeShare] = React.useState(false);

  React.useEffect(() => {
    setCanUseNativeShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  React.useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function handleGenerate() {
    if (!cardRef.current || isGenerating) return;
    setIsGenerating(true);

    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(cardRef.current, { pixelRatio: 2 });
      if (!blob) return;

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;

      setPreviewUrl(url);
      setPreviewBlob(blob);
      setIsOpen(true);
    } catch {
      // Falha ao gerar imagem (ex.: ambiente sem suporte a canvas) — ignorado silenciosamente.
    } finally {
      setIsGenerating(false);
    }
  }

  /**
   * Chamado diretamente no clique do botão nativo (gesto fresco do usuário).
   * Tenta compartilhar com o arquivo de imagem; se o navegador recusar arquivos
   * (ex.: `canShare` retorna falso nesse momento específico), cai para compartilhar
   * apenas o link da simulação — que praticamente todo navegador com `share()` aceita.
   */
  async function handleNativeShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : undefined;

    if (previewBlob) {
      const file = new File([previewBlob], SHARE_FILE_NAME, { type: 'image/png' });
      const canShareFile = 'canShare' in navigator ? navigator.canShare({ files: [file] }) : true;

      if (canShareFile) {
        try {
          await navigator.share({ files: [file], title: SHARE_TITLE, text: SHARE_TEXT });
          return;
        } catch {
          // Usuário cancelou, ou o navegador recusou o arquivo neste momento — tenta o fallback abaixo.
        }
      }
    }

    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: shareUrl });
    } catch {
      // Usuário cancelou o compartilhamento nativo — ignorado.
    }
  }

  function handleDownload() {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = SHARE_FILE_NAME;
    link.href = previewUrl;
    link.click();
  }

  return (
    <>
      <Button variant="capital" size="md" onClick={handleGenerate} disabled={isGenerating}>
        <Share2 size={16} />
        {isGenerating ? 'Gerando...' : 'Compartilhar'}
      </Button>

      <div className="pointer-events-none fixed -left-[9999px] -top-[9999px]" aria-hidden>
        <ShareCard ref={cardRef} result={result} comparison={comparison} />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          title="Pré-visualização"
          description="Confira como ficou antes de compartilhar ou baixar."
        >
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- imagem gerada em runtime (data/blob URL), não otimizável pelo next/image.
            <img
              src={previewUrl}
              alt="Pré-visualização do card de compartilhamento da simulação"
              className="max-h-[55vh] w-full rounded-xl border border-ink/10 object-contain"
            />
          )}

          <div className="mt-4 flex flex-col gap-2">
            {canUseNativeShare && (
              <Button variant="capital" size="md" onClick={handleNativeShare} className="w-full">
                <Share2 size={16} />
                Compartilhar
              </Button>
            )}
            <Button variant="outline" size="md" onClick={handleDownload} className="w-full">
              <Download size={16} />
              Baixar imagem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
