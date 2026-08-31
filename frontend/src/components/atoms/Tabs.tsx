import type { ReactNode } from 'react';
import './Tabs.scss';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Tabs atom — a simple accessible tab switcher (no panel rendering;
 * the parent controls which content to show based on `active`).
 */
export function Tabs({ tabs, active, onChange }: TabsProps): JSX.Element {
  return (
    <div className="qa-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          className={`qa-tabs__tab${tab.id === active ? ' qa-tabs__tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon ? <span className="qa-tabs__icon">{tab.icon}</span> : null}
          <span className="qa-tabs__label">{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 ? (
            <span className="qa-tabs__badge">{tab.badge}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
