/**
 * Geração do payload "Pix Copia e Cola" (padrão BR Code / EMV®) a partir de uma chave Pix.
 *
 * Um QR Code de pagamento Pix não pode conter apenas a chave em texto puro: os aplicativos
 * de banco esperam um payload estruturado no formato TLV (Tag-Length-Value) definido pelo
 * Banco Central do Brasil — o mesmo formato por trás de qualquer botão "Copiar código" de
 * uma cobrança Pix. Sem essa estrutura (e o CRC16 de verificação ao final), o app do banco
 * reconhece o QR Code como tecnicamente válido (por isso ele "detecta e vibra"), mas não
 * encontra nenhum dado de pagamento legível dentro dele — e simplesmente não faz nada.
 *
 * Função pura, sem I/O e sem dependência de React/DOM — cobre o subconjunto de campos
 * necessário para uma chave estática, sem valor fixo e sem identificador de transação
 * específico (txid "***", convenção do padrão para "não aplicável").
 */

export interface PixPayloadOptions {
  /** Chave Pix (aleatória, CPF/CNPJ, e-mail ou telefone). */
  key: string;
  /** Nome do recebedor, exibido no app de quem paga. Máx. 25 caracteres (truncado). */
  merchantName: string;
  /** Cidade do recebedor, exibida no app de quem paga. Máx. 15 caracteres (truncado). */
  merchantCity: string;
  /** Texto curto exibido como descrição da cobrança (opcional, máx. 99 caracteres). */
  description?: string;
}

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

/**
 * Remove acentos, mantém apenas letras/números/espaço e converte para caixa alta — exigência
 * do padrão EMV para os campos de nome/cidade do recebedor.
 */
function sanitizeEmvField(value: string, maxLength: number, fallback: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .trim();
  return (normalized || fallback).slice(0, maxLength);
}

/**
 * CRC16/CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF, sem reflexão) — o checksum
 * exigido pelo padrão BR Code ao final do payload. Retorna 4 dígitos hexadecimais maiúsculos.
 */
export function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Monta o payload completo "Pix Copia e Cola", pronto para ser transformado em QR Code (ou
 * colado diretamente no campo "Pix Copia e Cola" de qualquer app de banco).
 */
export function buildPixPayload({
  key,
  merchantName,
  merchantCity,
  description,
}: PixPayloadOptions): string {
  const merchantAccountInfo =
    tlv('00', 'br.gov.bcb.pix') +
    tlv('01', key.trim()) +
    (description ? tlv('02', sanitizeEmvField(description, 99, '')) : '');

  const additionalData = tlv('05', '***'); // txid genérico: sem identificador específico

  const payloadWithoutCrc =
    tlv('00', '01') + // Payload Format Indicator
    tlv('26', merchantAccountInfo) + // Merchant Account Information — Pix
    tlv('52', '0000') + // Merchant Category Code (genérico)
    tlv('53', '986') + // Moeda: BRL (ISO 4217)
    tlv('58', 'BR') + // País
    tlv('59', sanitizeEmvField(merchantName, 25, 'NA')) +
    tlv('60', sanitizeEmvField(merchantCity, 15, 'NA')) +
    tlv('62', additionalData) +
    '6304'; // Tag + tamanho do CRC16 (valor dos 4 dígitos é concatenado a seguir)

  return payloadWithoutCrc + crc16ccitt(payloadWithoutCrc);
}
