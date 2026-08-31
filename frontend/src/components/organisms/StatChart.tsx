import { useMemo } from 'react';
import { DonutChart } from '@/components/atoms/DonutChart';
import type { QuizStatusStats } from '@/types/quiz';
import type { ChartSlice } from '@/interfaces/quiz';
import './StatChart.scss';

export interface StatChartProps {
  stats: QuizStatusStats;
}

/** Stable colors per status for the donut chart. */
const STATUS_COLORS: Record<keyof QuizStatusStats, string> = {
  draft: '#9ca3af',
  scheduled: '#3b82f6',
  live: '#22c55e',
  completed: '#f59e0b',
  cancelled: '#e5484d',
  total: '#111827',
};

/**
 * StatChart organism — renders a donut chart of quiz status distribution
 * with a legend. Slices with zero count are still shown in the legend
 * but not rendered as arcs.
 */
export function StatChart({ stats }: StatChartProps): JSX.Element {
  const slices = useMemo<ChartSlice[]>(
    () => [
      { label: 'Completed', value: stats.completed, color: STATUS_COLORS.completed, status: 'completed' },
      { label: 'Scheduled', value: stats.scheduled, color: STATUS_COLORS.scheduled, status: 'scheduled' },
      { label: 'Live', value: stats.live, color: STATUS_COLORS.live, status: 'live' },
      { label: 'Draft', value: stats.draft, color: STATUS_COLORS.draft, status: 'draft' },
      { label: 'Cancelled', value: stats.cancelled, color: STATUS_COLORS.cancelled, status: 'cancelled' },
    ],
    [stats],
  );

  return (
    <div className="qa-stat-chart">
      <h3 className="qa-stat-chart__title">Quiz Status Distribution</h3>
      <DonutChart
        data={slices}
        centerValue={String(stats.total)}
        centerLabel="Total"
      />
    </div>
  );
}
