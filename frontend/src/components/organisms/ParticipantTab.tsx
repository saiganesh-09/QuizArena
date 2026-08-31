import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Modal } from '@/components/atoms/Modal';
import { CSVUpload } from '@/components/molecules/CSVUpload';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import {
  useListMyParticipantsQuery,
  useAddMyParticipantMutation,
  useRemoveMyParticipantMutation,
  useBulkUploadParticipantsMutation,
} from '@/store/api/instructorApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import { isValidEmail } from '@/utils/validation';
import { formatDate } from '@/utils/date';
import type { Participant } from '@/types/quiz';
import './ParticipantTab.scss';

export interface ParticipantTabProps {
  quizId: string;
  /** Whether participants can be added/removed (Draft or Scheduled). */
  isEditable: boolean;
  /** Whether removal is allowed (before Live). */
  canRemove: boolean;
}

/**
 * ParticipantTab organism — the Participants tab of the update-quiz
 * workspace. Supports manual email add, CSV bulk import, and a
 * confirmation-backed Remove button.
 */
export function ParticipantTab({ quizId, isEditable, canRemove }: ParticipantTabProps): JSX.Element {
  const { showToast } = useToast();
  const { data: participants = [], isFetching } = useListMyParticipantsQuery(quizId);
  const [addParticipant] = useAddMyParticipantMutation();
  const [removeParticipant] = useRemoveMyParticipantMutation();
  const [bulkUpload] = useBulkUploadParticipantsMutation();

  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);

  const [csvOpen, setCsvOpen] = useState<boolean>(false);
  const [csvResult, setCsvResult] = useState<{ inserted: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const [csvLoading, setCsvLoading] = useState<boolean>(false);

  const [removeTarget, setRemoveTarget] = useState<Participant | null>(null);
  const [removing, setRemoving] = useState<boolean>(false);

  async function handleAdd(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setEmailError(null);
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid candidate email');
      return;
    }
    setAdding(true);
    try {
      const result = await addParticipant({ quizId, values: { email } }).unwrap();
      if (result.alreadyAssigned) {
        showToast('info', 'This participant is already assigned');
      } else {
        showToast('success', 'Participant added');
      }
      setEmail('');
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleCsvUpload(file: File): Promise<void> {
    setCsvLoading(true);
    try {
      const result = await bulkUpload({ quizId, file }).unwrap();
      setCsvResult({ inserted: result.inserted, skipped: result.skipped, errors: result.errors });
      if (result.errors.length === 0) {
        showToast('success', `${result.inserted} participants imported (${result.skipped} skipped)`);
      }
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setCsvLoading(false);
    }
  }

  async function confirmRemove(): Promise<void> {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeParticipant({ quizId, participantId: removeTarget.id }).unwrap();
      showToast('success', 'Participant removed');
      setRemoveTarget(null);
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="qa-participant-tab">
      <div className="qa-participant-tab__toolbar">
        <h3 className="qa-participant-tab__heading">Participants ({participants.length})</h3>
        {isEditable ? (
          <Button variant="secondary" onClick={() => setCsvOpen(true)}>Import CSV</Button>
        ) : null}
      </div>

      {isEditable ? (
        <form className="qa-participant-tab__add-form" onSubmit={handleAdd}>
          <Input
            type="email"
            name="email"
            placeholder="candidate@example.com"
            value={email}
            error={emailError ?? undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
          />
          <Button type="submit" variant="primary" isLoading={adding}>Add Participant</Button>
        </form>
      ) : null}

      {isFetching ? (
        <div className="qa-participant-tab__loading">Loading participants…</div>
      ) : participants.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No participants yet"
          message={isEditable ? 'Add participants by email or import them via CSV.' : 'No participants have been assigned to this quiz.'}
        />
      ) : (
        <div className="qa-participant-tab__scroll">
          <table className="qa-participant-tab__table">
            <thead>
              <tr>
                <th className="qa-participant-tab__th">Name</th>
                <th className="qa-participant-tab__th">Email</th>
                <th className="qa-participant-tab__th">Added</th>
                {canRemove ? <th className="qa-participant-tab__th qa-participant-tab__th--right">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="qa-participant-tab__tr">
                  <td className="qa-participant-tab__td qa-participant-tab__td--name">{p.name}</td>
                  <td className="qa-participant-tab__td qa-participant-tab__td--email">{p.email}</td>
                  <td className="qa-participant-tab__td">{formatDate(p.addedAt)}</td>
                  {canRemove ? (
                    <td className="qa-participant-tab__td qa-participant-tab__td--right">
                      <Button variant="danger" onClick={() => setRemoveTarget(p)}>Remove</Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV import modal */}
      <Modal
        open={csvOpen}
        title="Import Participants from CSV"
        onClose={() => { setCsvOpen(false); setCsvResult(null); }}
        footer={<Button variant="ghost" onClick={() => { setCsvOpen(false); setCsvResult(null); }}>Close</Button>}
      >
        <div className="qa-participant-tab__csv">
          <p className="qa-participant-tab__csv-help">
            CSV columns: <code>email</code>. Each email must belong to a registered candidate.
          </p>
          <CSVUpload onUpload={handleCsvUpload} isLoading={csvLoading} label="Choose CSV file" />
          {csvResult ? (
            <div className="qa-participant-tab__csv-result">
              {csvResult.errors.length > 0 ? (
                <div className="qa-participant-tab__csv-errors">
                  <p className="qa-participant-tab__csv-errors-title">
                    Upload rejected: {csvResult.errors.length} row error(s). No participants were imported.
                  </p>
                  <ul className="qa-participant-tab__csv-errors-list">
                    {csvResult.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="qa-participant-tab__csv-success">
                  Imported {csvResult.inserted} participant(s). Skipped {csvResult.skipped} duplicate(s).
                </p>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remove Participant"
        message={removeTarget ? `Are you sure you want to remove ${removeTarget.email} from this quiz?` : ''}
        confirmLabel="Remove"
        isLoading={removing}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
