import { NextResponse } from 'next/server';
import { normalizeInvoice } from '@/lib/invoices';
export const dynamic='force-dynamic';
export async function GET() {
 const url=process.env.N8N_INVOICE_API_URL, key=process.env.N8N_INVOICE_API_KEY;
 const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
 if(!url || !key || key==='your_key_here') return fail('Live connection is not configured. Set N8N_INVOICE_API_URL and N8N_INVOICE_API_KEY in .env.local, then restart the server.',503);
 try { const response=await fetch(url,{headers:{'X-API-Key':key,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000),redirect:'error'}); if(!response.ok)return fail(`The invoice service returned HTTP ${response.status}. Check your n8n workflow and credentials.`,502); const body=await response.json(); if(!Array.isArray(body.invoices) || body.invoices.some((i:unknown)=>!i || typeof i!=='object' || Array.isArray(i)))return fail('The invoice service returned an unexpected response. Expected an invoices array.',502); return NextResponse.json({invoices:body.invoices.map(normalizeInvoice),fetched_at:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 } catch(error) {return fail(error instanceof Error && (error.name==='TimeoutError'||error.name==='AbortError') ? 'The invoice service timed out after 15 seconds. Please try again.' : 'Unable to reach the invoice service. Check that n8n is running and the endpoint returns valid JSON.',502);}
}
