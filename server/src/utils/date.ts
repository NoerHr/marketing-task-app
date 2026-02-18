export function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function toDateTimeStr(date: Date): string {
  return date.toISOString();
}

export function parseDateStr(dateStr: string): Date {
  const date = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return date;
}

export function isOverdue(endDate: Date, status: string): boolean {
  if (status === 'Approved' || status === 'Archived') return false;
  return new Date() > endDate;
}

export function daysOverdue(endDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - endDate.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function daysUntil(date: Date): number {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
