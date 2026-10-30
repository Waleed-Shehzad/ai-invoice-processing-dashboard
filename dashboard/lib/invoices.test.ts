import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeInvoice,numberValue,csv,dateLabel,safeUrl,timestamp} from './invoices';
import {calendarDay,dueStatus,karachiDay,matchesQuickFilter} from './invoice-filters';

test('due filters use Karachi calendar boundaries, including today and the seventh day',()=>{
 const today=karachiDay(new Date('2026-10-29T19:00:00Z'));
 assert.equal(today,calendarDay('2026-10-30'));
 assert.equal(karachiDay(new Date('2026-10-29T18:59:59Z')),calendarDay('2026-10-29'));
 for(const due of ['2026-10-30','2026-11-06']) assert.equal(matchesQuickFilter(normalizeInvoice({balance_due:1,due_date:due}),'due',today),true);
 for(const due of ['2026-10-29','2026-11-07',null,'2026-02-31','invalid']) assert.equal(matchesQuickFilter(normalizeInvoice({balance_due:1,due_date:due}),'due',today),false);
 assert.equal(matchesQuickFilter(normalizeInvoice({balance_due:1,due_date:'2026-10-29'}),'overdue',today),true);
 assert.equal(matchesQuickFilter(normalizeInvoice({balance_due:1,due_date:'2026-10-30'}),'overdue',today),false);
});

test('payment filters preserve unknown balances and exclude zero or credit balances',()=>{
 const today=calendarDay('2026-10-30');
 for(const balance of [null,'',0,-10,'invalid']) {
  const invoice=normalizeInvoice({balance_due:balance,total_amount:100,due_date:'2026-10-01'});
  for(const filter of ['unpaid','due','overdue'] as const) assert.equal(matchesQuickFilter(invoice,filter,today),false);
 }
 const calculated=normalizeInvoice({total_amount:100,amount_paid:0,due_date:'2026-10-30'});
 assert.equal(matchesQuickFilter(calculated,'unpaid',today),true);
 assert.equal(dueStatus(calculated,today).label,'Due today');
 assert.equal(dueStatus(normalizeInvoice({total_amount:100}),today).label,'Payment unknown');
 assert.equal(dueStatus(normalizeInvoice({balance_due:0,due_date:'2026-10-01'}),today).tone,'neutral');
 assert.equal(dueStatus(normalizeInvoice({balance_due:1,due_date:'2026-10-29'}),today).tone,'danger');
 assert.equal(matchesQuickFilter(calculated,'due',null),false);
});

test('calendar dates reject rollover dates and support leap days',()=>{
 assert.equal(calendarDay('2026-02-29'),null);
 assert.equal(calendarDay('2026-04-31'),null);
 assert.equal(calendarDay('2026-13-01'),null);
 assert.equal(calendarDay('2026-1-1'),null);
 assert.notEqual(calendarDay('2028-02-29'),null);
});
test('amounts distinguish missing, invalid and zero',()=>{for(const v of ['', ' ',null,undefined,true,'bad',Infinity])assert.equal(numberValue(v),null);assert.equal(numberValue('0'),0);assert.equal(numberValue('8150.31'),8150.31)});
test('balance requires two valid inputs and preserves explicit zero',()=>{assert.equal(normalizeInvoice({total_amount:'100',amount_paid:'25',balance_due:''}).balance_due,75);assert.equal(normalizeInvoice({total_amount:'100',amount_paid:''}).balance_due,null);const i=normalizeInvoice({total_amount:100,amount_paid:25,balance_due:0});assert.equal(i.balance_due,0);assert.equal(i.balance_calculated,false);assert.equal(normalizeInvoice({total_amount:.3,amount_paid:.1}).balance_due,.2)});
test('dates preserve calendar day and timestamps use Karachi',()=>{assert.equal(dateLabel('2026-10-15'),'15 Oct 2026');assert.match(timestamp('2026-10-29T18:23:00.180+05:00'),/18:23:00 PKT/)});
test('CSV escapes source fields and formula injection; URL rejects script schemes',()=>{const content=csv([normalizeInvoice({supplier_name:'=SUM(1,2)',supplier_address:'Line 1\n"Line 2"',total_amount:0})]);assert.ok(content.includes('"\'=SUM(1,2)"'));assert.ok(content.includes('"Line 1\n""Line 2"""'));assert.equal(safeUrl('javascript:alert(1)'),null);assert.equal(safeUrl('https://example.com'),'https://example.com/')});
