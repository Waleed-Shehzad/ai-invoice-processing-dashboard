import type { Invoice } from './invoices';

export type QuickFilter = 'all' | 'unpaid' | 'due' | 'overdue';
export const quickFilters: { value: QuickFilter; label: string }[] = [
  { value: 'all', label: 'All invoices' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'due', label: 'Due in 7 days' },
  { value: 'overdue', label: 'Overdue' },
];

// Calendar-day arithmetic avoids both the browser's timezone and time-of-day drift.
export function calendarDay(value: string | null): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== value) return null;
  return date.valueOf() / 86_400_000;
}

export function karachiDay(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return calendarDay(`${get('year')}-${get('month')}-${get('day')}`)!;
}

export function isUnpaid(invoice: Invoice): boolean {
  return invoice.balance_due !== null && Number.isFinite(invoice.balance_due) && invoice.balance_due > 0;
}

export function matchesQuickFilter(invoice: Invoice, filter: QuickFilter, today: number | null): boolean {
  if (filter === 'all') return true;
  if (!isUnpaid(invoice)) return false;
  if (filter === 'unpaid') return true;
  const due = calendarDay(invoice.due_date);
  if (due === null || today === null) return false;
  return filter === 'overdue' ? due < today : due >= today && due <= today + 7;
}

export function dueStatus(invoice: Invoice, today: number | null): { label: string; tone: 'neutral' | 'warning' | 'danger' } {
  if (invoice.balance_due === null || !Number.isFinite(invoice.balance_due)) return { label: 'Payment unknown', tone: 'neutral' };
  if (invoice.balance_due <= 0) return { label: invoice.balance_due < 0 ? 'Credit balance' : 'No balance due', tone: 'neutral' };
  const due = calendarDay(invoice.due_date);
  if (due === null || today === null) return { label: 'Unpaid', tone: 'neutral' };
  const days = due - today;
  if (days < 0) return { label: `${-days} ${days === -1 ? 'day' : 'days'} overdue`, tone: 'danger' };
  if (days === 0) return { label: 'Due today', tone: 'warning' };
  if (days <= 7) return { label: `Due in ${days} ${days === 1 ? 'day' : 'days'}`, tone: 'warning' };
  return { label: 'Unpaid', tone: 'neutral' };
}
