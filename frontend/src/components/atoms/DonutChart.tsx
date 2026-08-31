import { useMemo } from 'react';
import type { ChartSlice } from '@/interfaces/quiz';
import './DonutChart.scss';

export interface DonutChartProps {
  data: ChartSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * DonutChart atom — a pure-SVG donut/pie chart with a legend.
 * No external charting library; keeps the bundle lean and types strict.
 * Slices with value 0 are not rendered as arcs.
 */
export function DonutChart({
  data,
  size = 180,
  thickness = 28,
  centerLabel,
  centerValue,
}: DonutChartProps): JSX.Element {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Build cumulative offsets for each slice.
  const slices = useMemo(() => {
    let offset = 0;
    return data
      .filter((d) => d.value > 0)
      .map((d) => {
        const fraction = total > 0 ? d.value / total : 0;
        const dash = fraction * circumference;
        const slice = {
          ...d,
          dash,
          gap: circumference - dash,
          offset: -offset,
        };
        offset += dash;
        return slice;
      });
  }, [data, total, circumference]);

  return (
    <div className="qa-donut">
      <svg
        className="qa-donut__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Quiz status distribution"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="qa-donut__track"
        />
        {slices.map((s) => (
          <circle
            key={s.status}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${center} ${center})`}
            className="qa-donut__slice"
          >
            <title>
              {s.label}: {s.value}
            </title>
          </circle>
        ))}
        {(centerValue || centerLabel) && (
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            className="qa-donut__center-value"
          >
            {centerValue ?? String(total)}
          </text>
        )}
        {centerLabel && (
          <text
            x={center}
            y={center + 16}
            textAnchor="middle"
            dominantBaseline="middle"
            className="qa-donut__center-label"
          >
            {centerLabel}
          </text>
        )}
      </svg>
      <ul className="qa-donut__legend">
        {data.map((d) => (
          <li key={d.status} className="qa-donut__legend-item">
            <span
              className="qa-donut__legend-dot"
              style={{ backgroundColor: d.color }}
              aria-hidden="true"
            />
            <span className="qa-donut__legend-label">{d.label}</span>
            <span className="qa-donut__legend-value">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
