import { NextResponse } from 'next/server';
import { runMarginLeakJob } from '@/src/services/scheduler';

export async function GET() {
  try {
    const result = await runMarginLeakJob();
    return NextResponse.json({ ok: true, result });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 });
  }
}
