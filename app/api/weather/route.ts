import { NextResponse } from 'next/server';

// Billing Take-Off Coordinates & Elevation (Himachal Pradesh, India)
const BILLING_LAT = 32.05;
const BILLING_LON = 76.73;
const BILLING_ELEVATION = 2430;

function getWindDirection(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

export async function GET() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${BILLING_LAT}&longitude=${BILLING_LON}&elevation=${BILLING_ELEVATION}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&timezone=Asia%2FKolkata`;

    const res = await fetch(url, {
      next: { revalidate: 300 }, // Cache on server for 5 minutes
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;

    const windSpeed = Math.round(current.wind_speed_10m);
    const windGusts = Math.round(current.wind_gusts_10m);
    const temp = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const direction = getWindDirection(current.wind_direction_10m);
    const condition = getWeatherCondition(current.weather_code);

    // Paragliding flight condition rating
    // Calculate current Indian Standard Time hour
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    const istHour = istDate.getHours();

    let flightStatus = 'FLYABLE';
    let statusBadge = 'FLYABLE 🟢';
    let statusColor: 'emerald' | 'amber' | 'rose' | 'sky' = 'emerald';

    if (current.weather_code >= 51) {
      flightStatus = 'RAIN / NO FLY';
      statusBadge = 'RAIN 🌧️';
      statusColor = 'rose';
    } else if (windSpeed > 25 || windGusts > 32) {
      flightStatus = 'STRONG WIND';
      statusBadge = 'BLOWING OFF 🔴';
      statusColor = 'rose';
    } else if (windSpeed > 18 || windGusts > 25) {
      flightStatus = 'CAUTION';
      statusBadge = 'GUSTY 🟡';
      statusColor = 'amber';
    } else if (istHour < 6 || istHour >= 18) {
      flightStatus = 'STANDBY';
      statusBadge = 'NIGHT / CALM 🌙';
      statusColor = 'sky';
    } else if (windSpeed < 5) {
      flightStatus = 'LIGHT WIND';
      statusBadge = 'LIGHT WIND 🟢';
      statusColor = 'emerald';
    }

    return NextResponse.json({
      success: true,
      data: {
        windSpeed,
        windGusts,
        temperature: temp,
        humidity,
        windDirection: direction,
        windDegrees: Math.round(current.wind_direction_10m),
        condition,
        flightStatus,
        statusBadge,
        statusColor,
        elevation: BILLING_ELEVATION,
        updatedAt: current.time,
      },
    });
  } catch (error: any) {
    console.error('Weather API error, returning fallback:', error.message);
    return NextResponse.json({
      success: false,
      data: {
        windSpeed: 12,
        windGusts: 18,
        temperature: 18,
        humidity: 60,
        windDirection: 'SW',
        windDegrees: 220,
        condition: 'Sunny',
        flightStatus: 'FLYABLE',
        statusBadge: 'FLYABLE 🟢',
        statusColor: 'emerald',
        elevation: BILLING_ELEVATION,
        updatedAt: new Date().toISOString(),
      },
    });
  }
}
