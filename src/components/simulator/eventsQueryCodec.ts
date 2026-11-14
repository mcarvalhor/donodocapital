/**
 * Codificação compacta de eventos da simulação para a URL.
 *
 * Formato de cada evento: `mes:alvo:operacao:valor`, eventos separados por vírgula.
 * Códigos curtos de 1 caractere para `alvo` e `operacao` mantêm a URL o mais enxuta
 * possível mesmo com várias dezenas de eventos:
 *
 *   ev=12:s:d:6000,24:w:a:50000,36:e:p:-0.1,48:r:d:0.03
 *
 * Nota sobre tamanho de URL (`?` vs. `#`): a query string (`?`) é enviada ao servidor
 * como parte da linha de requisição HTTP, e está sujeita a limites práticos impostos
 * por proxies/servidores (ex.: Nginx costuma limitar cabeçalhos a ~8 KB por padrão).
 * O fragmento (`#`), por outro lado, NUNCA é enviado ao servidor — existe apenas no
 * navegador — então não está sujeito a esse limite, apenas ao limite (bem maior,
 * dezenas de milhares de caracteres) do próprio navegador.
 *
 * Com a codificação compacta usada aqui, cada evento custa ~15-20 caracteres, então
 * até algumas centenas de eventos ainda cabem confortavelmente numa query string
 * normal. Se um dia isso deixar de ser suficiente, a mitigação correta é migrar
 * especificamente o parâmetro `ev` (não o resto do estado) para o fragmento da URL,
 * já que é a única parte do estado com tamanho potencialmente ilimitado.
 */
import type {
  SimulationEvent,
  SimulationEventOperation,
  SimulationEventTarget,
} from '@/core/types/simulation';

const FIELD_SEPARATOR = ':';
const EVENT_SEPARATOR = ',';

const OPERATION_CODE: Record<SimulationEventOperation, string> = {
  set: 'd',
  add: 'a',
  addPercent: 'p',
};

const OPERATION_BY_CODE: Record<string, SimulationEventOperation> = {
  d: 'set',
  a: 'add',
  p: 'addPercent',
};

/**
 * Códigos explícitos (não derivados da primeira letra) — necessário porque os quatro
 * campos de taxa começam todos com "annual", então a primeira letra sozinha não é
 * mais suficiente para diferenciá-los.
 */
const TARGET_CODE: Record<SimulationEventTarget, string> = {
  wealth: 'w',
  salary: 's',
  expenses: 'e',
  annualSalaryGrowth: 'g',
  annualExpenseGrowth: 'c',
  annualRealReturn: 'r',
  annualDebtRate: 'j',
};

const TARGET_BY_CODE: Record<string, SimulationEventTarget> = {
  w: 'wealth',
  s: 'salary',
  e: 'expenses',
  g: 'annualSalaryGrowth',
  c: 'annualExpenseGrowth',
  r: 'annualRealReturn',
  j: 'annualDebtRate',
};

/** Serializa uma lista de eventos no formato compacto usado na URL (parâmetro `ev`). */
export function serializeEvents(events: SimulationEvent[]): string {
  return events
    .map((event) =>
      [
        event.monthIndex,
        TARGET_CODE[event.target],
        OPERATION_CODE[event.operation],
        event.value,
      ].join(FIELD_SEPARATOR),
    )
    .join(EVENT_SEPARATOR);
}

/**
 * Faz o parse inverso de `serializeEvents`. Entradas malformadas (ex.: URL editada
 * manualmente) são ignoradas individualmente, sem derrubar o parse dos demais eventos.
 */
export function deserializeEvents(raw: string): SimulationEvent[] {
  if (!raw) return [];

  return raw
    .split(EVENT_SEPARATOR)
    .map((chunk, index) => parseEventChunk(chunk, index))
    .filter((event): event is SimulationEvent => event !== null);
}

function parseEventChunk(chunk: string, index: number): SimulationEvent | null {
  const parts = chunk.split(FIELD_SEPARATOR);
  if (parts.length !== 4) return null;

  const [monthRaw, targetCodeRaw, operationCodeRaw, valueRaw] = parts as [
    string,
    string,
    string,
    string,
  ];

  const monthIndex = Number(monthRaw);
  const target = TARGET_BY_CODE[targetCodeRaw];
  const operation = OPERATION_BY_CODE[operationCodeRaw];
  const value = Number(valueRaw);

  if (!Number.isFinite(monthIndex) || !target || !operation || !Number.isFinite(value)) {
    return null;
  }

  return {
    id: `evt-${index}-${monthIndex}-${targetCodeRaw}-${operationCodeRaw}`,
    monthIndex,
    target,
    operation,
    value,
  };
}
