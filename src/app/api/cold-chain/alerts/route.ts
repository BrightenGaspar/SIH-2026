import { NextResponse } from 'next/server';
import { assessColdChainRisk } from '@/services/coldChainRiskService';

export async function GET() {
  // Returns simulated active cold chain alerts across the logistics fleet
  const assessment = assessColdChainRisk('Tomato (Hybrid Desi)', 16.8, 79.0, 26, 'TRK-2026-NIZ-209');
  return NextResponse.json({ success: true, data: assessment.alerts });
}
