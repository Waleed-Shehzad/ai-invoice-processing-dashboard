'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, ChevronRight, Database, FileText, FolderOpen, Layers3, LayoutDashboard, RefreshCw, Search, Workflow, X, AlertCircle, ScanText, ShieldCheck, Mail, Clock3, Building2, Wallet, Receipt, ArrowRight } from 'lucide-react';
import { Invoice, csv, dateLabel, money, safeUrl, timestamp } from '@/lib/invoices';
import { calendarDay, dueStatus, karachiDay, matchesQuickFilter, quickFilters, QuickFilter } from '@/lib/invoice-filters';
import { InvoiceTable } from '@/components/invoice-table';
import { demoInvoices } from '@/lib/demo';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Dashboard() {
 const [mode,setMode]=useState<'demo'|'live'>('demo'),[invoices,setInvoices]=useState<Invoice[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[fetched,setFetched]=useState<string|null>(null),[query,setQuery]=useState(''),[currency,setCurrency]=useState('all'),[sort,setSort]=useState('newest'),[selected,setSelected]=useState<Invoice|null>(null);
 const request=useRef(0), closeRef=useRef<HTMLButtonElement>(null),dialogRef=useRef<HTMLElement>(null);
 const fetchInvoices=useCallback(async()=>{const id=++request.current;setLoading(true);setError('');try{let data:Invoice[],time:string;if(mode==='demo'){await new Promise(r=>setTimeout(r,450));data=demoInvoices;time=new Date().toISOString();}else{const response=await fetch('/api/invoices',{cache:'no-store'});const result=await response.json();if(!response.ok)throw new Error(result.error || 'Unable to load invoices.');data=result.invoices;time=result.fetched_at;}if(id===request.current){setInvoices(data);setFetched(time);}}catch(e){if(id===request.current)setError(e instanceof Error?e.message:'Unable to load invoices.');}finally{if(id===request.current)setLoading(false);}},[mode]);
 useEffect(()=>{const timer=setTimeout(()=>{setInvoices([]);setFetched(null);setSelected(null);setCurrency('all');setQuery('');void fetchInvoices()},0);const invalidate=()=>{request.current++};return()=>{clearTimeout(timer);invalidate()}},[fetchInvoices]);
 useEffect(()=>{if(!selected)return;const previous=document.activeElement as HTMLElement;closeRef.current?.focus();const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')setSelected(null);if(e.key==='Tab'){const nodes=dialogRef.current?.querySelectorAll<HTMLElement>('button,a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',handler);const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',handler);document.body.style.overflow=old;previous?.focus()}},[selected]);

 const [view, setView] = useState<'overview' | 'automation'>('overview');
 const [quick, setQuick] = useState<QuickFilter>('all');
 const [today, setToday] = useState<number | null>(null);
 const headingRef = useRef<HTMLHeadingElement>(null);
 useEffect(() => {
   const syncView = () => {
     setView(window.location.hash === '#automation' ? 'automation' : 'overview');
     window.scrollTo(0, 0);
     requestAnimationFrame(() => headingRef.current?.focus({preventScroll: true}));
   };
   const timer = setTimeout(syncView, 0);
   window.addEventListener('hashchange', syncView);
   return () => { clearTimeout(timer); window.removeEventListener('hashchange', syncView); };
 }, []);
 useEffect(() => {
   const update = () => setToday(karachiDay(new Date()));
   const timer = setTimeout(update, 0);
   const interval = setInterval(update, 30_000);
   return () => { clearTimeout(timer); clearInterval(interval); };
 }, []);
 const currencies = useMemo(() => Array.from(new Set(invoices.map(i => i.currency ?? 'Unknown'))).sort(), [invoices]);
 const matching = useMemo(() => invoices.filter(i =>
   (currency === 'all' || (i.currency ?? 'Unknown') === currency) &&
   `${i.invoice_number ?? ''} ${i.supplier_name ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
 ), [invoices, currency, query]);
 const filtered = useMemo(() => matching.filter(i => matchesQuickFilter(i, quick, today)).sort((a, b) => {
   const key = sort === 'due' ? 'due_date' : 'invoice_date';
   const av = calendarDay(a[key]), bv = calendarDay(b[key]);
   if (av === null) return bv === null ? 0 : 1;
   if (bv === null) return -1;
   return sort === 'newest' ? bv - av : av - bv;
 }), [matching, quick, today, sort]);
 const suppliers = new Set(filtered.map(i => i.supplier_name?.trim().toLowerCase()).filter(Boolean)).size;
 const totals = currencies.flatMap(currency => {
   const rows = filtered.filter(i => (i.currency ?? 'Unknown') === currency);
   if (!rows.length) return [];
   return [{ currency, count: rows.length,
     total: rows.reduce((sum, i) => sum + (i.total_amount ?? 0), 0),
     balance: rows.reduce((sum, i) => sum + (i.balance_due ?? 0), 0),
     totalCount: rows.filter(i => i.total_amount !== null).length,
     balanceCount: rows.filter(i => i.balance_due !== null).length }];
 });
 const initial = loading && !fetched;
 const unavailable = initial || (!fetched && !!error);
 const activeFilters = !!query.trim() || currency !== 'all' || quick !== 'all';
 const uploadUrl = safeUrl(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL ?? null);
 const recent = filtered.filter(i => i.processed_at && Number.isFinite(Date.parse(i.processed_at))).sort((a, b) => Date.parse(b.processed_at!) - Date.parse(a.processed_at!));
 const steps = [
   {icon: FolderOpen, label: 'PDF added to Google Drive', description: 'A PDF is added to the designated invoice folder.'},
   {icon: ScanText, label: 'Details extracted', description: 'Invoice and supplier details are extracted from the document.'},
   {icon: ShieldCheck, label: 'Duplicate checked', description: 'The workflow checks for an existing invoice before saving.'},
   {icon: Database, label: 'Saved to Google Sheets', description: 'Structured billing records are saved to the invoice sheet.'},
   {icon: Mail, label: 'Billing team notified', description: 'The workflow includes a notification to the billing team.'},
 ];
 const groups = [
   {title: 'Invoice information', values: [['Invoice number', selected?.invoice_number], ['Invoice date', dateLabel(selected?.invoice_date ?? null)], ['Due date', dateLabel(selected?.due_date ?? null)], ['Payment / due status', selected ? dueStatus(selected, today).label : null]]},
   {title: 'Supplier information', values: [['Supplier', selected?.supplier_name], ['Email', selected?.supplier_email], ['Address', selected?.supplier_address]]},
   {title: 'Amounts', values: [['Currency', selected?.currency], ['Invoice value', money(selected?.total_amount ?? null, selected?.currency ?? null)], ['Amount paid', money(selected?.amount_paid ?? null, selected?.currency ?? null)], ['Unpaid balance', money(selected?.balance_due ?? null, selected?.currency ?? null)], ['Balance source', selected?.balance_calculated ? 'Calculated: total amount \u2212 amount paid' : selected?.balance_due == null ? 'Unavailable' : 'Provided by source']]},
   {title: 'Source document', values: [['Source URL', selected?.source_file_url], ['Saved at', timestamp(selected?.processed_at ?? null)], ['Sheet row', selected?.row_number]]},
 ];
 function resetFilters() { setQuery(''); setCurrency('all'); setQuick('all'); }
 function switchMode(value: 'demo' | 'live') {
   request.current++; setInvoices([]); setFetched(null); setSelected(null); setError(''); setLoading(true); setQuick('all'); setMode(value);
 }
 function exportCsv() {
   const url = URL.createObjectURL(new Blob([csv(filtered)], {type: 'text/csv;charset=utf-8;'}));
   const a = document.createElement('a'); a.href = url;
   a.download = `invoices-${mode}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
   setTimeout(() => URL.revokeObjectURL(url), 1000);
 }
 return <div className="app-shell">
   <a href="#workspace" className="skip-link">Skip to main content</a>
   <aside className="sidebar">
     <a className="brand" href="#overview"><span className="brand-icon"><Layers3 size={22} aria-hidden="true"/></span><span>Invoice<span className="brand-sub">Operations workspace</span></span></a>
     <div className="workspace-label">Workspace</div>
     <nav aria-label="Main navigation">
       <a href="#overview" aria-current={view === 'overview' ? 'page' : undefined}><LayoutDashboard size={19} aria-hidden="true"/>Overview</a>
       <a href="#automation" aria-current={view === 'automation' ? 'page' : undefined}><Workflow size={19} aria-hidden="true"/>Automation</a>
     </nav>
     <div className="sidebar-footer"><span className="monogram">W</span><div><span>Built by</span><strong>Waleed | AI-Automation</strong></div></div>
   </aside>
   <div className="main-shell">
     <header className="topbar"><div className="breadcrumb">Workspace<ChevronRight size={15} aria-hidden="true"/><strong>{view === 'overview' ? 'Overview' : 'Automation'}</strong></div><div className="topbar-controls"><label className="mode-control"><span>Data source</span><select aria-label="Data source" value={mode} onChange={e => switchMode(e.target.value as 'demo' | 'live')}><option value="demo">Demo data</option><option value="live">Live data</option></select></label><ThemeToggle/></div></header>
     <main id="workspace">
       <div className="page-heading"><div><h1 ref={headingRef} tabIndex={-1}>AI Invoice Processing</h1><p>{view === 'overview' ? 'Your invoices, organised. Review billing records and see what needs attention.' : 'From invoice PDF to structured billing records.'}</p></div><div className="header-actions">{view === 'overview' && <a className="how-link" href="#automation">How it works<ArrowRight size={16} aria-hidden="true"/></a>}{uploadUrl && <a className="button primary" href={uploadUrl} target="_blank" rel="noopener noreferrer"><FolderOpen size={17} aria-hidden="true"/>Open upload folder<ArrowUpRight size={15} aria-hidden="true"/></a>}</div></div>
       {view === 'overview' ? <>
         <div className="update-line" role="status">{fetched ? `Last updated ${timestamp(fetched)}` : loading ? 'Loading invoices...' : 'No successful refresh yet'}</div>
         {error && <div className="error-state" role="alert"><AlertCircle size={21} aria-hidden="true"/><div><strong>Unable to refresh invoices</strong><p>{error.startsWith('Live connection is not configured') ? 'The live connection is not configured. See Automation for setup details.' : error}</p>{fetched && <p>Showing the last successful refresh. These records may be out of date.</p>}<button className="button secondary" onClick={fetchInvoices} disabled={loading}>Try again</button></div></div>}
         <section className="summary-row" aria-label="Invoice summary">
           <article className="summary-card"><div className="summary-label"><span>Invoices</span><Receipt size={19} aria-hidden="true"/></div><strong className="metric">{unavailable ? '\u2014' : filtered.length}</strong><small>{activeFilters ? 'Matching current filters' : 'Saved billing records'}</small></article>
           <article className="summary-card"><div className="summary-label"><span>Suppliers</span><Building2 size={19} aria-hidden="true"/></div><strong className="metric">{unavailable ? '\u2014' : suppliers}</strong><small>Unique named suppliers</small></article>
           {(['total', 'balance'] as const).map(kind => <article className="summary-card" key={kind}><div className="summary-label"><span>{kind === 'total' ? 'Invoice value' : 'Unpaid balance'}</span><Wallet size={19} aria-hidden="true"/></div>{unavailable || !totals.length ? <strong className="metric">&mdash;</strong> : totals.map(t => {
             const count = kind === 'total' ? t.totalCount : t.balanceCount;
             return <div className="currency-value" key={t.currency}><span>{t.currency === 'Unknown' ? 'Unknown currency' : t.currency}</span><strong>{money(count ? t[kind] : null, t.currency === 'Unknown' ? null : t.currency)}</strong>{count < t.count && <small>Partial total: {count} of {t.count} values known</small>}</div>;
           })}</article>)}
         </section>
         <section className="ledger panel" id="invoices" aria-labelledby="ledger-title">
           <div className="ledger-heading"><h2 id="ledger-title">Invoices <span className="count-badge">{filtered.length}</span></h2>{activeFilters && <button className="text-button" onClick={resetFilters}>Reset filters<X size={14} aria-hidden="true"/></button>}</div>
           <div className="quick-filters" role="group" aria-label="Invoice status filters">{quickFilters.map(f => <button key={f.value} aria-pressed={quick === f.value} onClick={() => setQuick(f.value)}>{f.label}<span>{matching.filter(i => matchesQuickFilter(i, f.value, today)).length}</span></button>)}</div>
           <div className="filters">
             <label className="search-field"><span>Search invoices</span><div className="search-box"><Search size={18} aria-hidden="true"/><input placeholder="Supplier or invoice number" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={16} aria-hidden="true"/></button>}</div></label>
             <label><span>Currency</span><select value={currency} onChange={e => setCurrency(e.target.value)}><option value="all">All currencies</option>{currencies.map(c => <option key={c}>{c}</option>)}</select></label>
             <label><span>Sort by date</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest invoice</option><option value="oldest">Oldest invoice</option><option value="due">Earliest due date</option></select></label>
             <button className="button secondary" onClick={fetchInvoices} disabled={loading}><RefreshCw size={17} aria-hidden="true" className={loading ? 'spin' : ''}/>{loading ? 'Refreshing...' : 'Refresh'}</button>
             <button className="button primary" onClick={exportCsv} disabled={!filtered.length || loading}><ArrowDownToLine size={17} aria-hidden="true"/>Export CSV</button>
           </div>
           <p className="mobile-table-hint">Scroll across to view amounts and invoice actions.</p>
           <InvoiceTable invoices={filtered} loading={initial} onSelect={setSelected} sort={sort} today={today}/>
           {!loading && !filtered.length && <div className="empty-state"><span className="empty-icon"><FileText size={25} aria-hidden="true"/></span><h3>{error && !fetched ? 'Invoices could not be loaded' : activeFilters ? 'No invoices match these filters' : 'No saved invoices yet'}</h3><p>{error && !fetched ? 'Check the connection and try refreshing again.' : activeFilters ? 'Try another supplier, currency or invoice status.' : 'Invoices will appear here once your automation saves them.'}</p>{activeFilters && <button className="button secondary" onClick={resetFilters}>Reset filters</button>}</div>}
           <div className="table-footer"><span aria-live="polite" aria-atomic="true">{initial ? 'Loading invoices...' : `Showing ${filtered.length} of ${invoices.length} invoices`}</span><span>{activeFilters ? 'Summary and CSV match these filters' : 'All saved invoices'}</span></div>
         </section>
         <section className="panel activity" aria-labelledby="recent-title"><div className="section-heading"><div><h2 id="recent-title">Recently saved invoices</h2><p>Latest records in your current view.</p></div><Clock3 size={19} aria-hidden="true"/></div>{initial ? <p className="insight-empty">Loading recent invoices...</p> : recent.length ? <ul>{recent.slice(0, 3).map((i, n) => <li key={n}><span className="activity-icon"><FileText size={19} aria-hidden="true"/></span><div><button className="text-button" onClick={() => setSelected(i)}>{i.invoice_number ?? 'Invoice number unavailable'}</button><span>{i.supplier_name ?? 'Supplier unavailable'}</span></div><time dateTime={i.processed_at!}>{timestamp(i.processed_at)}</time><strong>{money(i.total_amount, i.currency)}{i.currency && <small>{i.currency}</small>}</strong></li>)}</ul> : <p className="insight-empty">{error && !fetched ? 'Recent activity is unavailable until records can be loaded.' : 'No saved timestamps are available for these records.'}</p>}</section>
       </> : <div className="automation-view" id="automation-content">
         <section className="workflow panel"><div className="section-heading"><div><h2>How the automation works</h2><p>A connected workflow powered by n8n.</p></div><Workflow size={22} aria-hidden="true"/></div><ol>{steps.map(({icon: Icon, label, description}, n) => <li key={label}><span className="step-icon"><Icon size={21} aria-hidden="true"/></span><div><span className="step-number">Step {n + 1}</span><h3>{label}</h3><p>{description}</p></div></li>)}</ol><div className="automation-note"><ShieldCheck size={19} aria-hidden="true"/><p>This is a workflow explanation. The dashboard reads stored invoices only and does not report live execution, duplicate checks or notification delivery.</p></div></section>
         <div className="automation-side"><section className="panel integration-card"><FolderOpen size={22} aria-hidden="true"/><h2>Invoice upload folder</h2><p>Add an invoice PDF to your Google Drive folder to start the workflow.</p>{uploadUrl ? <a className="button primary" href={uploadUrl} target="_blank" rel="noopener noreferrer">Open upload folder<ArrowUpRight size={16} aria-hidden="true"/></a> : <div className="setup-note"><strong>Folder not configured</strong><p>Set <code>NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL</code> to your invoice folder URL, then restart or rebuild the dashboard.</p></div>}</section>
         <section className="panel integration-card"><Database size={22} aria-hidden="true"/><h2>Data connection</h2><p>{mode === 'demo' ? 'Demo mode uses fictional invoices. Switch to Live data to load your saved billing records.' : 'Live mode reads saved records from Google Sheets through the n8n server connection.'}</p><dl><div><dt>Records</dt><dd>Google Sheets</dd></div><div><dt>Workflow engine</dt><dd>n8n</dd></div><div><dt>Document storage</dt><dd>Google Drive</dd></div></dl>{error && <div className="setup-note"><strong>Connection needs attention</strong><p>{error}</p></div>}<p className="technical-note">The server proxy protects your n8n API key. Live failures are never replaced with demo records.</p><a className="text-button" href="#overview">Back to invoices<ArrowRight size={16} aria-hidden="true"/></a></section></div>
       </div>}
     </main>
   </div>
   {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="drawer" onClick={e => e.stopPropagation()}><header><span>Invoice details</span><div className="drawer-controls"><ThemeToggle/><button className="icon-button" ref={closeRef} aria-label="Close invoice details" onClick={() => setSelected(null)}><X size={21} aria-hidden="true"/></button></div></header><h2 id="drawer-title">{selected.invoice_number ?? 'Invoice'}</h2><p className="drawer-supplier">{selected.supplier_name ?? 'Supplier unavailable'}</p><div className="drawer-total"><span>Invoice value</span><strong>{money(selected.total_amount, selected.currency)}</strong><span>{selected.currency}</span></div>{groups.map(group => <section className="detail-group" key={group.title}><h3>{group.title}</h3><dl>{group.values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'Unavailable'}</dd></div>)}</dl></section>)}{safeUrl(selected.source_file_url) ? <a className="button primary source-link" href={safeUrl(selected.source_file_url)!} target="_blank" rel="noopener noreferrer">{mode === 'demo' ? 'Open PDF (demo example)' : 'Open original PDF'}<ArrowUpRight size={17} aria-hidden="true"/></a> : <p>Original PDF link unavailable</p>}</section></div>}
 </div>;
}
