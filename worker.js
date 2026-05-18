/**
 * Cloudflare Worker — WeatherAPI.com proxy
 * Compatible with the Cloudflare dashboard browser editor (no build step needed)
 *
 * Deploy steps:
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file into the editor and click Save & Deploy
 * 3. Go to your Worker → Settings → Variables → Add variable:
 *      Name:  WEATHER_API_KEY
 *      Value: your WeatherAPI.com key   (check Encrypt)
 * 4. Click Save and deploy again
 * 5. Copy your Worker URL and paste it into the dashboard setup field
 */

const ALLOWED_ORIGIN = 'https://k4k1h4r4.github.io';

const CORS = {
  'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }

  const url  = new URL(request.url);
  const q    = url.searchParams.get('q')    || 'Gering,NE';
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7', 10), 1), 7);

  const apiKey = WEATHER_API_KEY; // injected from Workers environment variable

  const apiUrl = 'https://api.weatherapi.com/v1/forecast.json'
    + '?key='    + apiKey
    + '&q='      + encodeURIComponent(q)
    + '&days='   + days
    + '&aqi=no&alerts=no&hour=1';

  try {
    const upstream = await fetch(apiUrl);

    if (!upstream.ok) {
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const data = await upstream.text();

    return new Response(data, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type':  'application/json',
        'Cache-Control': 'public, max-age=900',
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
