import type {
  AnalyticsRepository,
  DateRange,
  MonthComparison,
  MonthlyReport,
  OverviewReport,
  ProjectionReport,
  RevenueBreakdown,
  YearTotal,
} from './analytics.types.js';

/** Nº mínimo de meses com dados reais para liberar a projeção (regra de negócio). */
const MIN_MONTHS_FOR_PROJECTION = 3;

export interface AnalyticsServicePort {
  getOverview(range: DateRange): Promise<OverviewReport>;
  getMonthly(year: number): Promise<MonthlyReport>;
  compareMonthAcrossYears(month: number, year: number): Promise<MonthComparison>;
  compareYears(years: number[]): Promise<YearTotal[]>;
  getProjection(targetYear: number): Promise<ProjectionReport>;
}

function yearRange(year: number): DateRange {
  return {
    from: new Date(Date.UTC(year, 0, 1)).toISOString(),
    to:   new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).toISOString(),
  };
}

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

function linearRegression(points: Array<{ x: number; y: number }>): { a: number; b: number } {
  const n = points.length;
  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  const b = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  return { a, b };
}

export class AnalyticsService implements AnalyticsServicePort {
  public constructor(private readonly repo: AnalyticsRepository) {}

  public async getOverview(range: DateRange): Promise<OverviewReport> {
    const [entries, refills, sales, games] = await Promise.all([
      this.repo.getEntries(range),
      this.repo.getRefills(range),
      this.repo.getSales(range),
      this.repo.getGames(range),
    ]);

    const revenue: RevenueBreakdown = {
      entry_equipped: 0,
      entry_rental:   0,
      refills:        0,
      snackbar:       0,
      store:          0,
      total:          0,
    };

    for (const e of entries) {
      if (!e.paid) continue;
      if (e.modality === 'EQUIPPED') revenue.entry_equipped += e.amount;
      else revenue.entry_rental += e.amount;
    }

    for (const r of refills) {
      if (!r.paid) continue;
      if (r.item_type === 'REFILL') revenue.refills += r.amount;
      else if (r.item_type === 'SNACKBAR') revenue.snackbar += r.amount;
      else revenue.store += r.amount;
    }

    for (const s of sales) {
      if (s.channel === 'SNACKBAR') revenue.snackbar += s.amount;
      else revenue.store += s.amount;
    }

    revenue.total = revenue.entry_equipped + revenue.entry_rental + revenue.refills + revenue.snackbar + revenue.store;

    return {
      range,
      revenue,
      counts: {
        equipped: entries.filter((e) => e.modality === 'EQUIPPED').length,
        rental:   entries.filter((e) => e.modality === 'RENTAL').length,
        refills:  refills.filter((r) => r.item_type === 'REFILL').length,
        games:    games.length,
      },
    };
  }

  public async getMonthly(year: number): Promise<MonthlyReport> {
    const buckets = await this.monthlyRevenue(yearRange(year));
    const months = Array.from({ length: 12 }, (_, i) => ({
      month:   i + 1,
      revenue: buckets.get(`${year}-${String(i + 1).padStart(2, '0')}`) ?? 0,
    }));
    return { year, months, total: months.reduce((s, m) => s + m.revenue, 0) };
  }

  public async compareMonthAcrossYears(month: number, year: number): Promise<MonthComparison> {
    const [currentReport, previousReport] = await Promise.all([
      this.getMonthly(year),
      this.getMonthly(year - 1),
    ]);

    const current  = currentReport.months[month - 1]?.revenue ?? 0;
    const previous = previousReport.months[month - 1]?.revenue ?? 0;
    const delta    = previous === 0 ? null : ((current - previous) / previous) * 100;

    return {
      month,
      current_year:     year,
      previous_year:    year - 1,
      current_revenue:  current,
      previous_revenue: previous,
      delta_pct:        delta,
    };
  }

  public async compareYears(years: number[]): Promise<YearTotal[]> {
    const reports = await Promise.all(years.map((y) => this.getMonthly(y)));
    return reports.map((r) => ({ year: r.year, revenue: r.total }));
  }

  public async getProjection(targetYear: number): Promise<ProjectionReport> {
    // Base histórica: 3 anos anteriores até o fim de (targetYear - 1).
    const historyRange: DateRange = {
      from: new Date(Date.UTC(targetYear - 3, 0, 1)).toISOString(),
      to:   new Date(Date.UTC(targetYear - 1, 11, 31, 23, 59, 59, 999)).toISOString(),
    };

    const buckets = await this.monthlyRevenue(historyRange);
    const monthsWithData = [...buckets.values()].filter((v) => v > 0).length;

    if (monthsWithData < MIN_MONTHS_FOR_PROJECTION) {
      return {
        target_year:     targetYear,
        sufficient_data: false,
        based_on_months: monthsWithData,
        months:          [],
      };
    }

    // Série contínua do primeiro mês com dados até dez/(targetYear-1), preenchendo lacunas com 0.
    const keys = [...buckets.keys()].filter((k) => (buckets.get(k) ?? 0) > 0).sort();
    const firstKey = keys[0]!;
    const startYear  = Number(firstKey.slice(0, 4));
    const startMonth = Number(firstKey.slice(5, 7));

    const series: Array<{ x: number; y: number }> = [];
    let x = 0;
    for (let y = startYear; y <= targetYear - 1; y++) {
      const mStart = y === startYear ? startMonth : 1;
      for (let m = mStart; m <= 12; m++) {
        const key = `${y}-${String(m).padStart(2, '0')}`;
        series.push({ x, y: buckets.get(key) ?? 0 });
        x += 1;
      }
    }

    const { a, b } = linearRegression(series);
    const months = Array.from({ length: 12 }, (_, i) => {
      const projected = a + b * (series.length + i);
      return { month: i + 1, projected_revenue: Math.max(0, Math.round(projected * 100) / 100) };
    });

    return {
      target_year:     targetYear,
      sufficient_data: true,
      based_on_months: monthsWithData,
      months,
    };
  }

  /** Faturamento total mensal (todas as fontes) agrupado por chave YYYY-MM. */
  private async monthlyRevenue(range: DateRange): Promise<Map<string, number>> {
    const [entries, refills, sales] = await Promise.all([
      this.repo.getEntries(range),
      this.repo.getRefills(range),
      this.repo.getSales(range),
    ]);

    const buckets = new Map<string, number>();
    const add = (iso: string, amount: number) => {
      const key = monthKey(iso);
      buckets.set(key, (buckets.get(key) ?? 0) + amount);
    };

    for (const e of entries) if (e.paid) add(e.at, e.amount);
    for (const r of refills) if (r.paid) add(r.at, r.amount);
    for (const s of sales) add(s.at, s.amount);

    return buckets;
  }
}
