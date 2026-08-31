import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Modal } from '@/components/atoms/Modal';
import { CSVUpload } from '@/components/molecules/CSVUpload';
import { QuestionModal } from './QuestionModal';
import {
  useListMyQuestionsQuery,
  useAddMyQuestionMutation,
  useEditMyQuestionMutation,
  useDeleteMyQuestionMutation,
  useBulkUploadQuestionsMutation,
} from '@/store/api/instructorApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import type { Question } from '@/types/quiz';
import type { QuestionFormValues } from '@/interfaces/instructor';
import './QuestionTab.scss';

export interface QuestionTabProps {
  quizId: string;
  isEditable: boolean;
}

/**
 * QuestionTab organism — the Questions tab of the update-quiz workspace.
 * Shows the question list, supports manual add (modal), CSV bulk import
 * (modal with pre-import validation), and edit/delete per question.
 */
export function QuestionTab({ quizId, isEditable }: QuestionTabProps): JSX.Element {
  const { showToast } = useToast();
  const { data: questions = [], isFetching } = useListMyQuestionsQuery(quizId);
  const [addQuestion] = useAddMyQuestionMutation();
  const [editQuestion] = useEditMyQuestionMutation();
  const [deleteQuestion] = useDeleteMyQuestionMutation();
  const [bulkUpload] = useBulkUploadQuestionsMutation();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [csvOpen, setCsvOpen] = useState<boolean>(false);
  const [csvResult, setCsvResult] = useState<{ inserted: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const [csvLoading, setCsvLoading] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  function openAdd(): void {
    setEditingQuestion(null);
    setModalOpen(true);
  }

  function openEdit(q: Question): void {
    setEditingQuestion(q);
    setModalOpen(true);
  }

  async function handleCreate(qid: string, values: QuestionFormValues): Promise<void> {
    await addQuestion({ quizId: qid, values }).unwrap();
  }

  async function handleEdit(_qid: string, questionId: string, values: Partial<QuestionFormValues>): Promise<void> {
    await editQuestion({ quizId, questionId, values }).unwrap();
  }

  async function handleCsvUpload(file: File): Promise<void> {
    setCsvLoading(true);
    try {
      const result = await bulkUpload({ quizId, file }).unwrap();
      setCsvResult({ inserted: result.inserted, skipped: result.skipped, errors: result.errors });
      if (result.errors.length === 0) {
        showToast('success', `${result.inserted} questions imported`);
      }
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setCsvLoading(false);
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuestion({ quizId, questionId: deleteTarget.id }).unwrap();
      showToast('success', 'Question deleted');
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="qa-question-tab">
      <div className="qa-question-tab__toolbar">
        <h3 className="qa-question-tab__heading">Questions ({questions.length})</h3>
        {isEditable ? (
          <div className="qa-question-tab__actions">
            <Button variant="secondary" onClick={() => setCsvOpen(true)}>Import CSV</Button>
            <Button variant="primary" onClick={openAdd}>+ Add Question</Button>
          </div>
        ) : null}
      </div>

      {isFetching ? (
        <div className="qa-question-tab__loading">Loading questions…</div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon="❓"
          title="No questions yet"
          message={isEditable ? 'Add questions manually or import them via CSV.' : 'No questions have been added to this quiz.'}
          action={isEditable ? <Button variant="primary" onClick={openAdd}>+ Add Question</Button> : null}
        />
      ) : (
        <ul className="qa-question-tab__list">
          {questions.map((q, idx) => (
            <li key={q.id} className="qa-question-tab__item">
              <div className="qa-question-tab__item-main">
                <span className="qa-question-tab__item-number">Q{idx + 1}</span>
                <div className="qa-question-tab__item-body">
                  <p className="qa-question-tab__item-text">{q.text}</p>
                  <div className="qa-question-tab__item-meta">
                    <span className="qa-question-tab__item-type">{q.type}</span>
                    <span className="qa-question-tab__item-points">{q.points} pt</span>
                    <span className="qa-question-tab__item-options">{q.options.length} options</span>
                  </div>
                </div>
              </div>
              {isEditable ? (
                <div className="qa-question-tab__item-actions">
                  {quizId && q.id ? (
                    <>
                      <Button variant="ghost" onClick={() => openEdit(q)} disabled={!isEditable}>Edit</Button>
                      <Button variant="danger" onClick={() => setDeleteTarget(q)} disabled={!isEditable}>Delete</Button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <QuestionModal
        open={modalOpen}
        quizId={quizId}
        question={editingQuestion}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        onEdit={handleEdit}
      />

      {/* CSV import modal */}
      <Modal
        open={csvOpen}
        title="Import Questions from CSV"
        onClose={() => { setCsvOpen(false); setCsvResult(null); }}
        footer={
          <Button variant="ghost" onClick={() => { setCsvOpen(false); setCsvResult(null); }}>Close</Button>
        }
      >
        <div className="qa-question-tab__csv">
          <p className="qa-question-tab__csv-help">
            CSV columns: <code>type, text, option1, option2, option3, option4, option5, correctOptions, points</code>.
            <br />
            <code>type</code>: single-choice | multi-select | true-false.
            <br />
            <code>correctOptions</code>: pipe-separated option numbers (e.g. <code>1</code> or <code>1|3</code>).
          </p>
          <CSVUpload onUpload={handleCsvUpload} isLoading={csvLoading} label="Choose CSV file" />
          {csvResult ? (
            <div className="qa-question-tab__csv-result">
              {csvResult.errors.length > 0 ? (
                <div className="qa-question-tab__csv-errors">
                  <p className="qa-question-tab__csv-errors-title">
                    Upload rejected: {csvResult.errors.length} row error(s). No questions were imported.
                  </p>
                  <ul className="qa-question-tab__csv-errors-list">
                    {csvResult.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="qa-question-tab__csv-success">
                  Successfully imported {csvResult.inserted} question(s).
                </p>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Question"
        message={deleteTarget ? `Are you sure you want to delete this question? "${deleteTarget.text.slice(0, 60)}${deleteTarget.text.length > 60 ? '…' : ''}"` : ''}
        confirmLabel="Delete"
        isLoading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
