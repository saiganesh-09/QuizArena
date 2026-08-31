import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import './CSVUpload.scss';

export interface CSVUploadProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
  accept?: string;
  label?: string;
}

/**
 * CSVUpload molecule — a file picker with drag-and-drop support.
 * Validates that the selected file is a .csv before calling onUpload.
 */
export function CSVUpload({
  onUpload,
  isLoading = false,
  accept = '.csv',
  label = 'Upload CSV',
}: CSVUploadProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File): void {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv') {
      setError('Please select a .csv file');
      return;
    }
    onUpload(file);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be selected again.
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setDragOver(false);
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="qa-csv-upload">
      <div
        className={`qa-csv-upload__dropzone${dragOver ? ' qa-csv-upload__dropzone--over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="qa-csv-upload__icon" aria-hidden="true">📄</span>
        <p className="qa-csv-upload__text">
          Drag &amp; drop a CSV file here, or
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="qa-csv-upload__input"
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          isLoading={isLoading}
        >
          {label}
        </Button>
      </div>
      {error ? <p className="qa-csv-upload__error" role="alert">{error}</p> : null}
    </div>
  );
}
