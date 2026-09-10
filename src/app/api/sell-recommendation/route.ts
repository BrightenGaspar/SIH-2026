import { NextResponse } from 'next/server';
import { evaluateStorageVsSell } from '@/services/storageOptimizerService';
import { StorageOptimizationInput } from '@/types/intelligence';

export async function POST(req: Request) {
  try {
    const body: StorageOptimizationInput = await req.json();
    const result = evaluateStorageVsSell(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const result = evaluateStorageVsSell({
    commodity: 'Tomato (Hybrid Desi)',
    marketableQuantityKg: 600,
    currentSellingPrice: 52.92,
    projectedFuturePrice: 58.00,
    storageDays: 5,
  });
  return NextResponse.json({ success: true, data: result });
}
