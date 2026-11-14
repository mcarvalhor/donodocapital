# Contribuindo com o Dono do Capital

Obrigado por considerar contribuir com este projeto! Este documento descreve o fluxo de trabalho, as convenções e os padrões de qualidade esperados antes de abrir um Pull Request.

> **Antes de tudo:** leia o [`AGENTS.md`](AGENTS.md). Ele é a fonte da verdade sobre arquitetura, regras de negócio, modelo matemático e diretrizes de UI/UX deste repositório. Qualquer contribuição — humana ou de agente de IA — deve respeitar rigorosamente o que está definido lá.

---

## 🤖 Uso de Inteligência Artificial neste projeto

**Este projeto foi construído com o auxílio extensivo de ferramentas de Inteligência Artificial**, e o uso dessas ferramentas em contribuições futuras é **explicitamente permitido e incentivado** — tanto para gerar código quanto para revisar, refatorar, escrever testes, redigir documentação ou criar conteúdo editorial.

Algumas diretrizes para contribuições assistidas por IA:

- **O resultado importa mais que o processo.** Não é necessário declarar o uso de IA num PR, mas o código e o conteúdo gerados devem passar pelos mesmos padrões de qualidade de qualquer outra contribuição — nada de código ou texto que você não entenda ou não possa explicar.
- **O [`AGENTS.md`](AGENTS.md) é o contrato com qualquer agente.** Se você está usando um assistente de IA, garanta que ele tenha lido e esteja seguindo esse documento — especialmente a regra de "zero lógica financeira na UI" e os contratos de dados em `src/core/types/simulation.ts`.
- **Validação automatizada não é opcional.** Toda contribuição, gerada por IA ou não, precisa passar pelo [checklist de finalização](#-checklist-antes-de-abrir-um-pull-request) abaixo antes de ser submetida.
- **Precisão factual em conteúdo editorial é responsabilidade de quem submete.** Se você usar IA para redigir ou revisar artigos em `src/content/`, confira manualmente qualquer dado numérico ou estatístico citado antes de abrir o PR — alucinações de dados são o erro mais comum e mais prejudicial nesse tipo de conteúdo.

## 📋 Código de Conduta

Seja respeitoso, construtivo e empático nas discussões. Este projeto trata de um tema sensível (desigualdade econômica) e deve manter um tom didático e rigoroso nos dados, livre de panfletagem ou ataques pessoais, tanto no produto quanto nas interações da comunidade.

## 🌿 Estratégia de Branches

| Branch | Propósito |
|---|---|
| `main` | Produção. Sempre estável e passível de deploy. Protegida contra push direto. |
| `feature/<nome-curto>` | Nova funcionalidade (ex.: `feature/grafico-comparacao`). |
| `fix/<nome-curto>` | Correção de bug (ex.: `fix/calculo-taxa-mensal`). |
| `docs/<nome-curto>` | Alterações apenas de documentação. |
| `chore/<nome-curto>` | Manutenção, dependências, configuração. |

Fluxo básico:

```bash
git checkout main
git pull origin main
git checkout -b feature/minha-funcionalidade
# ... faça suas alterações ...
git push origin feature/minha-funcionalidade
# abra um Pull Request para main
```

## ✍️ Convenção de Commits

Este projeto segue [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```text
<tipo>(<escopo opcional>): <descrição curta no imperativo>

[corpo opcional explicando o porquê]

[rodapé opcional, ex.: Closes #12]
```

**Tipos permitidos:**

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade visível para o usuário |
| `fix` | Correção de bug |
| `docs` | Alterações somente em documentação (README, AGENTS.md, comentários) |
| `style` | Formatação, sem mudança de lógica (Prettier, espaçamento) |
| `refactor` | Refatoração de código sem mudar comportamento externo |
| `perf` | Melhoria de performance |
| `test` | Adição ou ajuste de testes |
| `chore` | Build, dependências, configuração de ferramentas, Docker |

**Exemplos:**

```text
feat(core/math): adiciona eventos na linha do tempo da simulação
fix(charts): corrige escala logarítmica com valores negativos
docs(readme): atualiza instruções de deploy com Docker
test(engine): cobre cenário de patrimônio inicial negativo
chore(docker): adiciona Dockerfile multi-stage com Nginx Alpine
```

## 🧱 Padrões de Código

Estas regras são extensões diretas do [`AGENTS.md`](AGENTS.md) (seção 8) e são **obrigatórias**:

1. **Zero lógica financeira na UI.** Nenhuma fórmula de juros, taxa ou imposto deve existir em arquivos `.tsx`. Toda matemática pertence a `src/core/math/` como funções puras (sem dependência de React ou DOM). Geração de texto/URL (ex.: `shareCopy.ts`, `eventsQueryCodec.ts`) não conta como lógica financeira — é apenas templating sobre números já calculados.
2. **Compatibilidade de contratos.** Antes de alterar cálculos, verifique `src/core/types/simulation.ts` e `src/core/math/engine.ts` para não quebrar os contratos existentes (incluindo `SimulationEvent` e seus alvos/operações).
3. **TypeScript estrito.** O projeto roda com `strict: true`. Não utilize `any` sem justificativa explícita em comentário.
4. **Edge cases obrigatórios** em qualquer alteração no motor matemático:
   - Taxa de juros igual a 0%.
   - Patrimônio inicial negativo ou que se torna negativo ao longo da simulação.
   - Salário igual a R$ 0.
   - Idade final igual ou menor que a idade inicial (deve ser barrado na validação de formulário).
   - Valores na casa de bilhões/trilhões sem quebrar o layout (`overflow-x-hidden`, compactação de números).
   - Eventos com `monthIndex` fora do intervalo simulado (devem ser ignorados sem erro).
   - Eventos que alteram taxas anuais (as taxas mensais derivadas precisam ser recalculadas).
5. **Testes obrigatórios.** Toda alteração em `src/core/math/` precisa vir acompanhada de testes em `*.test.ts` cobrindo o novo comportamento e os edge cases relevantes.
6. **Performance e UX de inputs.**
   - Use `useMemo` para o cálculo da simulação (`runSimulation`) e evite recomputações desnecessárias em re-renders.
   - Inputs numéricos devem aceitar o formato brasileiro (vírgula como separador decimal) sem travar o cursor do usuário.
7. **Formatação monetária.** Sempre via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, com formatação compacta (`R$ 1,5 mi`, `R$ 1,2 bi`) em eixos de gráfico.
8. **Compatibilidade com export estático.** Nenhuma funcionalidade nova pode depender de API Routes, Server Actions, middleware ou qualquer recurso que exija um servidor Node.js em produção. Acesso a `window`/`navigator`/`document` deve sempre estar guardado em `'use client'` + `useEffect`.

## ✅ Checklist Antes de Abrir um Pull Request

Verifique **todos** os itens abaixo localmente antes de submeter:

- [ ] `npx tsc --noEmit` passa sem erros de tipagem.
- [ ] `npm run lint` passa sem erros ou *warnings* críticos.
- [ ] `npm run test` passa com 100% de sucesso (`npx vitest run`).
- [ ] `npm run build` compila sem erros e gera `out/` com todas as páginas esperadas.
- [ ] Alterações em `src/core/math/` possuem testes novos ou atualizados.
- [ ] Nenhuma fórmula financeira foi adicionada diretamente em componentes `.tsx`.
- [ ] A descrição do PR explica **o quê** e **por quê**, não apenas o **como**.
- [ ] Capturas de tela ou GIFs anexados para alterações visuais/UX.

## 🔀 Processo de Pull Request

1. Abra o PR contra a branch `main`.
2. Preencha o título seguindo a convenção de commits (ex.: `feat(simulador): adiciona botão de escala logarítmica`).
3. Descreva o contexto, a motivação e como testar manualmente a alteração.
4. Vincule a *issue* relacionada, se houver (`Closes #123`).
5. Aguarde a revisão — pelo menos uma aprovação é necessária antes do merge.
6. Prefira **squash merge** para manter o histórico de `main` limpo e alinhado à convenção de commits.

## 📊 Contribuindo com Dados e Conteúdo Editorial

Este projeto depende de dados públicos confiáveis para manter credibilidade:

- Alterações em `src/data/economicConstants.ts` ou `src/data/presets.ts` devem citar a fonte (IBGE, PNAD, Receita Federal, DIEESE, etc.) no comentário do código ou na descrição do PR.
- Novos artigos em `src/content/` devem seguir o tom de voz definido na [seção 7 do AGENTS.md](AGENTS.md#7-diretrizes-editoriais-e-de-conteúdo): didático, empático com o trabalhador, rigoroso nos dados e sem jargão acadêmico desnecessário.
- Se usar IA para redigir ou revisar conteúdo editorial, confira manualmente qualquer dado numérico citado (ver seção sobre IA acima).

## 🐳 Contribuindo com Deploy/Infraestrutura

Alterações no `Dockerfile`, em `docker/nginx.conf` ou em `docker/inject-site-url.sh` devem:

- Manter a imagem final livre de Node.js e código-fonte (apenas Nginx + arquivos estáticos).
- Preservar a porta 80 HTTP sem TLS dentro do container (SSL/TLS é responsabilidade do proxy reverso na frente, não deste container).
- Testar manualmente o fluxo completo (`docker build` → `docker run` → acessar via navegador) antes de abrir o PR, já que não há testes automatizados para infraestrutura neste repositório.

## 🐛 Reportando Bugs

Ao abrir uma *issue* de bug, inclua:

- Passos para reproduzir (idealmente com os parâmetros da simulação, já que o estado — incluindo eventos — fica na URL).
- Comportamento esperado vs. comportamento observado.
- Screenshot ou link da simulação (`/simulador?...`) quando aplicável.
- Navegador e dispositivo (especialmente relevante, já que o produto é *mobile-first*).

## 💡 Sugerindo Funcionalidades

Abra uma *issue* descrevendo o problema que a funcionalidade resolve e, se possível, como ela se encaixa nos pilares de produto descritos na [seção 1 do AGENTS.md](AGENTS.md#1-visão-geral-e-propósito-do-produto). Mudanças estruturais nos contratos de dados ou no modelo matemático devem ser discutidas antes da implementação.

---

Dúvidas sobre este guia? Abra uma *issue* com a tag `question`.
