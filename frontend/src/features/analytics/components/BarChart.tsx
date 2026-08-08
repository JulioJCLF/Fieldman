import { formatCompact, formatCurrency } from '../format';

export interface Bar {
  label: string;
  value: number;
  /** Destaca a barra (ex: mês/ano atual). */
  highlight?: boolean;
}

interface Props {
  bars: Bar[];
  height?: number;
}

/** Gráfico de barras em SVG puro — sem dependências externas. */
export function BarChart({ bars, height = 180 }: Props) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-2" style={{ height, minWidth: bars.length * 40 }}>
        {bars.map((bar) => {
          const pct = (bar.value / max) * 100;
          return (
            <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${bar.label}: ${formatCurrency(bar.value)}`}>
              <span className="font-mono text-[9px] text-stone-500">{bar.value > 0 ? formatCompact(bar.value) : ''}</span>
              <div
                className={`w-full transition-all ${bar.highlight ? 'bg-lime-300' : 'bg-[#3d4a34]'}`}
                style={{ height: `${Math.max(pct, bar.value > 0 ? 2 : 0)}%` }}
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-stone-500">{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
