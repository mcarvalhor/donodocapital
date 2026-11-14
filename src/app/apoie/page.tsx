import Link from 'next/link';
import QRCode from 'qrcode';
import { CopyTextButton } from '@/components/share/CopyTextButton';
import { buildPixPayload } from '@/utils/pixPayload';

export const metadata = {
  title: 'Apoie este projeto — Dono do Capital',
};

interface Institution {
  name: string;
  description: string;
  url: string;
}

/**
 * Instituições brasileiras reais, com atuação de longo prazo documentada, sugeridas como
 * destino de doação antes da chave PIX pessoal abaixo — com foco em causas LGBTQIA+, trans,
 * raciais, de mulheres e ambientais, conforme pedido explicitamente nesta página.
 */
const INSTITUTIONS: Institution[] = [
  {
    name: 'ANTRA — Associação Nacional de Travestis e Transexuais',
    description:
      'Maior rede de articulação política de pessoas trans e travestis do Brasil, com atuação em defesa de direitos e enfrentamento à violência.',
    url: 'https://antrabrasil.org',
  },
  {
    name: 'ABGLT — Associação Brasileira de Lésbicas, Gays, Bissexuais, Travestis, Transexuais e Intersexos',
    description:
      'A mais antiga e uma das maiores associações LGBTQIA+ do Brasil, com atuação em todo o país desde 1995.',
    url: 'https://www.abglt.org',
  },
  {
    name: 'Geledés — Instituto da Mulher Negra',
    description:
      'Referência nacional em combate ao racismo e defesa de direitos de mulheres negras, com décadas de atuação jurídica e social.',
    url: 'https://www.geledes.org.br',
  },
  {
    name: 'SOF — Sempreviva Organização Feminista',
    description:
      'Organização feminista com décadas de atuação em direitos das mulheres, economia feminista e agroecologia.',
    url: 'https://www.sof.org.br',
  },
  {
    name: 'Instituto Socioambiental (ISA)',
    description:
      'Defesa de bens e direitos sociais, coletivos e ambientais, com forte atuação junto a povos indígenas e territórios tradicionais.',
    url: 'https://www.socioambiental.org',
  },
  {
    name: 'Fundação SOS Mata Atlântica',
    description:
      'Uma das maiores ONGs ambientais do Brasil, dedicada à conservação e recuperação do bioma mais ameaçado do país.',
    url: 'https://www.sosma.org.br',
  },
];

/**
 * Página "Apoie este projeto" — gera o QR Code da chave PIX em tempo de build (Server
 * Component assíncrono), embutindo o SVG diretamente no HTML estático exportado. Nenhum
 * JavaScript de cliente é necessário para exibir o QR Code; apenas o botão de copiar a
 * chave (`CopyTextButton`) é um Client Component isolado.
 *
 * A variável `PIX_KEY` é lida diretamente de `process.env` (sem prefixo `NEXT_PUBLIC_`),
 * porque só é necessária aqui, em build-time — nunca é inlinada em JS enviado ao navegador.
 */
