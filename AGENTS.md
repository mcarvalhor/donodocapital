# AGENTS.md

Este documento define a arquitetura, as regras de negócio, o modelo matemático, os padrões de código e as diretrizes de UI/UX deste repositório. Qualquer agente de inteligência artificial que atue neste projeto **deve** ler e seguir rigorosamente estas especificações antes de propor ou gerar código. Este documento reflete o **estado atual** do projeto — não um plano inicial — e deve ser mantido atualizado a cada mudança relevante de arquitetura ou regra de negócio.

---

## 1. Visão Geral e Propósito do Produto

### 1.1. O Conceito
Este projeto é uma aplicação web interativa, educativa e *mobile-first* projetada para demonstrar, por meio de matemática financeira transparente e visualização de dados, como o capital e o trabalho operam de formas estruturalmente distintas na sociedade brasileira.

O objetivo central é tangibilizar o conceito econômico de que, quando a taxa de retorno sobre o capital ($r$) supera o crescimento da economia e dos salários ($g$), conforme formulado por Thomas Piketty ($r > g$), o dinheiro trabalha exponencialmente a favor de quem já detém patrimônio, enquanto quem depende exclusivamente da venda da própria força de trabalho enfrenta barreiras matemáticas de acumulação.

### 1.2. Pilares da Experiência
1. **Simulação Baseada em Trajetória de Vida:** o usuário simula a evolução patrimonial a partir dos $18$ anos de idade até uma idade alvo (padrão: $65$ anos), configurando patrimônio inicial, salário mensal, custo de vida mensal, reajuste salarial anual, inflação de custo de vida e rentabilidade real dos investimentos.
2. **Eventos Pontuais na Linha do Tempo (opcional):** o usuário pode inserir acontecimentos pontuais em qualquer idade da simulação — uma herança, uma promoção, um corte de gastos, uma mudança na rentabilidade esperada dos investimentos — que alteram salário, patrimônio, gastos ou qualquer uma das quatro taxas anuais configuráveis, de forma absoluta (R$) ou percentual. Ver seção 3.5.
3. **Cenários Pré-definidos (1-Clique):** seis arquétipos sociais brasileiros prontos na página inicial para impacto imediato — do *Trabalhador de Salário Mínimo* ao *Jovem Bilionário*. Ver seção 5.
4. **Modo Comparação (Lado a Lado):** sobreposição de duas trajetórias no mesmo gráfico (ex.: *Sua Simulação* vs. *O Herdeiro*), evidenciando o abismo entre renda do trabalho e renda passiva do capital.
5. **Educação e Consciência de Classe:** artigos editoriais baseados em dados públicos brasileiros (IBGE, PNAD, Receita Federal, DIEESE, Oxfam Brasil) que contextualizam os números exibidos nos gráficos — incluindo um artigo técnico que documenta, em detalhe, as fórmulas e o algoritmo do próprio motor de cálculo. Ver `src/content/articles.ts`.
6. **Viralização e Compartilhamento:** estado da simulação sincronizado na URL e geração de um card visual (com gráfico, estatísticas e frase de impacto dinâmica) para redes sociais, com integração ao compartilhamento nativo do sistema operacional quando disponível.

---

## 2. Stack Tecnológica e Arquitetura

