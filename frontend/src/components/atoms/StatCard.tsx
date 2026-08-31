import type { ReactNode } from 'react';
import './StatCard.scss';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

/** StatCard atom — a single metric tile for the admin dashboard. */
export function StatCard({ label, value, icon, tone = 'neutral' }: StatCardProps): JSX.Element {
  return (
    <div className={`qa-stat-card qa-stat-card--${tone}`}>
      {icon ? <div className="qa-stat-card__icon">{icon}</div> : null}
      <div className="qa-stat-card__body">
        <span className="qa-stat-card__value">{value}</span>
        <span className="qa-stat-card__label">{label}</span>
      </div>
    </div>
  );
}
