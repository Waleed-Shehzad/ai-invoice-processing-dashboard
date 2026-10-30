'use client';

import { ArrowUpRight } from 'lucide-react';
import { Invoice, dateLabel, money, safeUrl } from '@/lib/invoices';
import { dueStatus } from '@/lib/invoice-filters';

type Props = { invoices: Invoice[]; loading: boolean; onSelect: (invoice: Invoice) => void; sort: string; today: number | null };

export function InvoiceTable({ invoices, loading, onSelect, sort, today }: Props) {
  return <div className="table-scroll" aria-busy={loading} role="region" aria-label="Saved invoices table" tabIndex={0}>
    <table><thead><tr>
      <th>Invoice number</th><th>Supplier</th>
      <th aria-sort={sort === 'newest' ? 'descending' : sort === 'oldest' ? 'ascending' : 'none'}>Invoice date</th>
      <th aria-sort={sort === 'due' ? 'ascending' : 'none'}>Due date</th>
      <th className="numeric">Total amount</th><th className="numeric">Unpaid balance</th><th>Actions</th>
    </tr></thead><tbody>{loading ? Array.from({length: 5}, (_, n) => <tr key={n} className="skeleton-row">{Array.from({length: 7}, (_, j) => <td key={j}><span/></td>)}</tr>) : invoices.map((i, n) => {
      const status = dueStatus(i, today);
      const pdf = safeUrl(i.source_file_url);
      return <tr key={`${i.row_number}-${n}`}>
        <td className="invoice-number">{i.invoice_number ?? '\u2014'}</td>
        <td className="supplier-name">{i.supplier_name ?? '\u2014'}</td>
        <td>{dateLabel(i.invoice_date)}</td>
        <td><span>{dateLabel(i.due_date)}</span><span className={`due-status ${status.tone}`}>{status.label}</span></td>
        <td className="numeric amount">{money(i.total_amount, i.currency)}{i.currency && i.total_amount !== null && <small>{i.currency}</small>}</td>
        <td className="numeric amount">{money(i.balance_due, i.currency)}{i.currency && i.balance_due !== null && <small>{i.currency}</small>}</td>
        <td><div className="row-actions"><button onClick={() => onSelect(i)}>View details</button>{pdf ? <a href={pdf} target="_blank" rel="noopener noreferrer">Open PDF<ArrowUpRight size={14} aria-hidden="true"/></a> : <span>PDF unavailable</span>}</div></td>
      </tr>;
    })}</tbody></table>
  </div>;
}
