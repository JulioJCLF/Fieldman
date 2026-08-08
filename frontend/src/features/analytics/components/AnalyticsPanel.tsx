import { MonthlyChart } from './MonthlyChart';
import { OverviewCards } from './OverviewCards';
import { ProjectionChart } from './ProjectionChart';
import { YearComparison } from './YearComparison';

export function AnalyticsPanel() {
  return (
    <section>
      <div className="border-b border-outline-variant pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Módulo 05 · gestão/gráficos
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-on-surface sm:text-4xl">
          Gestão & projeções.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
          Consolidação de faturamento por período, comparativos entre anos e projeção de crescimento.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <OverviewCards />

        <div className="grid gap-6 xl:grid-cols-2">
          <MonthlyChart />
          <YearComparison />
        </div>

        <ProjectionChart />
      </div>
    </section>
  );
}
