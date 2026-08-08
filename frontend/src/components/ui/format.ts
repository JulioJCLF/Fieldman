/** Formatação monetária padrão (BRL) compartilhada pela UI. */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
