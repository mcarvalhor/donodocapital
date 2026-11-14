import { describe, expect, it } from 'vitest';
import { buildPixPayload, crc16ccitt } from './pixPayload';

describe('crc16ccitt', () => {
  it('bate com o valor de verificação de referência (check value) para o algoritmo CRC-16/CCITT-FALSE', () => {
    // "123456789" é o vetor de teste padrão usado para validar implementações desse
    // algoritmo (poly 0x1021, init 0xFFFF, sem reflexão de entrada/saída, sem XOR final).
    expect(crc16ccitt('123456789')).toBe('29B1');
  });

  it('é determinístico para a mesma entrada', () => {
    const payload = '000201260014br.gov.bcb.pix';
    expect(crc16ccitt(payload)).toBe(crc16ccitt(payload));
  });
});

describe('buildPixPayload', () => {
  it('inicia com o Payload Format Indicator fixo "000201"', () => {
    const payload = buildPixPayload({
      key: 'chave-aleatoria',
      merchantName: 'Matheus',
      merchantCity: 'São Paulo',
    });
    expect(payload.startsWith('000201')).toBe(true);
  });

  it('inclui o GUI oficial do Pix e a chave informada dentro do bloco Merchant Account Information', () => {
    const payload = buildPixPayload({
      key: 'minha-chave-123',
      merchantName: 'Matheus',
      merchantCity: 'São Paulo',
    });
    expect(payload).toContain('br.gov.bcb.pix');
    expect(payload).toContain('minha-chave-123');
  });

  it('remove acentos e converte nome/cidade para caixa alta (exigência do padrão EMV)', () => {
    const payload = buildPixPayload({
      key: 'chave',
      merchantName: 'João',
      merchantCity: 'São Paulo',
    });
    expect(payload).toContain('JOAO');
    expect(payload).toContain('SAO PAULO');
    expect(payload).not.toMatch(/[ãáàâéêíóôõúü]/i);
  });

  it('termina com a tag "6304" seguida de exatamente 4 dígitos hexadecimais maiúsculos (CRC16)', () => {
    const payload = buildPixPayload({
      key: 'chave-aleatoria',
      merchantName: 'Matheus',
      merchantCity: 'Sao Paulo',
    });
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });

  it('trunca nome para 25 caracteres e cidade para 15, conforme limites do padrão', () => {
    const payload = buildPixPayload({
      key: 'chave',
      merchantName: 'Um Nome Extremamente Longo Que Excede o Limite',
      merchantCity: 'Uma Cidade Com Nome Muito Longo',
    });
    // Tag 59 (nome): length deve ser no máximo 25 => "5925" é o prefixo máximo esperado.
    expect(payload).toMatch(/59\d{2}/);
    const nameMatch = payload.match(/59(\d{2})/);
    const cityMatch = payload.match(/60(\d{2})/);
    expect(Number(nameMatch?.[1])).toBeLessThanOrEqual(25);
    expect(Number(cityMatch?.[1])).toBeLessThanOrEqual(15);
  });

  it('é determinístico: a mesma entrada sempre produz o mesmo payload (incluindo CRC)', () => {
    const options = { key: 'chave-fixa', merchantName: 'Matheus', merchantCity: 'Sao Paulo' };
    expect(buildPixPayload(options)).toBe(buildPixPayload(options));
  });
});
