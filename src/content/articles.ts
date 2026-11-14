/**
 * Textos educativos sobre desigualdade e matemática econômica.
 * Conteúdo em Markdown, renderizado via `react-markdown` nas páginas de `/artigos`.
 * Tom de voz e tópicos essenciais definidos na seção 7 do AGENTS.md.
 */
import {
  CAPITAL_GAINS_TAX_RATE,
  DEFAULT_ANNUAL_DEBT_RATE,
  DEFAULT_INITIAL_AGE,
  DEFAULT_TARGET_AGE,
  INSS_BRACKETS,
  INSS_CEILING_CONTRIBUTION,
  IRPF_2026_EXEMPTION_LIMIT,
  IRPF_2026_TRANSITION_LIMIT,
  IRPF_BRACKETS,
  SAFE_WITHDRAWAL_RATE,
  SALARIO_MINIMO,
} from '@/data/economicConstants';
import { formatBRL, formatPercentage } from '@/utils/formatters';

export interface Article {
  slug: string;
  title: string;
  summary: string;
  body: string;
}

/**
 * Monta, a partir das constantes reais usadas pelo motor (`src/data/economicConstants.ts`),
 * o artigo técnico que documenta as fórmulas e o algoritmo do simulador. Construir o
 * texto dinamicamente (em vez de números digitados à mão) garante que o artigo nunca
 * fique dessincronizado do código caso essas constantes sejam atualizadas no futuro.
 */
