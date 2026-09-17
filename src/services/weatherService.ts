export interface LiveWeatherData {
  locationName: string;
  latitude: number;
  longitude: number;
  temperatureCelsius: number;
  humidityPercent: number;
  precipitationMm: number;
  windSpeedKmh: number;
  weatherCondition: string;
  isRain: boolean;
  observationTime: string;
  source: string;
  status: 'LIVE' | 'OFFLINE';
}

function decodeWmoWeatherCode(code: number): { condition: string; isRain: boolean } {
  switch (code) {
    case 0:
      return { condition: 'Clear Sky', isRain: false };
    case 1:
      return { condition: 'Mainly Clear', isRain: false };
    case 2:
      return { condition: 'Partly Cloudy', isRain: false };
    case 3:
      return { condition: 'Overcast', isRain: false };
    case 45:
    case 48:
      return { condition: 'Fog & Mist', isRain: false };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', isRain: true };
    case 61:
      return { condition: 'Slight Rain', isRain: true };
    case 63:
      return { condition: 'Moderate Rain', isRain: true };
    case 65:
      return { condition: 'Heavy Rain', isRain: true };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', isRain: true };
    case 95:
    case 96:
    case 99:
      return { condition: 'Thunderstorm', isRain: true };
    default:
      return { condition: 'Atmospheric Variance', isRain: false };
  }
}

// Regional agricultural hub coordinate map
const REGIONAL_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  hyderabad: { lat: 17.3850, lng: 78.4867, name: 'Hyderabad Central APMC, Telangana' },
  nashik: { lat: 19.9975, lng: 73.7898, name: 'Nashik Valley APMC, Maharashtra' },
  guntur: { lat: 16.3067, lng: 80.4365, name: 'Guntur Mirchi Yard, Andhra Pradesh' },
  shadnagar: { lat: 17.0722, lng: 78.2078, name: 'Shadnagar Farm Hub, Telangana' },
  hassan: { lat: 13.0033, lng: 76.1004, name: 'Hassan Cold Hub, Karnataka' },
  pune: { lat: 18.5204, lng: 73.8567, name: 'Pune Gultekdi Market Yard, Maharashtra' },
};

export const weatherService = {
  /**
   * Fetch genuine live meteorological observation from Open-Meteo
   */
  async getLiveWeather(locationOrCoords?: string | { lat: number; lng: number }): Promise<LiveWeatherData | null> {
    let lat = 17.3850;
    let lng = 78.4867;
    let locName = 'Hyderabad, Telangana';

    if (typeof locationOrCoords === 'object' && locationOrCoords !== null) {
      lat = locationOrCoords.lat;
      lng = locationOrCoords.lng;
      locName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } else if (typeof locationOrCoords === 'string') {
      const lower = locationOrCoords.toLowerCase();
      for (const [key, coords] of Object.entries(REGIONAL_COORDINATES)) {
        if (lower.includes(key)) {
          lat = coords.lat;
          lng = coords.lng;
          locName = coords.name;
          break;
        }
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Open-Meteo API returned status ${res.status}`);
        return null;
      }

      const json = await res.json();
      const current = json.current;

      if (!current) return null;

      const { condition, isRain } = decodeWmoWeatherCode(current.weather_code);

      return {
        locationName: locName,
        latitude: lat,
        longitude: lng,
        temperatureCelsius: Number(current.temperature_2m),
        humidityPercent: Number(current.relative_humidity_2m),
        precipitationMm: Number(current.precipitation),
        windSpeedKmh: Number(current.wind_speed_10m),
        weatherCondition: condition,
        isRain,
        observationTime: current.time,
        source: 'Open-Meteo Meteorological Service (ECMWF / DWD Models)',
        status: 'LIVE',
      };
    } catch (err: any) {
      console.warn('Weather service unreachable:', err?.message);
      return null;
    }
  },
};
