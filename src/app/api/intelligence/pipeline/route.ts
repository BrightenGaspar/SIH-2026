import { NextResponse } from 'next/server';
import { runUnifiedIntelligencePipeline, PipelineSimulationParams } from '@/services/intelligenceCoordinator';

export async function POST(req: Request) {
  try {
    const body: PipelineSimulationParams = await req.json();
    const result = runUnifiedIntelligencePipeline(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const result = runUnifiedIntelligencePipeline();
  return NextResponse.json({ success: true, data: result });
}
