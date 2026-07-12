export interface ToolResponse<T> {
  result: T | null;
  isError: boolean;
  error: string | null;
  /** Present on successful mutating calls: path to the JSON backup written before the call. */
  backupPath?: string;
}