function buildFormulasAndAlgorithmsArticle(): Article {
  const inssRows = INSS_BRACKETS.map((bracket, index) => {
    const previous = INSS_BRACKETS[index - 1];
    const lower = previous ? formatBRL(previous.upTo) : 'R$ 0,00';
    const upper = Number.isFinite(bracket.upTo) ? formatBRL(bracket.upTo) : '∞';
    return `- De ${lower} até ${upper}: **${formatPercentage(bracket.rate)}**`;
  }).join('\n');

  const irpfRows = IRPF_BRACKETS.map((bracket, index) => {
    const previous = IRPF_BRACKETS[index - 1];
    const lower = previous ? formatBRL(previous.upTo) : 'R$ 0,00';
    const upper = Number.isFinite(bracket.upTo) ? formatBRL(bracket.upTo) : '∞';
    return `- De ${lower} até ${upper}: alíquota **${formatPercentage(bracket.rate)}**, dedução de ${formatBRL(bracket.deduction)}`;
  }).join('\n');

  const body = `
Este artigo documenta, em detalhe, exatamente como o motor de cálculo deste simulador funciona — as mesmas fórmulas e o mesmo algoritmo que rodam no seu navegador em \`src/core/math/\`. Nenhuma lógica financeira deste site vive na interface: tudo abaixo é código puro, testável e auditável.

## 1. Granularidade: passos mensais

A simulação avança em passos mensais, do \`initialAge\` (padrão: ${DEFAULT_INITIAL_AGE} anos) até o \`targetAge\` (padrão: ${DEFAULT_TARGET_AGE} anos). O número total de meses simulados é:

\`\`\`
N = round((targetAge - initialAge) × 12)
\`\`\`

Todas as taxas de entrada (reajuste salarial, inflação de gastos, rentabilidade, juros de dívida) são **anuais e reais** — já descontadas da inflação oficial (IPCA) — para que R$ 1.000.000 daqui a 40 anos represente exatamente R$ 1.000.000 de poder de compra de hoje.

## 2. Conversão de taxa anual em taxa mensal

Toda taxa anual efetiva \`i_a\` é convertida em taxa mensal equivalente \`i_m\` por juros compostos:

\`\`\`
i_m = (1 + i_a) ^ (1/12) - 1
\`\`\`

Por exemplo, uma rentabilidade real de 6% ao ano não vira simplesmente "0,5% ao mês" (6% ÷ 12) — ela vira ${formatPercentage(Math.pow(1.06, 1 / 12) - 1)} ao mês, porque os juros capitalizam mês a mês. Essa é a função \`annualToMonthlyRate\` em \`src/core/math/rates.ts\`, usada tanto para a rentabilidade dos investimentos quanto para os juros de dívida.

## 3. Tributação do trabalho (INSS + IRPF)

### 3.1. INSS — contribuição progressiva

O INSS é calculado "por dentro": cada faixa de salário é tributada apenas pela alíquota daquela faixa, não pela alíquota mais alta aplicada ao total. Tabela vigente no simulador:

${inssRows}

A contribuição total é limitada ao teto de ${formatBRL(INSS_CEILING_CONTRIBUTION)}/mês, mesmo para salários muito acima da última faixa.

### 3.2. IRPF — tabela progressiva com dedução

Sobre a base de cálculo (salário bruto menos INSS), aplica-se a tabela progressiva do IRPF, no formato "alíquota efetiva com dedução simplificada":

\`\`\`
IRPF_tabela = max(0, base × alíquota_da_faixa − dedução_da_faixa)
\`\`\`

${irpfRows}

### 3.3. Reforma do IR de 2026: isenção e faixa de transição

A partir de 2026, o simulador aplica a reforma do Imposto de Renda por cima da tabela acima:

- **Isenção total** até ${formatBRL(IRPF_2026_EXEMPTION_LIMIT)}/mês: \`IRPF = 0\`.
- **Faixa de transição** entre ${formatBRL(IRPF_2026_EXEMPTION_LIMIT)} e ${formatBRL(IRPF_2026_TRANSITION_LIMIT)}: o imposto da tabela cheia é reduzido proporcionalmente à posição da renda dentro da faixa, sem "degraus":

\`\`\`
progresso = (base − ${formatBRL(IRPF_2026_EXEMPTION_LIMIT)}) ÷ (${formatBRL(IRPF_2026_TRANSITION_LIMIT)} − ${formatBRL(IRPF_2026_EXEMPTION_LIMIT)})
IRPF = IRPF_tabela × progresso
\`\`\`

- **Acima de ${formatBRL(IRPF_2026_TRANSITION_LIMIT)}/mês**: equivale exatamente à tabela cheia, sem nenhum desconto adicional.

O salário líquido final é: \`salário_líquido = salário_bruto − INSS − IRPF\`.

## 4. Tributação do capital

O rendimento de capital é tributado a uma alíquota única e simplificada de **${formatPercentage(CAPITAL_GAINS_TAX_RATE)}** sobre ganhos positivos:

\`\`\`
rendimento_líquido = rendimento_bruto × (1 − ${formatPercentage(CAPITAL_GAINS_TAX_RATE)})
\`\`\`

Importante: essa alíquota só se aplica quando o rendimento é **positivo**. Quando o patrimônio está negativo e gera juros de dívida (uma despesa, não um ganho), o valor negativo é mantido integralmente — dívida não recebe "desconto fiscal".

## 5. A dinâmica mensal completa

Para cada mês \`t\` de 1 até N, o motor (\`runSimulation\` em \`src/core/math/engine.ts\`) executa, nesta ordem:

**Passo 1 — Reajuste anual.** A cada 12 meses completos, salário e custo de vida são reajustados pelas taxas reais informadas:

\`\`\`
salário_t = salário_{t-1} × (1 + reajuste_salarial_anual)
gastos_t  = gastos_{t-1}  × (1 + crescimento_gastos_anual)
\`\`\`

**Passo 2 — Salário líquido do mês**, usando as regras da seção 3.

**Passo 3 — Rendimento do capital do mês**, calculado sobre o patrimônio do **mês anterior** (\`P_{t-1}\`):

\`\`\`
rendimento_bruto = P_{t-1} ≥ 0  ?  P_{t-1} × taxa_mensal_investimento
                                :  P_{t-1} × taxa_mensal_dívida
\`\`\`

(a taxa de dívida padrão é ${formatPercentage(DEFAULT_ANNUAL_DEBT_RATE)} ao ano real, configurável pelo usuário). O valor líquido usa a regra da seção 4.

**Passo 4 — Fluxo de caixa e novo patrimônio:**

\`\`\`
fluxo_de_caixa_t = salário_líquido_t − gastos_t
P_t = P_{t-1} + rendimento_líquido_t + fluxo_de_caixa_t
\`\`\`

Essa recorrência é a única fórmula que efetivamente "move" o patrimônio mês a mês — tudo o que vem antes serve apenas para calcular suas duas parcelas (fluxo de caixa do trabalho e rendimento do capital).

## 6. Indicadores finais (KPIs)

Ao final da timeline, o motor calcula:

- **Patrimônio final**: \`P_N\`, o último valor da recorrência acima.
- **Origem do patrimônio**: a soma de todo o fluxo de caixa do trabalho (\`ΣF_t\`) vs. a soma do patrimônio inicial com todos os rendimentos de capital acumulados (\`patrimônio_inicial + ΣR_t\`) — esta segunda soma é tratada como "capital", já que não exigiu esforço de trabalho durante a simulação.
- **Independência financeira**: o primeiro mês em que a renda passiva líquida do mês supera o custo de vida daquele mês (\`R_t ≥ gastos_t\`), convertido de volta para idade. Se isso nunca acontece dentro da simulação, o valor é \`null\`.
- **Consumo sustentável mensal**: \`P_N × taxa_mensal_investimento\` — gastar exatamente o rendimento real mensal mantém o patrimônio principal intacto para sempre. É uma variação mais precisa da popular "regra dos ${formatPercentage(SAFE_WITHDRAWAL_RATE)} ao ano", usando a própria rentabilidade configurada na simulação em vez de uma taxa genérica fixa.

## 7. Por que isso importa

Cada fórmula acima existe em um único lugar no código-fonte (\`src/core/math/\`), coberta por testes automatizados que verificam casos extremos — taxa de juros zero, patrimônio inicial negativo, salário zero, valores na casa dos bilhões. Isso significa que todo número que você vê na tela pode ser rastreado de volta a uma fórmula explícita e verificável, sem caixas-pretas. Se você encontrar algo que pareça incorreto, o código é aberto — veja o [repositório no GitHub](https://github.com/mcarvalhor/donodocapital) e confira (ou questione) você mesmo.
  `.trim();

  return {
    slug: 'formulas-e-algoritmos-do-simulador',
    title: 'As fórmulas e o algoritmo por trás do simulador',
    summary:
      'Um guia técnico, passo a passo, de todas as fórmulas matemáticas e do algoritmo mensal usados para calcular cada número que este site mostra.',
    body,
  };
}

