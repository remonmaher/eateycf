// Finds a sample food photo (Pexels). Optional: works only if PEXELS_API_KEY is set.
const json = (o) => new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' } });
export async function onRequestGet({ request, env }) {
  const q = (new URL(request.url).searchParams.get('q') || '').slice(0, 80);
  if (!q || !env.PEXELS_API_KEY) return json({ none: true });
  try {
    const r = await fetch('https://api.pexels.com/v1/search?per_page=1&orientation=landscape&query=' + encodeURIComponent(q + ' food'), { headers: { Authorization: env.PEXELS_API_KEY } });
    const j = await r.json();
    const p = j.photos && j.photos[0];
    return p ? json({ url: p.src.large, credit: p.photographer, creditUrl: p.url }) : json({ none: true });
  } catch (_) { return json({ none: true }); }
}
