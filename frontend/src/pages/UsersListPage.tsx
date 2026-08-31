import { useState, useCallback } from 'react';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Pagination } from '@/components/atoms/Pagination';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Badge } from '@/components/atoms/Badge';
import { useListUsersQuery } from '@/store/api/adminApi';
import { formatDate } from '@/utils/date';
import type { UserRole, AccountStatus } from '@/types/auth';
import './UsersListPage.scss';

/** Map a role to a badge tone. */
function roleTone(role: UserRole): 'neutral' | 'info' | 'success' {
  if (role === 'admin') return 'info';
  if (role === 'instructor') return 'success';
  return 'neutral';
}

/** Map an account status to a quiz-status for reuse of the Badge atom. */
function statusToBadge(status: AccountStatus): JSX.Element {
  // Reuse Badge by mapping to a compatible status string.
  const tone = status === 'active' ? 'live' : 'cancelled';
  return <Badge status={tone} />;
}

/**
 * Users List page — admin user management with search, pagination,
 * and the user-count statistics returned in the same payload.
 */
export function UsersListPage(): JSX.Element {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const limit = 10;

  const { data, isLoading, isFetching } = useListUsersQuery({ page, limit, search });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const stats = data?.stats;
  const hasSearch = search.trim().length > 0;

  return (
    <div className="qa-users-list-page">
      <div className="qa-users-list-page__header">
        <h1 className="qa-users-list-page__heading">Users</h1>
        <p className="qa-users-list-page__subheading">
          View and search platform users.
        </p>
      </div>

      {stats ? (
        <section className="qa-users-list-page__stats">
          <div className="qa-users-list-page__stat">
            <span className="qa-users-list-page__stat-value">{stats.total}</span>
            <span className="qa-users-list-page__stat-label">Total</span>
          </div>
          <div className="qa-users-list-page__stat">
            <span className="qa-users-list-page__stat-value">{stats.byRole.admin}</span>
            <span className="qa-users-list-page__stat-label">Admins</span>
          </div>
          <div className="qa-users-list-page__stat">
            <span className="qa-users-list-page__stat-value">{stats.byRole.instructor}</span>
            <span className="qa-users-list-page__stat-label">Instructors</span>
          </div>
          <div className="qa-users-list-page__stat">
            <span className="qa-users-list-page__stat-value">{stats.byRole.candidate}</span>
            <span className="qa-users-list-page__stat-label">Candidates</span>
          </div>
        </section>
      ) : null}

      <div className="qa-users-list-page__toolbar">
        <SearchBar value={search} onChange={handleSearchChange} placeholder="Search by name or email…" />
      </div>

      {isLoading || isFetching ? (
        <div className="qa-users-list-page__loading">Loading users…</div>
      ) : users.length === 0 && !hasSearch ? (
        <EmptyState icon="👥" title="No users yet" message="Users will appear here once they sign up." />
      ) : users.length === 0 && hasSearch ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          message={`No users match "${search}". Try a different search.`}
          action={null}
        />
      ) : (
        <>
          <div className="qa-users-list-page__scroll">
            <table className="qa-users-list-page__table">
              <thead>
                <tr>
                  <th className="qa-users-list-page__th">Name</th>
                  <th className="qa-users-list-page__th">Email</th>
                  <th className="qa-users-list-page__th">Role</th>
                  <th className="qa-users-list-page__th">Status</th>
                  <th className="qa-users-list-page__th">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="qa-users-list-page__tr">
                    <td className="qa-users-list-page__td qa-users-list-page__td--name">{u.name}</td>
                    <td className="qa-users-list-page__td qa-users-list-page__td--email">{u.email}</td>
                    <td className="qa-users-list-page__td">
                      <span className={`qa-users-list-page__role qa-users-list-page__role--${roleTone(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="qa-users-list-page__td">{statusToBadge(u.status)}</td>
                    <td className="qa-users-list-page__td">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
