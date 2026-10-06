import { useListMyStudentsQuery } from '@/store/api/instructorApi';
import { EmptyState } from '@/components/atoms/EmptyState';
import './InstructorStudentsPage.scss';

/**
 * InstructorStudentsPage — roster of every student assigned to the
 * teacher's quizzes/homework with submission stats.
 */
export function InstructorStudentsPage(): JSX.Element {
  const { data: students = [], isLoading } = useListMyStudentsQuery();

  return (
    <div className="qa-students-page">
      <div className="qa-students-page__header">
        <h1 className="qa-students-page__heading">Students</h1>
        <p className="qa-students-page__subheading">
          Everyone assigned to your quizzes and homework, with their submission stats.
        </p>
      </div>

      {isLoading ? (
        <div className="qa-students-page__loading">Loading students…</div>
      ) : students.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No students yet"
          message="Add participants to a quiz or homework and they'll appear here."
        />
      ) : (
        <div className="qa-students-page__card">
          <table className="qa-students-page__table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Assigned</th>
                <th>Submitted</th>
                <th>Avg score</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.candidateId}>
                  <td className="qa-students-page__name">{s.name}</td>
                  <td className="qa-students-page__email">{s.email}</td>
                  <td>{s.quizzesAssigned}</td>
                  <td>{s.submittedCount}</td>
                  <td>
                    {s.averagePercentage === null ? (
                      <span className="qa-students-page__na">—</span>
                    ) : (
                      <div className="qa-students-page__avg">
                        <span className="qa-students-page__avg-track">
                          <span
                            className={`qa-students-page__avg-bar qa-students-page__avg-bar--${
                              s.averagePercentage >= 80 ? 'high' : s.averagePercentage >= 50 ? 'mid' : 'low'
                            }`}
                            style={{ width: `${Math.max(s.averagePercentage, 3)}%` }}
                          />
                        </span>
                        <span className="qa-students-page__avg-pct">{s.averagePercentage}%</span>
                      </div>
                    )}
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