* **Framework:** Next.js 14 (App Router) + React 18 + TypeScript (`strict: true`).
* **Renderização:** **site 100% estático** (`output: 'export'` em `next.config.mjs`). Nenhuma rota usa API Routes, Server Actions, middleware, `cookies()`/`headers()` ou otimização de imagem via servidor — toda a simulação roda inteiramente no navegador, sobre o motor puro em `src/core/math/`. O estado é sincronizado via `URLSearchParams`, dispensando qualquer backend/banco de dados.
* **Estilização:** Tailwind CSS + Radix UI (Slider, Tooltip, Dialog, Slot) + componentes próprios em `src/components/ui/`.
* **Visualização de Dados:** Recharts, com alternância entre escala linear e logarítmica no gráfico principal.
* **Gerenciamento de Estado & URL:** [`nuqs`](https://nuqs.47ng.com/) sincroniza todo o estado da simulação (incluindo eventos, via um parser customizado) com a query string, garantindo que qualquer link reproduza exatamente a mesma simulação sem necessidade de banco de dados.
* **Geração de Imagem para Compartilhamento:** `html-to-image` (captura o card de compartilhamento como PNG no navegador) + Web Share API nativa (`navigator.share`), com fallback para download direto.
* **Geração de QR Code:** `qrcode`, usado exclusivamente em build-time (dentro do Server Component assíncrono `src/app/apoie/page.tsx`) para gerar o SVG do QR Code da chave PIX, embutido diretamente no HTML estático exportado — zero JavaScript de cliente para essa funcionalidade. O payload codificado segue o padrão "Pix Copia e Cola" (BR Code/EMV), montado pela função pura `buildPixPayload` (`src/utils/pixPayload.ts`) — codificar apenas a chave em texto puro faz o QR Code ser tecnicamente lido pelo app do banco, mas sem nenhum dado de pagamento reconhecível.
* **Ícones/Favicon:** SVG vetorial (`src/app/icon.svg`), com `favicon.ico` e `apple-icon.png` gerados a partir do mesmo vetor, seguindo a convenção de arquivos de metadata do Next.js.
* **Testes Unitários:** Vitest — obrigatório para todo o motor de cálculo financeiro (`src/core/math/`) e para lógica de serialização/URL.
* **Formatação e Linting:** ESLint (`eslint-config-next`) + Prettier.
* **Gerenciador de pacotes:** npm.
* **Deploy:** build estático (`npm run build` → pasta `out/`) servido por **Nginx sobre Alpine Linux**, empacotado via o `Dockerfile` multi-stage deste repositório (ver seção 8.6). Também pode ser servido por qualquer outro servidor de arquivos estáticos (Apache, S3 + CDN, etc.) — não há *vendor lock-in* com nenhuma plataforma específica de hospedagem.

### 2.1. Estrutura de Diretórios (estado atual)

```text
src/
├── app/
│   ├── layout.tsx             # Layout raiz: fontes, metadata, Footer, TooltipProvider
│   ├── page.tsx                # Home: logotipo, hero, 6 cenários prontos
│   ├── globals.css
│   ├── icon.svg                # Favicon vetorial (convenção de arquivo do Next.js)
│   ├── favicon.ico              # Fallback legado (32x32), gerado a partir do icon.svg
│   ├── apple-icon.png           # Ícone de tela inicial iOS (180x180)
│   ├── simulador/page.tsx       # Simulador completo: form, eventos, gráficos, KPIs
│   ├── artigos/                 # Listagem + páginas de artigos (via generateStaticParams)
│   │   └── [slug]/page.tsx
│   └── apoie/page.tsx           # "Apoie este projeto": texto pessoal, lista de instituições
│                                 #   e chave PIX opcional (PIX_KEY) com QR Code gerado em
│                                 #   build-time (Server Component assíncrono)
├── components/
│   ├── Logo.tsx                 # Logotipo (marca + nome) e LogoMark (só o ícone)
│   ├── Footer.tsx                # Rodapé global, presente em todas as páginas
│   ├── ui/                      # Button, Card, MoneyInput, Slider, Tooltip, Dialog,
│   │                             #   CollapsibleSection (disclosure mobile-first)
│   ├── simulator/                # SimulatorForm, ScenarioSelector, EventsEditor,
│   │                             #   useSimulationQueryState (hook central de estado/URL),
│   │                             #   eventsQueryCodec (serialização compacta de eventos),
│   │                             #   presetToQueryString
│   ├── charts/                   # WealthEvolutionChart (+ toggle linear/log + tooltip
│   │                             #   rico), CompositionChart, ShareWealthChart (versão
│   │                             #   estática p/ o card de compartilhamento),
│   │                             #   wealthChartData (dados compartilhados entre os dois)
│   └── share/                    # ShareCard, ShareCardButton (preview + compartilhar
│                                 #   nativo + download), CopyLinkButton, CopyTextButton
│                                 #   (cópia genérica, usada para a chave PIX), shareCopy
│                                 #   (geração de texto/estatísticas do card)
├── core/
│   ├── math/                     # Motor financeiro puro — ZERO dependências de React/DOM
│   │   ├── engine.ts             # runSimulation(): loop mensal completo
│   │   ├── events.ts             # Aplicação de eventos pontuais ao estado da simulação
│   │   ├── rates.ts              # Conversão de taxas anuais ⇄ mensais
│   │   ├── taxes.ts              # INSS, IRPF (com Reforma de 2026), tributação do capital
│   │   └── *.test.ts             # Testes cobrindo todos os cenários e edge cases
│   └── types/
│       └── simulation.ts         # SimulationInput, SimulationEvent, MonthlySnapshot,
│                                 #   SimulationResult — contratos de dados
├── data/
│   ├── presets.ts                 # 6 arquétipos sociais brasileiros
│   └── economicConstants.ts       # Parâmetros macroeconômicos de referência (Brasil)
├── content/
│   └── articles.ts                 # Artigos educativos (Markdown), incluindo um artigo
│                                   #   técnico gerado dinamicamente a partir das
│                                   #   constantes reais do motor
└── utils/
    ├── formatters.ts               # Formatação BRL, percentuais, idades, compactação
    └── cn.ts                       # Helper clsx + tailwind-merge

docker/
├── nginx.conf                      # Config do Nginx servido dentro do container
└── inject-site-url.sh              # Entrypoint: injeta NEXT_PUBLIC_SITE_URL em runtime

Dockerfile                          # Build multi-stage: Next.js export → Nginx (Alpine)
```

---

## 3. Motor Matemático e Regras de Negócio

**REGRA CRÍTICA:** Toda a lógica matemática deve residir exclusivamente em `src/core/math/` na forma de **funções puras** (determinísticas, sem efeitos colaterais). Componentes React apenas consomem os resultados calculados. Veja o artigo técnico em `src/content/articles.ts` (slug `formulas-e-algoritmos-do-simulador`) para uma explicação didática completa, gerada dinamicamente a partir das constantes reais do motor.

### 3.1. Granularidade Temporal e Poder de Compra
* A simulação opera em **passos mensais** ($m = 0, 1, 2, \dots, N$), onde $N = \text{round}((\text{idadeFinal} - \text{idadeInicial}) \times 12)$.
* Por padrão, $\text{idadeInicial} = 18$ e $\text{idadeFinal} = 65$ ($N = 564$ meses).
* **Valores Reais (Descontados da Inflação):** por padrão, o simulador trabalha com **taxas reais** (já descontada a inflação oficial, IPCA), para que um patrimônio de $\text{R\$ } 1.000.000$ aos $60$ anos represente exatamente o poder de compra de $\text{R\$ } 1.000.000$ hoje.

### 3.2. Fórmulas de Conversão de Taxas (`src/core/math/rates.ts`)
Toda taxa anual efetiva $i_a$ é convertida em taxa mensal equivalente $i_m$ por juros compostos:

$$i_m = (1 + i_a)^{\frac{1}{12}} - 1$$

### 3.3. Dinâmica Mensal da Simulação (`src/core/math/engine.ts`)
Para cada mês $t \in [1, N]$, o motor calcula sequencialmente:

1. **Eventos agendados para o mês** (ver seção 3.5), aplicados **antes** de qualquer outro cálculo.
2. **Reajuste Anual de Salário e Custo de Vida:** a cada múltiplo de $12$ meses, aplicam-se os crescimentos reais anuais (correntes — já podem ter sido alterados por um evento):
   $$S_t = S_{t-1} \times (1 + g_{\text{salário}}) \qquad C_t = C_{t-1} \times (1 + g_{\text{custo}})$$
3. **Tributação Líquida da Renda do Trabalho** (ver seção 3.3.2).
4. **Rendimento do Capital no Mês**, calculado sobre o patrimônio do mês anterior:
   $$R_t = P_{t-1} \times r_m \quad \text{(se } P_{t-1} \ge 0\text{)} \qquad R_t = P_{t-1} \times d_m \quad \text{(se } P_{t-1} < 0\text{)}$$
5. **Fluxo de Caixa Mensal e Novo Patrimônio:**
   $$F_t = S_{\text{líq}, t} - C_t \qquad P_t = P_{t-1} + R_{\text{líq}, t} + F_t$$

#### 3.3.1. INSS (`calculateINSS`)
Contribuição progressiva "por dentro": cada faixa de salário é tributada apenas pela alíquota daquela faixa (não a alíquota marginal mais alta sobre o total), respeitando o teto de contribuição. Tabela e teto em `src/data/economicConstants.ts` (`INSS_BRACKETS`, `INSS_CEILING_CONTRIBUTION`).

#### 3.3.2. IRPF e a Reforma de 2026 (`calculateIRPF` / `calculateIRPFByTable`)
Sobre a base de cálculo (salário bruto menos INSS), aplica-se primeiro a **tabela progressiva cheia** (`calculateIRPFByTable`, usando `IRPF_BRACKETS`):

$$\text{IRPF}_\text{tabela} = \max(0,\ \text{base} \times \text{alíquota}_\text{faixa} - \text{dedução}_\text{faixa})$$

A partir disso, o simulador aplica a **Reforma do Imposto de Renda de 2026** (`calculateIRPF`):
* **Isenção total** até `IRPF_2026_EXEMPTION_LIMIT` (R$ 5.000/mês).
* **Faixa de transição** até `IRPF_2026_TRANSITION_LIMIT` (R$ 7.000/mês): o imposto da tabela cheia é reduzido proporcionalmente à posição da renda dentro da faixa, crescendo de 0% a 100% do valor da tabela, sem "degraus":
  $$\text{progresso} = \frac{\text{base} - 5.000}{7.000 - 5.000} \qquad \text{IRPF} = \text{IRPF}_\text{tabela} \times \text{progresso}$$
* **Acima do teto de transição:** equivale exatamente à tabela cheia.

Escopo explicitamente fora deste simulador: a reforma também cria um "imposto mínimo" sobre dividendos (historicamente isentos) para rendas anuais muito altas. Como este simulador já tributa capital a uma alíquota única (`CAPITAL_GAINS_TAX_RATE`, 15%) acima do teto de 10% dessa regra mínima, essa camada específica não altera o cálculo de capital.

#### 3.3.3. Tributação do Capital (`calculateNetCapitalIncome`)
Alíquota única simplificada sobre ganhos **positivos**:

$$\text{rendimento}_\text{líquido} = \text{rendimento}_\text{bruto} \times (1 - \text{CAPITAL\_GAINS\_TAX\_RATE})$$

Rendimentos **negativos** (juros de dívida quando o patrimônio está negativo) não recebem nenhum benefício fiscal — são mantidos integralmente, já que representam uma despesa, não um ganho tributável.

### 3.4. Indicadores-Chave de Saída (KPIs)
Calculados em `buildSummary()` (dentro de `engine.ts`) ao final da simulação:
* **Patrimônio Final** ($P_N$).
* **Renda Passiva Mensal Final** e **Salário Mensal Final (líquido)**.
* **Proporção Capital vs. Trabalho** (`capitalSharePercentage`): o patrimônio inicial, todos os rendimentos de capital acumulados **e** qualquer ajuste de patrimônio injetado por eventos (ex.: uma herança recebida no meio da simulação) contam como "capital" — nenhum desses exigiu esforço de trabalho durante a simulação. A identidade contábil universal, válida com ou sem eventos, é:
  $$\text{finalWealth} = \text{totalWorkContribution} + \text{totalCapitalContribution}$$
* **Ponto de Independência Financeira** (*Crossover Point*): a primeira idade (fracionária) em que a renda passiva líquida mensal $\ge$ o custo de vida mensal, ou `null` se isso nunca ocorre dentro da simulação.
* **Poder de Consumo Sustentável:** $P_N \times r_m$ (taxa mensal real **vigente ao final** da simulação, já refletindo qualquer evento que tenha alterado a rentabilidade pelo caminho) — gastar exatamente esse valor mantém o patrimônio principal intacto para sempre.

### 3.5. Eventos na Linha do Tempo (`src/core/math/events.ts`)
Eventos são opcionais (`SimulationInput.events?: SimulationEvent[]`) e representam acontecimentos pontuais numa idade específica da simulação.

**Campos-alvo** (`SimulationEventTarget`): `wealth`, `salary`, `expenses` (monetários, em R$) e `annualSalaryGrowth`, `annualExpenseGrowth`, `annualRealReturn`, `annualDebtRate` (taxas anuais, em decimal).

**Operações** (`SimulationEventOperation`):
* `set`: define o campo para `value` diretamente.
* `add`: soma `value` (em R$) ao valor atual — **só disponível para campos monetários** na UI (`EventsEditor.tsx`); não faz sentido somar reais a uma taxa percentual.
* `addPercent`: multiplica o valor atual por $(1 + \text{value})$ — funciona tanto para campos monetários quanto para taxas (nesse caso, é uma variação relativa da própria taxa).

**Regras de aplicação:**
* Eventos são aplicados no **início** do mês agendado (`monthIndex`), incluindo o mês 0 (afetando o próprio estado inicial), **antes** de qualquer outro cálculo daquele mês. Isso significa que uma herança já rende capital no mesmo mês em que ocorre, e uma mudança de salário já afeta o salário líquido daquele mesmo mês.
* Eventos no mesmo mês são aplicados em sequência, na ordem em que aparecem em `input.events`.
* Eventos com `monthIndex` fora do intervalo $[0, N]$ são silenciosamente ignorados (nunca são acionados), sem lançar erro.
* Apenas `salary` e `expenses` são travados em zero ou mais. `wealth` pode ficar negativo (dívida) e as quatro taxas podem legitimamente ser negativas (ex.: retorno real negativo numa crise) — nenhuma delas é travada em zero.
* Quando um evento altera `annualRealReturn` ou `annualDebtRate`, as taxas mensais derivadas são recalculadas imediatamente pelo motor.

---

## 4. Contratos de Dados (TypeScript)

Fonte da verdade: `src/core/types/simulation.ts`. Resumo:

```typescript
export interface SimulationInput {
  id: string;
  label: string;
  initialAge: number;            // Padrão: 18
  targetAge: number;             // Padrão: 65
  initialWealth: number;
  monthlySalary: number;
  monthlyExpenses: number;
  annualSalaryGrowth: number;
  annualExpenseGrowth: number;
  annualRealReturn: number;
  annualDebtRate: number;
  applyBrazilianTaxModel: boolean;
  events?: SimulationEvent[];     // Opcional — ver seção 3.5
}

export type SimulationEventTarget =
  | 'wealth' | 'salary' | 'expenses'
  | 'annualSalaryGrowth' | 'annualExpenseGrowth'
  | 'annualRealReturn' | 'annualDebtRate';

export type SimulationEventOperation = 'set' | 'add' | 'addPercent';

export interface SimulationEvent {
  id: string;
  monthIndex: number;
  target: SimulationEventTarget;
  operation: SimulationEventOperation;
  value: number;
}

export interface MonthlySnapshot {
  monthIndex: number;
  age: number;
  year: number;
  wealth: number;
  netSalary: number;
  expenses: number;
  passiveIncome: number;
  monthlyCashFlow: number;
  cumulativeWorkSavings: number;
  cumulativeCapitalGains: number;
}

export interface SimulationResult {
  input: SimulationInput;
  timeline: MonthlySnapshot[];
  summary: {
    finalWealth: number;
    finalMonthlyPassiveIncome: number;
    finalMonthlyNetSalary: number;
    finalMonthlyExpenses: number;
    sustainableMonthlySpending: number;
    totalWorkContribution: number;
    totalCapitalContribution: number;
    capitalSharePercentage: number;
    financialIndependenceAge: number | null;
  };
}
```

---

## 5. Cenários Pré-definidos (Presets)

`src/data/presets.ts` define **seis** arquétipos (valores em R$ de poder de compra atual, atualizáveis via `src/data/economicConstants.ts`):

1. **`salario-minimo`** — Trabalhador de Salário Mínimo. Patrimônio inicial R$ 0; salário = salário mínimo vigente; margem de poupança mínima. *Objetivo didático:* mostrar que, mesmo poupando o máximo possível por quase 47 anos, a renda passiva fica com uma margem apertadíssima em relação ao custo de vida — bem diferente da folga de quem herda capital.
2. **`classe-media-baixa`** — Classe Média Baixa.
3. **`classe-media`** — Classe Média (preset padrão ao visitar `/simulador` sem parâmetros).
4. **`classe-media-alta`** — Classe Média Alta. *Objetivo didático (2-4):* mesmo com salários bem acima da média, o patrimônio depende majoritariamente do próprio trabalho durante quase toda a vida adulta.
5. **`herdeiro-5m`** — O Herdeiro de 5 Milhões (nunca trabalhou). Patrimônio inicial R$ 5.000.000 aos 18 anos; salário R$ 0. *Objetivo didático:* a renda passiva supera o custo de vida desde o primeiro mês de rendimento — independência financeira quase instantânea.
6. **`bilionario`** — O Jovem Bilionário (nunca trabalhou). Patrimônio inicial R$ 1 bilhão; salário R$ 0. *Objetivo didático:* evidenciar a escala incompreensível da extrema riqueza — o patrimônio cresce em milhões todo mês, mesmo gastando um apartamento por mês.

---

## 6. Diretrizes de UI/UX e Visualização de Dados

### 6.1. Design e Identidade Visual
* **Estética:** editorial moderno, limpo, sério e impactante (inspirado em jornalismo de dados). Paleta: `ink` (#0f1115, fundo escuro), `paper` (#fafaf8, fundo claro), `capital` (#b8862f, dourado — acento para tudo relacionado a capital/rentismo), `work` (#1f4b99, azul — acento para tudo relacionado a trabalho/salário).
* **Logotipo:** `src/components/Logo.tsx` — um anel (moeda/capital) atravessado por barras ascendentes (crescimento), lendo-se também como um "d" estilizado. Mesma geometria do favicon (`src/app/icon.svg`), mantidas em sincronia manual (um é JSX, o outro é arquivo estático).
* **Mobile-First:** a maior parte do tráfego viral vem de smartphones. No simulador, a seção de configuração (cenários + formulário + eventos) fica dentro de um `CollapsibleSection` que começa **fechado** em telas pequenas (menos rolagem até os resultados) e **aberto** em telas grandes — ver seção 6.4.
* **Formatação Monetária:** sempre via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Para eixos de gráfico e KPIs, usar a versão compacta (`formatCompactBRL`): `R$ 1,5 mi`, `R$ 1,2 bi`.

### 6.2. Regras Críticas para Gráficos
1. **Escala Linear vs. Logarítmica:** botão de alternância sempre visível acima do gráfico principal (`ScaleToggle`), essencial ao comparar cenários com ordens de magnitude muito distintas.
2. **Gráfico de Composição** (`CompositionChart`): área empilhada mostrando quanto do patrimônio veio do suor (trabalho poupado) vs. quanto veio do dinheiro trabalhando sozinho (capital).
3. **Tooltips Ricos:** ao passar o dedo/mouse sobre qualquer idade no gráfico principal, exibir Idade, Patrimônio, Renda do trabalho/mês, Renda passiva/mês **e Custo de vida/mês**.

### 6.3. Viralização e Compartilhamento
* **Persistência na URL:** todo o estado da simulação — incluindo a lista de eventos, codificada de forma compacta (parâmetro `ev`, ver `eventsQueryCodec.ts`) — é sincronizado via `nuqs`. Ver nota sobre `?` vs. `#` abaixo.
* **Card de Compartilhamento** (`ShareCard` + `ShareCardButton`): card 4:5 de alto contraste, capturado como PNG via `html-to-image`, contendo:
  * Logotipo + frase de impacto dinâmica (`buildShareHeadline`), que varia conforme patrimônio inicial, salário, e se a independência financeira é atingida ("...e nunca será dono do capital." / "...sendo dono do capital.").
  * O gráfico de evolução patrimonial (versão estática, `ShareWealthChart`).
  * Estatísticas lado a lado (idade inicial vs. final): patrimônio, salário, renda passiva, gastos (`buildShareStats`).
  * Se houver comparação ativa e ela terminar em situação melhor, uma frase de ênfase adicional com o múltiplo de diferença (`buildComparisonEmphasis`).
* **Compartilhamento nativo:** o botão "Compartilhar" tenta `navigator.share` com o arquivo de imagem (com fallback para compartilhar só o link se o navegador recusar o arquivo). A visibilidade do botão depende apenas de `'share' in navigator` — **nunca** de `navigator.canShare` isoladamente, que é sensível a tempo em Safari/iOS quando chamado após uma operação assíncrona.
* **Nota sobre `?` vs. `#` na URL:** a query string (`?`) é enviada ao servidor como parte da requisição HTTP e sujeita a limites práticos (ex.: Nginx costuma limitar cabeçalhos a ~8 KB). O fragmento (`#`) nunca é enviado ao servidor, sem esse limite. A codificação de eventos já é compacta o bastante (~15-20 caracteres por evento) para suportar centenas de eventos na query string normalmente. Se algum dia isso não bastar, a migração correta é mover **apenas o parâmetro `ev`** para o fragmento — não o resto do estado.
* **Clipboard com fallback:** `CopyLinkButton` tenta `navigator.clipboard` (exige contexto seguro/HTTPS) e cai para `document.execCommand('copy')` via um `<textarea>` temporário quando a API moderna não está disponível (ex.: testes locais em HTTP puro).

### 6.4. Responsividade do Simulador
* Em telas pequenas, a seção "Cenários e configurações" (`CollapsibleSection`) aparece **primeiro** no DOM, mas **fechada por padrão** — um cabeçalho compacto e clicável dá a pista visual de que a simulação é editável, sem forçar rolagem por um formulário inteiro antes dos resultados. A detecção de breakpoint usa `matchMedia` em `useEffect` (não há `window` durante a exportação estática).
* Em telas grandes (`lg:`, 1024px+), a seção aparece sempre aberta, como sidebar à esquerda, lado a lado com os resultados — sem nenhuma mudança visual em relação a uma versão não-retrátil.

---

## 7. Diretrizes Editoriais e de Conteúdo

`src/content/articles.ts` contém **onze** artigos (em Markdown, renderizados via `react-markdown` + `remark-gfm`). Tom de voz: didático, empático com o trabalhador, rigoroso nos dados, livre de jargões acadêmicos inacessíveis e sem panfletagem. Tópicos cobertos: o mito do cafezinho; $r > g$ na prática; assimetria tributária brasileira; o conceito de tempo livre; "o inimigo nunca é quem trabalha pelo dinheiro"; disparidade econômica brasileira em números; a importância de taxar os super-ricos corretamente; ser rico x ser privilegiado; herança/meritocracia/mito do começo igual; patrimônio líquido x salário; e um artigo técnico (`formulas-e-algoritmos-do-simulador`) que documenta as fórmulas e o algoritmo do motor, **gerado dinamicamente a partir das constantes reais do código** (nunca fica dessincronizado se as faixas de IRPF/INSS mudarem).

---

## 8. Padrões de Engenharia e Protocolo de Execução para Agentes

Ao trabalhar neste repositório, siga este protocolo:

1. **Planejamento Antes do Código:** antes de criar novos componentes ou alterar cálculos, verifique `src/core/types/simulation.ts` e `src/core/math/engine.ts` para garantir compatibilidade com os contratos existentes.
2. **Zero Lógica Financeira na UI:** nunca escreva fórmulas de juros, taxas ou impostos dentro de arquivos `.tsx`. Crie ou atualize funções puras em `src/core/math/`. Geração de texto/URL (ex.: `shareCopy.ts`, `eventsQueryCodec.ts`) não conta como "lógica financeira" — são apenas templating/encoding sobre números já calculados pelo motor.
3. **Validação de Edge Cases:** todo código no motor matemático deve lidar graciosamente com: taxa de juros igual a $0\%$; patrimônio inicial negativo ou saldo que se torna negativo; salário igual a R$ 0; idade final igual ou menor que a inicial; valores na casa dos bilhões/trilhões sem estourar layout de UI; eventos com `monthIndex` fora do intervalo simulado; eventos que alteram taxas (recalculando as taxas mensais derivadas).
4. **Testes Obrigatórios:** sempre que modificar qualquer arquivo em `src/core/math/`, execute `npm run test` e adicione casos de teste cobrindo a alteração. Na dúvida sobre comportamento esperado de um edge case, escreva o teste primeiro.
5. **Acessibilidade e Performance:**
   * Use `useMemo` para o cálculo da simulação (`runSimulation`) e evite recomputações desnecessárias em re-renders.
   * Inputs numéricos aceitam digitação fluida em formato brasileiro (vírgula como separador decimal).
   * Qualquer acesso a `window`/`navigator`/`document` deve ser guardado para `'use client'` + `useEffect` (nunca durante a renderização do módulo), já que o site é exportado estaticamente.
6. **Compatibilidade com Export Estático:** nenhuma funcionalidade nova pode depender de API Routes, Server Actions, middleware, ISR com `revalidate` não-estático, ou qualquer recurso que exija um servidor Node.js em produção. Se algo parecer exigir isso, repense a solução para rodar inteiramente no cliente ou em build-time.
7. **Checklist de Finalização:** antes de concluir qualquer tarefa, verifique:
   * `npx tsc --noEmit` sem erros.
   * `npm run lint` sem erros ou *warnings* críticos.
   * `npm run test` com $100\%$ de sucesso.
   * `npm run build` compila sem erros e gera `out/` com todas as páginas esperadas.
8. **Docker/Deploy:** o `Dockerfile` na raiz constrói o site estático e o empacota com Nginx (Alpine). Se adicionar qualquer variável de ambiente nova com prefixo `NEXT_PUBLIC_*`, lembre-se que ela é inlinada em **tempo de build** — para torná-la configurável em tempo de execução no container, siga o padrão de placeholder + substituição já usado para `NEXT_PUBLIC_SITE_URL` (ver `docker/inject-site-url.sh`).
