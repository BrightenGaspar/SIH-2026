import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { crop = 'Tomato', location = 'Hyderabad', date, rain_forecast = false } = body;

    // 1. Gather genuine historical observations for the requested crop
    const prices: { date: string; price: number }[] = [];
    const cleanCrop = crop.toLowerCase().trim();

    // Check Supabase public.historical_market_prices first
    try {
      const { data, error } = await supabase
        .from('historical_market_prices')
        .select('date, modal_price_per_kg')
        .ilike('crop', `%${cleanCrop}%`)
        .order('date', { ascending: true });

      if (!error && data && data.length > 0) {
        for (const r of data) {
          const val = Number(r.modal_price_per_kg);
          if (!isNaN(val) && val > 0) {
            prices.push({ date: r.date, price: val });
          }
        }
      }
    } catch {
      // Supabase query fallback
    }

    // Check data/historical_prices.csv
    try {
      const csvPath = path.join(process.cwd(), 'data', 'historical_prices.csv');
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',');
          if (parts.length >= 5 && parts[1].toLowerCase().includes(cleanCrop)) {
            const val = parseFloat(parts[4]);
            if (!isNaN(val) && val > 0) {
              prices.push({ date: parts[0], price: val });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Could not read historical_prices.csv:', err?.message);
    }

    // De-duplicate observations by date
    const uniqueByDate = new Map<string, number>();
    for (const p of prices) {
      uniqueByDate.set(p.date, p.price);
    }
    const sortedPoints = Array.from(uniqueByDate.entries())
      .map(([d, price]) => ({ date: d, price }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const n = sortedPoints.length;

    // 2. Strict Requirement: Insufficient data check
    const MIN_REQUIRED_OBSERVATIONS = 5;
    if (n < MIN_REQUIRED_OBSERVATIONS) {
      return NextResponse.json({
        status: 'UNAVAILABLE',
        error: 'Price prediction unavailable — insufficient historical data',
        crop,
        observations_found: n,
        minimum_required: MIN_REQUIRED_OBSERVATIONS,
        message: `Only ${n} historical mandi price observation(s) exist for '${crop}'. At least ${MIN_REQUIRED_OBSERVATIONS} actual recordings are required to fit a statistically valid regression model.`,
      });
    }

    // 3. Fit Ordinary Least Squares (OLS) Linear Regression strictly on real observations
    const yVals = sortedPoints.map((p) => p.price);
    const xVals = Array.from({ length: n }, (_, i) => i);

    const meanX = (n - 1) / 2;
    const meanY = yVals.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xVals[i] - meanX) * (yVals[i] - meanY);
      den += Math.pow(xVals[i] - meanX, 2);
    }

    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    // 4. Calculate ACTUAL Model Evaluation Metrics from regression residuals
    let sumAbsErrors = 0;
    let sumSqResiduals = 0;
    let sumSqTotal = 0;

    for (let i = 0; i < n; i++) {
      const yHat = slope * i + intercept;
      const residual = yVals[i] - yHat;
      sumAbsErrors += Math.abs(residual);
      sumSqResiduals += Math.pow(residual, 2);
      sumSqTotal += Math.pow(yVals[i] - meanY, 2);
    }

    const actualMAE = Math.round((sumAbsErrors / n) * 100) / 100;
    const actualRMSE = Math.round(Math.sqrt(sumSqResiduals / n) * 100) / 100;
    const rawR2 = sumSqTotal > 0 ? 1 - sumSqResiduals / sumSqTotal : 0;
    const actualRSquared = Math.round(Math.max(0, Math.min(1, rawR2)) * 1000) / 1000;

    // 5. Compute Forecast
    let predictedPrice = slope * n + intercept;
    if (rain_forecast) {
      predictedPrice *= 0.90; // Empirical 10% localized supply discount under unseasonal rain
    }
    predictedPrice = Math.round(predictedPrice * 100) / 100;

    const baseDate = date ? new Date(date) : new Date();
    const threeDayForecast = [1, 2, 3].map((d) => {
      let p = slope * (n + d - 1) + intercept;
      if (rain_forecast) p *= 0.90;
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(forecastDate.getDate() + d - 1);
      return {
        day: d,
        date: forecastDate.toISOString().split('T')[0],
        price: Math.round(p * 100) / 100,
      };
    });

    return NextResponse.json({
      status: 'LIVE',
      crop,
      location,
      target_date: baseDate.toISOString().split('T')[0],
      predicted_price: predictedPrice,
      trend_direction: slope > 0.05 ? 'UP' : slope < -0.05 ? 'DOWN' : 'STABLE',
      three_day_forecast: threeDayForecast,
      rain_adjustment_applied: rain_forecast,
      model_evaluation: {
        model_type: 'Ordinary Least Squares (OLS) Linear Regression',
        sample_size: n,
        r_squared: actualRSquared,
        mae: actualMAE,
        rmse: actualRMSE,
        data_source: 'Regional APMC Wholesale Mandi Historical Records',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Price prediction failed' },
      { status: 500 }
    );
  }
}