export default async function ApoiePage() {
  const pixKey = process.env.PIX_KEY?.trim() || null;
  const pixMerchantName = process.env.PIX_MERCHANT_NAME?.trim() || 'Matheus';
  const pixMerchantCity = process.env.PIX_MERCHANT_CITY?.trim() || 'Sao Paulo';

  // O QR Code de um pagamento Pix precisa do payload estruturado "Pix Copia e Cola" (padrão
  // BR Code/EMV) — não da chave em texto puro. Sem essa estrutura, o app do banco reconhece
  // o QR Code (chega a vibrar), mas não encontra nenhum dado de pagamento legível nele.
  const pixPayload = pixKey
    ? buildPixPayload({ key: pixKey, merchantName: pixMerchantName, merchantCity: pixMerchantCity })
    : null;
  const qrSvg = pixPayload
    ? await QRCode.toString(pixPayload, { type: 'svg', margin: 1, width: 220 })
    : null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/" className="text-sm font-medium text-ink/60 hover:text-ink">
        ← Voltar
      </Link>

      <h1 className="mt-4 font-serif text-3xl font-bold text-ink">Apoie este projeto</h1>

      <article className="prose prose-neutral mt-6 max-w-none text-ink/80">
        <p>
          Oi, meu nome é Matheus. Instrumentei agentes de inteligência artificial para criarem
          este site com o objetivo de demonstrar, com matemática transparente e de forma
          acessível, como o capital funciona para quem já é dono dele — e como funciona de uma
          maneira completamente diferente para quem depende do próprio trabalho para viver.
        </p>
        <p>
          Acredito que o mais importante de tudo é sabermos identificar que trabalhadores devem
          sempre se mobilizar para não permitir que o sistema de exploração — que transforma o
          tempo de vida de quem trabalha em lucro de quem já tem capital — siga se perpetuando sem
          ser nomeado, questionado e enfrentado coletivamente. Números e gráficos ajudam a
          enxergar o problema com clareza, mas nenhuma calculadora substitui organização real:
          historicamente, foram sindicatos fortes, movimentos sociais atuantes e pressão popular
          contínua — não boa vontade espontânea de quem já está no topo — que conquistaram cada
          direito trabalhista, cada avanço de tributação mais justa e cada redução, ainda que
          parcial, da distância entre quem vive de capital e quem vive de salário.
        </p>
        <p>
          Este site é uma ferramenta de conscientização, não um substituto para a ação coletiva. A
          esperança é que, ao ver os números da sua própria trajetória de vida com clareza
          matemática, fique mais fácil enxergar o padrão estrutural por trás dela — e mais difícil
          aceitar que as coisas são do jeito que são apenas &ldquo;porque sempre foram assim&rdquo;.
        </p>
        <p>
          O projeto é gratuito, de código aberto e sem fins lucrativos: não há paywall, anúncios
          ou coleta de dados pessoais em nenhuma página. Se ele te ajudou a enxergar algo que antes
          não estava tão claro, considere usar esse momento de reflexão para algo que vá além de um
          agradecimento a mim.
        </p>
      </article>

      <section className="mt-10 rounded-2xl border border-work/20 bg-work/5 p-6">
        <h2 className="font-serif text-xl font-bold text-ink">
          Antes de me pagar um sorvete, considere doar para quem precisa de verdade
        </h2>
        <p className="mt-2 text-sm text-ink/70">
          Existem instituições brasileiras sérias, com atuação de longo prazo e resultados
          documentados, defendendo exatamente os grupos que mais sentem na pele a desigualdade que
          este site tenta escancarar — pessoas negras, LGBTQIA+, pessoas trans, mulheres, e o meio
          ambiente do qual a vida de todo mundo depende. Uma doação para qualquer uma delas tem
          impacto real e imediato — muito provavelmente maior do que o meu sorvete:
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          {INSTITUTIONS.map((institution) => (
            <li key={institution.url}>
              <a
                href={institution.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-work underline underline-offset-2 hover:text-ink"
              >
                {institution.name}
              </a>
              <p className="text-ink/60">{institution.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-capital/30 bg-capital/5 p-6 text-center">
        <h2 className="font-serif text-xl font-bold text-ink">
          Mas se mesmo assim você gostou do site...
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">
          ...e gostaria de me pagar um sorvete, minha chave PIX é a chave aleatória abaixo.
        </p>

        {pixKey ? (
          <>
            <div
              className="mx-auto mt-5 w-fit rounded-xl bg-paper p-3 shadow-sm [&_svg]:h-[180px] [&_svg]:w-[180px]"
              dangerouslySetInnerHTML={{ __html: qrSvg ?? '' }}
            />
            <p className="mx-auto mt-4 w-fit break-all rounded-lg bg-ink/5 px-4 py-2 font-mono text-sm text-ink">
              {pixKey}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <CopyTextButton text={pixKey} label="Copiar chave PIX" copiedLabel="Chave copiada!" />
              {pixPayload && (
                <CopyTextButton
                  text={pixPayload}
                  label="Copiar código Pix Copia e Cola"
                  copiedLabel="Código copiado!"
                />
              )}
            </div>
            <p className="mx-auto mt-3 max-w-sm text-xs text-ink/50">
              Se o seu app de banco não aceitar o QR Code ao escanear, cole o código
              &ldquo;Pix Copia e Cola&rdquo; acima diretamente no campo equivalente do app.
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-ink/50">
            (A chave PIX não foi configurada neste build — defina a variável de ambiente{' '}
            <code>PIX_KEY</code> para exibi-la aqui.)
          </p>
        )}
      </section>
    </main>
  );
}
