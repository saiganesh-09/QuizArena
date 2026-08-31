import './Pagination.scss';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination atom — shows prev/next and a compact page range with
 * ellipses for large page counts. Displays the total item count.
 */
export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationProps): JSX.Element {
  if (totalPages <= 1) {
    return (
      <div className="qa-pagination">
        <span className="qa-pagination__count">{total} item{total === 1 ? '' : 's'}</span>
      </div>
    );
  }

  const pages = buildPageRange(page, totalPages);

  const go = (p: number): void => {
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  return (
    <div className="qa-pagination">
      <span className="qa-pagination__count">
        {total} item{total === 1 ? '' : 's'}
      </span>
      <nav className="qa-pagination__nav" aria-label="Pagination">
        <button
          type="button"
          className="qa-pagination__btn"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p, idx) =>
          p === '…' ? (
            <span key={`gap-${idx}`} className="qa-pagination__gap">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`qa-pagination__btn${p === page ? ' qa-pagination__btn--active' : ''}`}
              onClick={() => go(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className="qa-pagination__btn"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </nav>
    </div>
  );
}

/** Build a compact page range with leading/trailing ellipses. */
function buildPageRange(current: number, total: number): Array<number | '…'> {
  const range: Array<number | '…'> = [];
  const window = 1; // pages on each side of current

  if (total <= 7) {
    for (let i = 1; i <= total; i++) range.push(i);
    return range;
  }

  range.push(1);
  const start = Math.max(2, current - window);
  const end = Math.min(total - 1, current + window);

  if (start > 2) range.push('…');
  for (let i = start; i <= end; i++) range.push(i);
  if (end < total - 1) range.push('…');
  range.push(total);

  return range;
}
