import { useGetCandidateLeaderboardQuery } from '@/store/api/candidateApi';
import { EmptyState } from '@/components/atoms/EmptyState';
import './CandidateLeaderboardPage.scss';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * CandidateLeaderboardPage — all students ranked by average score across
 * submitted quizzes and homework. The caller's own row is highlighted.
 */
export function CandidateLeaderboardPage(): JSX.Element {
  const { data, isLoading } = useGetCandidateLeaderboardQuery();
  const rows = data ?? [];
  const me = rows.find((r) => r.isSelf);

  return (
    <div className="qa-leaderboard">
      <div className="qa-leaderboard__header">
        <h1 className="qa-leaderboard__heading">Leaderboard</h1>
        <p className="qa-leaderboard__subheading">
          Students ranked by average score across all submitted work.
        </p>
      </div>

      {me ? (
        <div className="qa-leaderboard__me">
          <span className="qa-leaderboard__me-rank">#{me.rank}</span>
          <span className="qa-leaderboard__me-text">
            Your position · avg {me.averagePercentage}% · best {me.bestPercentage}% · {me.quizzesTaken} submitted
          </span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="qa-leaderboard__loading">Loading leaderboard…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No scores yet"
          message="The leaderboard fills in once students start submitting quizzes and homework."
        />
      ) : (
        <div className="qa-leaderboard__card">
          <table className="qa-leaderboard__table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Quizzes taken</th>
                <th>Best score</th>
                <th>Avg score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.candidateName + r.rank}
                  className={r.isSelf ? 'qa-leaderboard__row--self' : ''}
                >
                  <td className="qa-leaderboard__td-rank">
                    {r.rank <= 3 ? MEDALS[r.rank - 1] : `#${r.rank}`}
                  </td>
                  <td className="qa-leaderboard__td-name">
                    {r.candidateName}
                    {r.isSelf ? <span className="qa-leaderboard__you">You</span> : null}
                  </td>
                  <td>{r.quizzesTaken}</td>
                  <td>{r.bestPercentage}%</td>
                  <td>
                    <div className="qa-leaderboard__avg">
                      <span className="qa-leaderboard__avg-track">
                        <span
                          className="qa-leaderboard__avg-bar"
                          style={{ width: `${Math.max(r.averagePercentage, 3)}%` }}
                        />
                      </span>
                      <span className="qa-leaderboard__avg-pct">{r.averagePercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