export const ARTICLES: Article[] = [
  {
    slug: 'o-mito-do-cafezinho',
    title: 'O mito do cafezinho',
    summary:
      'Por que cortar pequenos gastos não vence a matemática dos juros compostos quando a base salarial é baixa.',
    body: `
É comum ouvir que deixar de tomar um café por dia pode te tornar milionário décadas depois, graças aos juros compostos. A matemática dos juros compostos é real — mas ela tem um pré-requisito silencioso: **capital para investir**.

Para quem ganha um salário mínimo e já gasta quase tudo com moradia, alimentação e transporte, a "margem de poupança" disponível é mínima. Cortar um cafezinho de R$ 5 por dia libera cerca de R$ 150 por mês. Investidos a 5% ao ano reais por 47 anos, esses R$ 150/mês viram pouco mais de R$ 300 mil — uma quantia relevante, mas que gera uma renda passiva de apenas ~R$ 1.250/mês, abaixo do próprio custo de vida básico.

O problema não é a matemática dos juros compostos — é a **base**. Juros compostos amplificam o que você já tem. Quando a base é pequena porque a renda do trabalho mal cobre o essencial, não existe corte de consumo capaz de compensar a ausência de capital inicial ou de uma renda que sobre significativamente além da sobrevivência.

Não por acaso, a narrativa do cafezinho costuma ser promovida com mais entusiasmo por quem já resolveu o problema da sobrevivência. Ela desloca uma pergunta incômoda — por que o salário não basta para gerar excedente, mesmo com disciplina máxima? — para uma pergunta confortável sobre hábitos de consumo individuais. Trocar o debate sobre distribuição de renda por um debate sobre força de vontade é, convenientemente, um debate que não exige nada de quem já está no topo da pirâmide.
    `.trim(),
  },
  {
    slug: 'r-maior-que-g-na-pratica',
    title: 'r > g na prática: Piketty aplicado ao Brasil',
    summary: 'Explicação acessível da tese de Thomas Piketty aplicada à realidade brasileira.',
    body: `
Em "O Capital no Século XXI", o economista francês Thomas Piketty resume boa parte da dinâmica da desigualdade moderna em uma desigualdade matemática simples:

**r > g**

Onde **r** é a taxa de retorno do capital (juros, dividendos, aluguéis, valorização de ativos) e **g** é a taxa de crescimento da economia — que, no longo prazo, também limita o crescimento dos salários.

Quando r > g, quem já possui capital vê seu patrimônio crescer mais rápido do que a economia como um todo cresce. Isso significa que, proporcionalmente, a fatia da riqueza nacional concentrada nas mãos de quem já tem capital tende a aumentar ao longo do tempo — não por mérito ou esforço adicional, mas pela pura mecânica dos juros compostos operando sobre uma base maior.

No Brasil, essa dinâmica é amplificada por uma tributação que favorece o capital (isenção de dividendos, alíquotas regressivas sobre renda fixa) em comparação à tributação do trabalho (alíquotas de IRPF que chegam a 27,5%, somadas à contribuição do INSS). O resultado prático: o dinheiro de quem já tem dinheiro trabalha com menos atrito fiscal do que o dinheiro de quem vive do próprio trabalho.

Vale notar que esse crescimento do capital não depende de nenhuma contribuição social nova: o patrimônio de quem já é rico rende simplesmente por já ser grande, independentemente de qualquer valor adicional gerado para a sociedade naquele mês. Enquanto isso, o valor que sustenta boa parte dessa engrenagem — o trabalho de quem produz bens, presta serviços e movimenta a economia real — segue remunerado abaixo do que ajuda a criar, com a diferença fluindo, ano após ano, para quem já estava mais rico.
    `.trim(),
  },
  {
    slug: 'assimetria-tributaria-brasileira',
    title: 'Assimetria Tributária Brasileira',
    summary:
      'Como o imposto sobre consumo e salário pesa proporcionalmente mais sobre os mais pobres do que sobre os rendimentos do capital.',
    body: `
O sistema tributário brasileiro é, em grande parte, regressivo na prática: pesa proporcionalmente mais sobre quem ganha menos.

Um trabalhador assalariado pode pagar até 27,5% de IRPF na faixa marginal mais alta, além da contribuição previdenciária (INSS). Some a isso os impostos indiretos sobre consumo (ICMS, PIS/COFINS), que incidem sobre praticamente tudo o que essa pessoa compra para sobreviver — e que, por consumir quase toda a renda, representam uma fatia muito maior da sua renda total do que representariam para alguém mais rico.

Já os rendimentos de capital no Brasil contam com mecanismos como a **isenção de dividendos** (lucros distribuídos por empresas aos seus sócios não são tributados na pessoa física) e alíquotas regressivas sobre aplicações financeiras, que podem chegar a apenas 15% para investimentos de longo prazo.

O resultado é uma assimetria clara: a renda do trabalho é tributada de forma mais pesada e mais imediata do que a renda do capital. Esse simulador aplica essa assimetria de forma transparente, para que você veja exatamente o impacto dela na sua própria trajetória.

Essa engenharia tributária não é um acidente nem uma lei da natureza — é uma escolha política, revisável a qualquer momento por quem detém poder de decisão sobre o orçamento público. E, não por coincidência, tende a ser mantida praticamente intacta justamente pelos setores que mais se beneficiam dela, ano eleitoral após ano eleitoral.
    `.trim(),
  },
  {
    slug: 'o-conceito-de-tempo-livre',
    title: 'O conceito de Tempo Livre',
    summary:
      'Riqueza não é apenas acumular cifras, mas ser dono do próprio tempo — comparando horas trabalhadas vs. horas de rendimento passivo.',
    body: `
Quando pensamos em riqueza, é fácil focar apenas no número no extrato bancário. Mas talvez a diferença mais profunda entre capital e trabalho não esteja no valor acumulado — e sim em **quem é dono do próprio tempo**.

Quem depende do salário troca horas de vida por dinheiro, todos os dias, indefinidamente — a menos que acumule capital suficiente para que o dinheiro passe a trabalhar sozinho. Quem já possui patrimônio relevante, por outro lado, pode gerar renda sem trocar uma única hora de trabalho: o capital "trabalha" 24 horas por dia, todos os dias, inclusive enquanto a pessoa dorme, viaja ou simplesmente não faz nada.

Essa relação entre tempo, trabalho e capital não é um fenômeno novo: pensadores já descreviam, há mais de um século, como o trabalho assalariado aliena o próprio tempo de vida de quem trabalha, transformando horas que poderiam ser dedicadas a descanso, família ou criação em simples insumo para a produção de lucro alheio. O capital, nesse sentido, não compra apenas força de trabalho — compra, literalmente, pedaços da vida de quem não tem outra escolha a não ser vendê-los.

Essa é a essência do "ponto de independência financeira" calculado neste simulador: o momento exato em que a renda gerada pelo patrimônio passa a cobrir o custo de vida, liberando a pessoa da necessidade de vender seu tempo para sobreviver. Para alguns arquétipos simulados aqui, esse ponto nunca chega. Para outros, ele já existe desde o nascimento.
    `.trim(),
  },
  {
    slug: 'o-inimigo-nunca-e-quem-trabalha',
    title: 'O inimigo nunca é quem trabalha pelo dinheiro',
    summary:
      'Porque quem depende do próprio trabalho — não importa a renda — está estruturalmente mais próximo de quem ganha salário mínimo do que de quem vive de capital.',
    body: `
É tentador simplificar o debate sobre desigualdade em "ricos contra pobres". Mas essa divisão esconde a linha que realmente importa na matemática deste simulador: **trabalho contra capital**.

Um médico, uma engenheira ou um dono de pequeno negócio que ganha R$ 30 mil por mês quase sempre ainda depende do próprio trabalho para sustentar seu padrão de vida. Se parar de trabalhar amanhã, a renda para — talvez não imediatamente, mas em algum horizonte previsível. Essa pessoa pode estar numa posição muito mais confortável do que a maioria, e ainda assim estar do mesmo lado estrutural da equação que o trabalhador de salário mínimo: ambos vendem horas de vida por dinheiro. A diferença é só a cotação da hora.

Quem vive puramente de capital — herança, dividendos, aluguéis, juros — não depende dessa troca. O dinheiro continua rendendo estando a pessoa trabalhando, descansando ou simplesmente inexistindo (o patrimônio segue investido, gerindo por terceiros, rendendo). Essa é a fronteira que Piketty resume em r > g: não é sobre quanto alguém ganha, é sobre **de onde** a renda vem.

Isso não significa que todo trabalhador bem remunerado deva se sentir "do lado errado" por ganhar bem, nem que ter um salário alto seja moralmente equivalente a ser pobre. Significa apenas que, estruturalmente, o esforço contínuo necessário para manter ou crescer o patrimônio de quem trabalha — seja ganhando R$ 1.500 ou R$ 30.000 por mês — nunca se equipara à ausência total desse esforço de quem já é dono do capital. O "inimigo", se é que essa palavra cabe aqui, nunca foi a pessoa que trabalha por seu dinheiro, seja ela rica ou pobre — é a assimetria matemática e tributária que faz o capital compor mais rápido e pagar menos imposto do que o trabalho, ano após ano.

Vale lembrar que nenhuma conquista histórica de quem trabalha — jornada de 8 horas, férias remuneradas, salário mínimo, décimo terceiro — chegou por generosidade espontânea de quem vive de capital. Todas vieram de organização coletiva e pressão de trabalhadores unidos, apesar das diferenças de renda entre si. É essa mesma lógica de organização coletiva — e não a competição entre quem ganha pouco e quem ganha um pouco mais — que historicamente reduziu, ainda que parcialmente, a distância entre r e g.
    `.trim(),
  },
  {
    slug: 'disparidade-economica-brasileira-em-numeros',
    title: 'A disparidade econômica do Brasil em números',
    summary:
      'O Brasil está entre os países mais desiguais do mundo — alguns exemplos concretos do tamanho desse abismo.',
    body: `
O Brasil aparece recorrentemente entre os países com maior concentração de renda do planeta. Segundo estimativas do Banco Mundial e do IBGE/PNAD, o coeficiente de Gini brasileiro (medida de desigualdade que vai de 0, igualdade total, a 1, desigualdade total) gira historicamente em torno de 0,53 — um dos mais altos entre economias de tamanho comparável.

Um retrato comumente citado por relatórios da Oxfam Brasil, com base em dados oficiais: o 1% mais rico da população concentra renda equivalente a dezenas de vezes a renda da metade mais pobre do país. Dito de outro modo, um grupo do tamanho da população de uma cidade média concentra riqueza comparável à de dezenas de milhões de brasileiros somados.

Para tangibilizar na escala deste simulador: um trabalhador de salário mínimo levaria o equivalente a **centenas de anos** de salário integral, sem gastar um centavo, para acumular o patrimônio que o preset "Jovem Bilionário" já possui aos 18 anos. E enquanto isso, o patrimônio desse bilionário cresce, só de rendimento, um valor várias vezes maior que o salário anual de um trabalhador comum — em um único mês.

Essa disparidade não é apenas uma curiosidade estatística. Ela se traduz em acesso desigual a educação de qualidade, saúde, moradia bem localizada e, principalmente, em pontos de partida completamente diferentes para a vida adulta — o que volta a conectar com a matemática de r > g: quem começa na frente, na ausência de contrapesos fortes, tende a permanecer na frente, e a distância tende a crescer com o tempo.

Importante: esses números não são resultado de uma lei econômica inevitável — são o resultado acumulado de decisões políticas específicas, tomadas e sustentadas, ao longo de décadas, por quem tem mais poder de influenciar essas decisões. Alíquotas, isenções e teto de gastos públicos são escolhas, não fenômenos naturais, e podem ser revistas pela mesma via política que as criou.
    `.trim(),
  },
  {
    slug: 'taxar-os-super-ricos-corretamente',
    title: 'A importância de taxar os super-ricos da maneira correta',
    summary:
      'Tributar mal o capital pode ser tão problemático quanto não tributar — a diferença está no desenho da política, não na intenção.',
    body: `
Defender que o capital deveria pagar impostos proporcionalmente mais justos não é o mesmo que defender "taxar os ricos até não sobrar nada". Política tributária é engenharia fina: o objetivo é captar recursos para financiar bens públicos (saúde, educação, infraestrutura) sem destruir os incentivos que fazem a economia crescer.

Vale notar, porém, que o argumento dos "incentivos destruídos" é frequentemente usado como veto automático a qualquer proposta de redistribuição, independentemente da magnitude real da mudança proposta — inclusive quando a alíquota discutida ainda deixaria o capital tributado bem abaixo do que já é tributado o trabalho. Ceticismo sobre o desenho de uma política específica é saudável; usar esse ceticismo para rejeitar qualquer tributação adicional ao capital, em qualquer cenário, é outra coisa.

O Brasil historicamente isentou dividendos de Imposto de Renda na pessoa física — uma escolha pouco comum entre grandes economias, onde a maioria dos países da OCDE tributa esse tipo de rendimento. Isso não acontece porque dividendos sejam moralmente diferentes de salário; acontece porque o desenho tributário brasileiro, por décadas, favoreceu explicitamente a renda do capital sobre a renda do trabalho.

Taxar corretamente significa calibrar: alíquotas que cresçam com a renda total (progressividade), sem criar brechas que permitam a quem tem mais recursos para planejamento tributário pagar proporcionalmente menos do que a classe média. A criação de um "imposto mínimo" sobre rendas muito altas — incluindo dividendos antes isentos — é um exemplo de ajuste fino: não abole a renda do capital, apenas garante que ela não fique, na prática, menos tributada que a renda de quem vive de salário.

O risco de taxar mal em qualquer direção é real: impostos mal desenhados podem gerar fuga de capital, informalidade ou simplesmente não arrecadar o suficiente para sustentar políticas públicas. Mas o risco de não taxar o capital de forma adequada também é real — e, segundo a própria matemática de r > g, esse risco composto ao longo de décadas é o motor estrutural da desigualdade. Taxar certo não é sobre punir sucesso; é sobre impedir que a vantagem matemática do capital sobre o trabalho seja ainda mais amplificada por uma vantagem fiscal.
    `.trim(),
  },
  {
    slug: 'ser-rico-x-ser-privilegiado',
    title: 'Ser rico x ser privilegiado no Brasil',
    summary:
      'Nem todo rico vive de privilégios herdados, nem todo pobre vive sem nenhum privilégio — entenda por que riqueza e privilégio não são a mesma coisa.',
    body: `
É comum tratar "rico" e "privilegiado" como sinônimos, mas essas são duas dimensões diferentes, e confundi-las empobrece o debate sobre desigualdade.

Existem pessoas que construíram patrimônio relevante através de esforço genuíno, risco assumido e competência em mercados competitivos — sem herança, sem rede de contatos privilegiada, sem vantagem de origem. Chamar essas pessoas de "privilegiadas" simplesmente por terem enriquecido ignora a trajetória real. Ao mesmo tempo, boa parte da riqueza concentrada no Brasil tem, sim, origem fortemente correlacionada a privilégio: patrimônio familiar herdado, acesso a escolas particulares de elite desde a infância, redes de contato que abrem portas profissionais, e um sistema de ITCMD (imposto sobre herança) com alíquota máxima de 8% — uma das mais baixas do mundo, onde países como Japão, Coreia do Sul, Reino Unido e EUA chegam a tributar heranças grandes a taxas de 40% ou mais.

Do outro lado, pobreza no Brasil também não é um bloco homogêneo de "ausência total de privilégio". Uma pessoa branca, nascida em capital do Sudeste, com os dois pais presentes e sem deficiência enfrenta, em média, barreiras estruturais menores do que uma pessoa preta ou parda nascida em região metropolitana do Nordeste — mesmo que ambas estejam, hoje, na mesma faixa de renda. Dados do IBGE/PNAD mostram consistentemente que raça, região e composição familiar afetam profundamente as chances de mobilidade social, independentemente da renda momentânea de cada família.

O ponto não é diluir a discussão sobre desigualdade econômica — é torná-la mais precisa. Riqueza (quanto patrimônio alguém tem) e privilégio (quais barreiras estruturais alguém não precisa enfrentar) são eixos relacionados, mas distintos. Entender os dois separadamente ajuda a desenhar políticas mais eficazes do que simplesmente dividir o país entre "ricos" e "pobres".

Separar as duas dimensões também evita uma armadilha comum: usar exemplos de riqueza "conquistada sem privilégio" para argumentar que o sistema como um todo é justo. Essas exceções existem — e são, genuinamente, admiráveis —, mas não invalidam o padrão estatístico amplamente documentado de que, em média, quem nasce com mais capital e menos barreiras estruturais chega muito mais longe com o mesmo esforço.
    `.trim(),
  },
  {
    slug: 'heranca-meritocracia-e-o-mito-do-comeco-igual',
    title: 'Herança, meritocracia e o mito do começo igual',
    summary:
      'A ideia de que "todo mundo começa do zero" ignora o quanto o ponto de partida determina o resultado final — mesmo com esforço idêntico.',
    body: `
A meritocracia pressupõe uma condição implícita: que todos competem a partir de um ponto de largada parecido, e que o resultado reflete majoritariamente esforço e talento. Este simulador existe justamente para testar essa suposição com números.

Compare dois jovens de 18 anos com o mesmo esforço, a mesma disciplina de poupança e a mesma rentabilidade nos investimentos. Um começa do zero; o outro começa com R$ 5 milhões herdados. Décadas de esforço idêntico produzem resultados que não são apenas "diferentes" — são de ordens de magnitude distintas, porque o segundo jovem teve o capital inicial trabalhando por ele desde o primeiro dia, enquanto o primeiro precisou primeiro construir essa base do zero, com o próprio trabalho.

O Brasil contribui para perpetuar essa vantagem de largada através de uma tributação de herança excepcionalmente branda: a alíquota máxima do ITCMD é de 8% (teto fixado por resolução do Senado desde 1992), e vários estados cobram bem menos do que isso. Para efeito de comparação, em países onde a preocupação com concentração dinástica de riqueza é mais explícita na política tributária, heranças grandes podem ser tributadas a taxas muito mais altas. Isso significa que, no Brasil, transferir uma fortuna de uma geração para a outra custa proporcionalmente pouco — o que ajuda a explicar por que sobrenomes de família continuam dominando listas de bilionários ano após ano.

Reconhecer isso não é negar que esforço e talento importam — importam, e muito, dentro de qualquer faixa de patrimônio inicial. É reconhecer que "começo igual" raramente existe de fato, e que ignorar essa diferença de largada distorce qualquer conversa séria sobre mérito, esforço e resultado.

Insistir em chamar esse sistema de meritocrático, sem jamais corrigir a desigualdade de largada que a própria tributação branda sobre herança ajuda a perpetuar, cumpre uma função bem específica: torna a desigualdade resultante mais fácil de aceitar — tanto por quem herda quanto por quem assiste de fora — do que ela seria se chamada pelo nome correto: vantagem acumulada, transmitida de geração em geração, a um custo fiscal quase simbólico.
    `.trim(),
  },
  {
    slug: 'patrimonio-liquido-importa-mais-que-salario',
    title: 'Por que patrimônio líquido importa mais que salário',
    summary:
      'Renda é um fluxo que pode parar a qualquer momento; patrimônio é um estoque que continua existindo (e rendendo) mesmo quando você para.',
    body: `
Quando alguém pergunta "quanto você ganha?", está perguntando sobre um **fluxo**: dinheiro que entra mês a mês, e que depende de continuar trabalhando (ou de alguma fonte ativa de renda) para não secar. Patrimônio líquido é diferente: é um **estoque** — tudo que você possui, menos tudo que você deve — que continua existindo mesmo em meses em que você não trabalha, não vende nada e não recebe salário algum.

Essa diferença parece sutil, mas muda completamente a análise de segurança financeira. Duas pessoas podem ganhar o mesmo salário de R$ 10 mil por mês e estar em situações radicalmente diferentes: uma pode ter patrimônio líquido negativo (mais dívidas do que bens), vivendo literalmente um salário de distância da ruína financeira; a outra pode ter patrimônio líquido de R$ 2 milhões, com o salário sendo apenas um complemento de uma base que já se sustenta sozinha. A renda mensal das duas é idêntica. A segurança financeira real não tem nada a ver.

É por isso que os indicadores centrais deste simulador — patrimônio final, renda passiva mensal e o "ponto de independência financeira" — giram em torno de patrimônio e não apenas de salário. Um salário alto que não vira patrimônio é apenas um fluxo temporário; ele desaparece no dia em que a pessoa para de trabalhar, se aposenta mal ou perde o emprego. Patrimônio bem construído, por outro lado, é o que efetivamente separa quem depende do próprio trabalho para sempre de quem, em algum momento, passa a ter o dinheiro trabalhando por si.

Essa distinção também explica por que políticas voltadas apenas a aumentar o salário nominal, sem jamais tocar na distribuição de patrimônio — propriedade de empresas, terra, ativos financeiros —, tendem a produzir melhorias limitadas e reversíveis. Quem não acumula patrimônio segue estruturalmente dependente de continuar vendendo o próprio tempo, não importa quão alto seja, num determinado momento, o valor da hora vendida.
    `.trim(),
  },
  buildFormulasAndAlgorithmsArticle(),
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}
