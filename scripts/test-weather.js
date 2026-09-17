async function testWeather() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=17.3850&longitude=78.4867&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto';
  console.log('Testing Open-Meteo connection:', url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Failed:', res.status);
    return;
  }
  const json = await res.json();
  console.log('Open-Meteo response current:', JSON.stringify(json.current, null, 2));
}

testWeather();
