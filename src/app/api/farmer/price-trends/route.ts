import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commodity = searchParams.get('commodity') || 'Tomato';

    const csvPath = path.join(process.cwd(), 'data', 'historical_prices.csv');
    const trendPoints: { date: string; price: number }[] = [];

    if (fs.existsSync(csvPath)) {
      const fileContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = fileContent.split('\n');
      const cleanCommodity = commodity.toLowerCase();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [date, crop, location, market, priceStr] = line.split(',');
        if (!crop || !priceStr) continue;

        if (crop.toLowerCase().includes(cleanCommodity)) {
          const price = parseFloat(priceStr);
          if (!isNaN(price)) {
            trendPoints.push({ date, price });
          }
        }
      }
    }

    // Sort chronologically
    trendPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (trendPoints.length === 0) {
      return NextResponse.json({
        success: true,
        status: 'NO_DATA',
        message: 'No price trend data available for this commodity',
        data: [],
      });
    }

    return NextResponse.json({
      success: true,
      commodity,
      count: trendPoints.length,
      data: trendPoints,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch price trends' },
      { status: 500 }
    );
  }
}
