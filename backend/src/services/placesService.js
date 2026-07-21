// src/services/placesService.js
const DUFFEL_API_BASE = 'https://api.duffel.com';

async function resolvePlace(query) {
  const res = await fetch(
    `${DUFFEL_API_BASE}/places/suggestions?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.DUFFEL_KEY}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Duffel places lookup failed for "${query}": ${res.status}`);
  }

  const { data } = await res.json();
  const place = data.find((p) => p.iata_code || p.type === 'city' || p.type === 'airport');

  if (!place) {
    throw new Error(`No place match found on Duffel for "${query}"`);
  }

  return place; // includes iata_code, latitude, longitude, name, city_name, etc.
}

async function resolveIata(query) {
  const place = await resolvePlace(query);
  return place.iata_code;
}

module.exports = { resolvePlace, resolveIata };