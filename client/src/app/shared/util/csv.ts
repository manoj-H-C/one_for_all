/** Quotes a field only if it needs it (contains a comma, quote, or newline) - a plain value is left untouched rather than always wrapped. */
export function csvEscape(value: string): string {
  return /["\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Triggers a browser download of `content` as a .csv file named `filename`, via a throwaway object URL. */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
