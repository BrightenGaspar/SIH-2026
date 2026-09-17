import { NextRequest, NextResponse } from 'next/server';
import { weatherService } from '@/services/weatherService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location') || 'Hyderabad';
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    let weather;
    if (latStr && lngStr) {
      weather = await weatherService.getLiveWeather({
        lat: parseFloat(latStr),
        lng: parseFloat(lngStr),
      });
    } else {
      weather = await weatherService.getLiveWeather(location);
    }

    if (!weather) {
      return NextResponse.json(
        {
          status: 'OFFLINE',
          message: 'Weather data unavailable',
          error: 'External meteorological provider could not be reached.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: weather,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'OFFLINE',
        message: 'Weather data unavailable',
        error: err?.message,
      },
      { status: 500 }
    );
  }
}
