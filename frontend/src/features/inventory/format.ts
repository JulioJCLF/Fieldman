export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Converte "12,50" ou "12.50" em número. Retorna NaN se inválido. */
export function parseDecimal(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

/** Faixas de data (UTC, formato YYYY-MM-DD) para os filtros de relatório. */
export function rangeForPeriod(period: 'day' | 'month' | 'year'): { from: string; to: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  const iso = (date: Date) => date.toISOString().slice(0, 10);

  if (period === 'day') {
    const today = iso(new Date(Date.UTC(y, m, d)));
    return { from: today, to: today };
  }
  if (period === 'month') {
    return { from: iso(new Date(Date.UTC(y, m, 1))), to: iso(new Date(Date.UTC(y, m + 1, 0))) };
  }
  return { from: iso(new Date(Date.UTC(y, 0, 1))), to: iso(new Date(Date.UTC(y, 11, 31))) };
}
