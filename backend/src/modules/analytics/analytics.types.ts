export interface DateRange {
  from: string; // ISO timestamp
  to: string;   // ISO timestamp
}

/** Linhas cruas retornadas pelo repositório, já normalizadas por fonte. */
export interface EntryRow {
  at: string;
  modality: 'EQUIPPED' | 'RENTAL';
  amount: number;
  paid: boolean;
}

export interface RefillRow {
  at: string;
  item_type: 'REFILL' | 'SNACKBAR' | 'STORE';
  amount: number;
  paid: boolean;
}

export interface SaleRow {
  at: string;
  channel: 'SNACKBAR' | 'STORE';
  amount: number;
}

export interface GameRow {
  at: string;
  type: 'OPEN' | 'PRIVATE';
}

/** Quebra de faturamento por fonte de receita (sem sobreposição). */
export interface RevenueBreakdown {
  entry_equipped: number;
  entry_rental: number;
  refills: number;
  snackbar: number;
  store: number;
  total: number;
}

export interface CountsBreakdown {
  equipped: number;
  rental: number;
  refills: number;
  games: number;
}

export interface OverviewReport {
  range: DateRange;
  revenue: RevenueBreakdown;
  counts: CountsBreakdown;
}

export interface MonthlyBucket {
  month: number; // 1-12
  revenue: number;
}

export interface MonthlyReport {
  year: number;
  months: MonthlyBucket[];
  total: number;
}

export interface MonthComparison {
  month: number;
  current_year: number;
  previous_year: number;
  current_revenue: number;
  previous_revenue: number;
  delta_pct: number | null; // null quando o ano anterior é zero
}

export interface YearTotal {
  year: number;
  revenue: number;
}

export interface ProjectionMonth {
  month: number; // 1-12
  projected_revenue: number;
}

export interface ProjectionReport {
  target_year: number;
  sufficient_data: boolean;
  based_on_months: number; // meses com dados reais usados no ajuste
  months: ProjectionMonth[];
}

export interface AnalyticsRepository {
  getEntries(range: DateRange): Promise<EntryRow[]>;
  getRefills(range: DateRange): Promise<RefillRow[]>;
  getSales(range: DateRange): Promise<SaleRow[]>;
  getGames(range: DateRange): Promise<GameRow[]>;
}
