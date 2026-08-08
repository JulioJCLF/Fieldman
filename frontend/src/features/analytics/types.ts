export interface DateRange {
  from: string;
  to: string;
}

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
  month: number;
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
  delta_pct: number | null;
}

export interface YearTotal {
  year: number;
  revenue: number;
}

export interface ProjectionMonth {
  month: number;
  projected_revenue: number;
}

export interface ProjectionReport {
  target_year: number;
  sufficient_data: boolean;
  based_on_months: number;
  months: ProjectionMonth[];
}
