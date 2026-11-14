# 💰 Dono do Capital

> Uma simulação interativa e baseada em dados sobre como capital e trabalho se comportam de formas matematicamente diferentes no Brasil.

**Dono do Capital** é uma aplicação web educativa e *mobile-first* que tangibiliza, através de matemática financeira transparente, a tese de Thomas Piketty — quando o retorno sobre o capital ($r$) supera o crescimento da economia e dos salários ($g$), ou seja, $r > g$, o dinheiro de quem já tem patrimônio cresce exponencialmente, enquanto quem depende exclusivamente do próprio trabalho enfrenta barreiras matemáticas de acumulação.

Simule sua própria trajetória de vida financeira, dos 18 aos 65 anos, insira eventos pontuais (uma herança, uma promoção, uma crise), compare com arquétipos sociais brasileiros reais (do trabalhador de salário mínimo ao jovem bilionário) e compartilhe o resultado.

---

## 📐 Fundamentação

Toda a lógica de negócio, as regras matemáticas, os contratos de dados e as diretrizes de produto/UX deste repositório estão documentados em detalhe no [`AGENTS.md`](AGENTS.md). Esse documento é a fonte da verdade do projeto e deve ser consultado antes de qualquer contribuição relevante — seja ela humana ou feita por um agente de IA.

## ✨ Funcionalidades

