import { Readable } from 'stream';
import csvParser from 'csv-parser';

/**
 * CSV parsing utility. Reads a CSV buffer and returns an array of row
 * objects keyed by header name. Throws on malformed CSV.
 */
export async function parseCsvBuffer(buffer: Buffer): Promise<Record<string, string>[]> {
  return new Promise<Record<string, string>[]>((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csvParser())
      .on('data', (row: Record<string, string>) => {
        // Trim all keys and values for consistent processing.
        const cleaned: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          cleaned[key.trim()] = typeof value === 'string' ? value.trim() : value;
        }
        rows.push(cleaned);
      })
      .on('error', (err: Error) => {
        reject(err);
      })
      .on('end', () => {
        resolve(rows);
      });
  });
}
