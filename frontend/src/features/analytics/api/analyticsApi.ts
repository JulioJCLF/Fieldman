import { api, ApiError } from '../../../lib/apiClient';
import type {
  MonthComparison,
  MonthlyReport,
  OverviewReport,
  ProjectionReport,
  YearTotal,
} from '../types';

export { ApiError };

export async function getOverview(range?: { from?: string; to?: string }): Promise<OverviewReport> {
  const params = new URLSearchParams();
  if (range?.from) params.set('from', range.from);
  if (range?.to) params.set('to', range.to);
  const qs = params.toString();
  return api.get<OverviewReport>(`/api/analytics/overview${qs ? `?${qs}` : ''}`);
}

export async function getMonthly(year: number): Promise<MonthlyReport> {
  return api.get<MonthlyReport>(`/api/analytics/monthly?year=${year}`);
}

export async function compareMonths(year: number, month: number): Promise<MonthComparison> {
  return api.get<MonthComparison>(`/api/analytics/compare-months?year=${year}&month=${month}`);
}

export async function compareYears(years: number[]): Promise<YearTotal[]> {
  return api.get<YearTotal[]>(`/api/analytics/compare-years?years=${years.join(',')}`);
}

export async function getProjection(year: number): Promise<ProjectionReport> {
  return api.get<ProjectionReport>(`/api/analytics/projection?year=${year}`);
}