- **Simulação de trajetória de vida** — patrimônio inicial, salário, custo de vida, reajustes anuais e rentabilidade real dos investimentos.
- **Eventos na linha do tempo (opcional)** — insira acontecimentos pontuais em qualquer idade (herança, promoção, corte de gastos, mudança na rentabilidade esperada), definindo ou ajustando salário/patrimônio/gastos/taxas em R$ ou em %. Totalmente sincronizado na URL.
- **Cenários prontos (1 clique)** — seis arquétipos: *Salário Mínimo*, *Classe Média Baixa*, *Classe Média*, *Classe Média Alta*, *Herdeiro de R$ 5 milhões* e *Jovem Bilionário*.
- **Modo comparação** — sobreposição lado a lado de duas trajetórias no mesmo gráfico, com escala linear ou logarítmica.
- **Conteúdo educativo** — onze artigos curtos baseados em dados públicos (IBGE, PNAD, Receita Federal, DIEESE, Oxfam Brasil), incluindo um artigo técnico que documenta as fórmulas do próprio motor.
- **Compartilhamento viral** — estado sincronizado na URL, card visual gerado como imagem (com gráfico, estatísticas e frase de impacto dinâmica) e integração com o compartilhamento nativo do sistema operacional.
- **Mobile-first de verdade** — layout com seção de configuração retrátil em telas pequenas, para chegar aos resultados com o mínimo de rolagem.
- **Página "Apoie este projeto" (`/apoie`)** — sugere doação a instituições brasileiras reais antes de qualquer pedido pessoal, e exibe uma chave PIX opcional (configurável via `PIX_KEY`) com QR Code gerado em tempo de build.

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript (`strict`) |
| Renderização | **Site 100% estático** (`output: 'export'`) — sem API Routes, Server Actions ou servidor Node.js em produção |
| Estilização | [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (Slider, Tooltip, Dialog, Slot) |
| Gráficos | [Recharts](https://recharts.org/) (com alternância entre escala linear e logarítmica) |
| Estado & URL | [`nuqs`](https://nuqs.47ng.com/) (sincronização de estado, incluindo eventos, com `URLSearchParams`) |
| Compartilhamento | `html-to-image` (captura de card em PNG) + Web Share API nativa |
| Testes | [Vitest](https://vitest.dev/) (obrigatório para o motor de cálculo financeiro) |
| Qualidade | ESLint + Prettier |
| Deploy | Build estático servido por **Nginx sobre Alpine Linux**, empacotado via `Dockerfile` — veja a seção [🐳 Deploy com Docker](#-deploy-com-docker) |
| Gerenciador de pacotes | npm |

## 📁 Estrutura de Diretórios

```text
src/
├── app/                       # Rotas e páginas (Next.js App Router)
│   ├── page.tsx               # Home: logotipo, hero, 6 cenários prontos
│   ├── icon.svg / favicon.ico / apple-icon.png   # Favicon (convenção de metadata do Next.js)
│   ├── simulador/page.tsx     # Simulador completo: form, eventos, gráficos, KPIs
│   └── artigos/                # Listagem + páginas de artigos educativos
├── components/
│   ├── Logo.tsx                # Logotipo (marca + nome) e LogoMark (só o ícone)
│   ├── Footer.tsx               # Rodapé global
│   ├── ui/                     # Button, Card, MoneyInput, Slider, Tooltip, Dialog,
│   │                           #   CollapsibleSection (disclosure mobile-first)
│   ├── simulator/               # SimulatorForm, ScenarioSelector, EventsEditor,
│   │                           #   useSimulationQueryState (estado/URL), eventsQueryCodec
│   ├── charts/                  # Gráficos de evolução patrimonial e composição
│   └── share/                   # Card de compartilhamento + botões de ação
├── core/
│   ├── math/                    # Motor financeiro puro (ZERO dependências de React/DOM)
│   └── types/                   # Contratos e interfaces TypeScript
├── data/                        # Presets e constantes macroeconômicas (Brasil)
├── content/                     # Artigos educativos em Markdown
└── utils/                       # Formatadores (BRL, percentuais, compactação)

docker/
├── nginx.conf                   # Configuração do Nginx dentro do container
└── inject-site-url.sh           # Entrypoint: injeta NEXT_PUBLIC_SITE_URL em runtime

Dockerfile                       # Build multi-stage: Next.js export → Nginx (Alpine)
```

Consulte a [seção 2 do AGENTS.md](AGENTS.md#2-stack-tecnológica-e-arquitetura) para o detalhamento completo.

## 🚀 Como Rodar Localmente

Pré-requisitos: [Node.js](https://nodejs.org/) 20 LTS ou superior e npm.

```bash
# 1. Clone o repositório
git clone https://github.com/mcarvalhor/donodocapital.git
cd donodocapital

# 2. Instale as dependências
npm install

# 3. Rode o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o site estático em `out/` (ver seção abaixo) |
| `npm run start` | Serve a pasta `out/` localmente (via [`serve`](https://www.npmjs.com/package/serve)), para conferir o build de produção antes do deploy |
| `npm run lint` | Executa o ESLint |
| `npm run test` | Executa a suíte de testes (Vitest) |
| `npm run test:watch` | Executa os testes em modo *watch* |

## 🌐 Site 100% Estático

**Não há conteúdo dinâmico no servidor.** Este projeto não usa API Routes, Server Actions, middleware, `cookies()`/`headers()` ou otimização de imagens via servidor — a simulação inteira roda no navegador, em cima do motor financeiro puro (`src/core/math/`), e o estado (incluindo eventos) é sincronizado via `URLSearchParams`. Por isso o `next.config.mjs` está configurado com `output: 'export'` e `trailingSlash: true`, fazendo o `next build` gerar um site **100% estático** (HTML/CSS/JS) na pasta `out/`.

## 🐳 Deploy com Docker

A forma recomendada de hospedar este projeto é via o `Dockerfile` multi-stage incluído no repositório: a primeira etapa builda o site estático com Node.js, e a segunda etapa serve apenas os arquivos gerados através de **Nginx sobre Alpine Linux** — a imagem final não contém Node.js nem o código-fonte, apenas HTML/CSS/JS estáticos.

```bash
# Build da imagem (usa https://donodocapital.com.br como URL pública padrão)
docker build -t donodocapital .

# Build apontando para outro domínio
docker build -t donodocapital --build-arg NEXT_PUBLIC_SITE_URL=https://meudominio.com .

# Rodar o container (porta 80 HTTP dentro do container, sem TLS — ver nota abaixo)
docker run -d -p 8080:80 --name donodocapital donodocapital

# Rodar sobrescrevendo a URL pública em tempo de execução (sem rebuildar a imagem)
docker run -d -p 8080:80 -e NEXT_PUBLIC_SITE_URL=https://meudominio.com donodocapital
```

Acesse [http://localhost:8080](http://localhost:8080).

**Como `NEXT_PUBLIC_SITE_URL` funciona em runtime:** variáveis `NEXT_PUBLIC_*` são normalmente inlinadas pelo Next.js em **tempo de build**, não de execução. Para ainda assim permitir configurar a URL pública via `docker run -e ...` sem precisar reconstruir a imagem, o build usa um valor-placeholder, e o script [`docker/inject-site-url.sh`](docker/inject-site-url.sh) — executado automaticamente pelo entrypoint oficial da imagem `nginx` a cada inicialização do container — substitui esse placeholder pelo valor real da variável de ambiente nos arquivos estáticos já gerados.

**Sobre a porta 80 sem SSL:** o container serve HTTP puro de propósito. Termine TLS/HTTPS num proxy reverso na frente dele (outro Nginx, Caddy, Traefik, ou o load balancer da sua própria infraestrutura) e encaminhe para este container internamente via HTTP.

**Sobre `PIX_KEY`:** diferentemente de `NEXT_PUBLIC_SITE_URL`, a chave PIX exibida em `/apoie` (com seu QR Code) é embutida no HTML estático em **tempo de build** (ela é lida em um Server Component, nunca inlinada em JavaScript do cliente) e não tem substituição em tempo de execução. Para defini-la ou trocá-la, passe `--build-arg PIX_KEY=sua-chave-aleatoria` ao `docker build` e reconstrua a imagem. Se omitida, a seção de PIX é simplesmente ocultada, sem quebrar o build. O QR Code gerado segue o padrão "Pix Copia e Cola" (BR Code/EMV) — o mesmo payload estruturado usado por qualquer cobrança Pix real, e não apenas a chave em texto puro, que a maioria dos apps de banco não reconhece como pagamento. `PIX_MERCHANT_NAME`/`PIX_MERCHANT_CITY` (também via `--build-arg`) controlam o nome/cidade exibidos no app de quem paga; se omitidos, usam "Matheus"/"Sao Paulo" como padrão.

### Alternativa: Nginx sem Docker

Se preferir não usar Docker, basta copiar o conteúdo de `out/` para qualquer servidor de arquivos estáticos:

```bash
npm run build
rsync -avz --delete out/ usuario@servidor:/var/www/donodocapital/
```

Usando como referência o [`docker/nginx.conf`](docker/nginx.conf) deste repositório para a configuração do Nginx (ajustando `root` para o caminho onde os arquivos foram copiados).

## 🔗 Eventos na Linha do Tempo e Persistência na URL

Além dos parâmetros básicos da simulação, é possível adicionar **eventos opcionais**: acontecimentos pontuais em qualquer idade (uma herança, uma promoção, um corte de gastos, uma mudança de rentabilidade), que definem ou ajustam salário, patrimônio, gastos ou qualquer uma das quatro taxas anuais — em R$ (absoluto, exceto para taxas) ou em % (percentual). Essa lista de eventos é sincronizada na URL, no parâmetro `ev`, usando uma codificação compacta:

```
?ev=12:s:d:6000,24:w:a:50000,36:r:d:0.03
```

Cada evento segue o formato `mês:alvo:ação:valor` (códigos de 1 caractere), separados por vírgula — mantendo a URL enxuta mesmo com dezenas de eventos (cada um custa tipicamente 15-20 caracteres).

**`?` (query string) vs. `#` (fragmento): qual usar se a URL ficar muito longa?**

- A **query string** (`?...`) é enviada ao servidor como parte da requisição HTTP, sujeita a limites práticos de proxies/servidores (ex.: Nginx limita cabeçalhos a ~8 KB por padrão).
- O **fragmento** (`#...`) **nunca é enviado ao servidor** — existe só no navegador — então não tem esse limite, apenas o limite (bem maior) do próprio navegador.
- Como este site é 100% estático e a codificação dos eventos já é compacta, a query string atual suporta confortavelmente centenas de eventos.
- Se um dia isso não for mais suficiente, a migração correta é mover **apenas o parâmetro `ev`** para o fragmento — não o resto do estado, que tem tamanho fixo.

Essa lógica vive isolada em [`src/components/simulator/eventsQueryCodec.ts`](src/components/simulator/eventsQueryCodec.ts), com testes dedicados.

## 🧮 O Motor Matemático

Toda regra de cálculo financeiro — conversão de taxas, tributação (INSS/IRPF com a Reforma de 2026, tributação do capital), eventos na linha do tempo, evolução mensal do patrimônio e KPIs de saída — vive exclusivamente em funções puras dentro de `src/core/math/`, sem qualquer dependência de React ou DOM. Componentes de UI apenas consomem os resultados já calculados.

Isso garante que o motor seja:
- **Testável** de forma isolada e determinística (veja os arquivos `*.test.ts`).
- **Reutilizável** em qualquer camada (UI, geração de imagem, scripts).
- **Auditável**, já que a matemática por trás dos argumentos do produto precisa ser transparente e verificável.

Veja a [seção 3 do AGENTS.md](AGENTS.md#3-motor-matemático-e-regras-de-negócio) para as fórmulas completas, ou o artigo técnico ["As fórmulas e o algoritmo por trás do simulador"](src/content/articles.ts) dentro do próprio site, gerado dinamicamente a partir das constantes reais do código.

## 🤝 Contribuindo

Contribuições são bem-vindas — **inclusive com o auxílio de ferramentas de Inteligência Artificial**, que foram amplamente utilizadas na construção deste projeto. Leia o [`CONTRIBUTING.md`](CONTRIBUTING.md) para entender o fluxo de branches, convenção de commits, padrões de código e checklist antes de abrir um Pull Request.

## 🧭 Diretrizes para Agentes de IA

Se você é um agente de IA (ou está configurando um) trabalhando neste repositório, leia o [`AGENTS.md`](AGENTS.md) **por completo** antes de gerar ou alterar qualquer código. Ele define contratos de dados, regras de negócio, presets oficiais e protocolo de execução obrigatório.

## 📄 Licença

Este projeto está licenciado sob a [GNU General Public License v3.0](LICENSE).
