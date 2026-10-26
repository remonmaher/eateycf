// Finds a sample food photo. No key needed. Tries, in order:
// 1) TheMealDB  2) Wikipedia  3) Pixabay (if PIXABAY_API_KEY)  4) Pexels (if PEXELS_API_KEY)
const out = (o) => new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' } });
const get = async (url, headers) => { try { const r = await fetch(url, { headers: { 'user-agent': 'Tab5a/1.0 (recipe app)', ...headers } }); return r.ok ? await r.json() : null; } catch (_) { return null; } };

async function mealdb(q) {
  const words = q.split(/\s+/);
  for (const term of [q, words.slice(1).join(' ')]) {
    if (!term) continue;
    const j = await get('https://www.themealdb.com/api/json/v1/1/search.php?s=' + encodeURIComponent(term));
    const m = j && j.meals && j.meals[0];
    if (m && m.strMealThumb) return { url: m.strMealThumb, credit: 'TheMealDB', creditUrl: 'https://www.themealdb.com/meal/' + m.idMeal };
  }
}
async function wiki(q) {
  const j = await get('https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=900&format=json&gsrsearch=' + encodeURIComponent(q + ' dish'));
  const p = j && j.query && Object.values(j.query.pages || {})[0];
  if (p && p.thumbnail) return { url: p.thumbnail.source, credit: 'Wikipedia', creditUrl: 'https://en.wikipedia.org/?curid=' + p.pageid };
}
async function pixabay(q, key) {
  const j = await get('https://pixabay.com/api/?image_type=photo&category=food&safesearch=true&per_page=3&key=' + key + '&q=' + encodeURIComponent(q));
  const h = j && j.hits && j.hits[0];
  if (h) return { url: h.webformatURL, credit: h.user + ' · Pixabay', creditUrl: h.pageURL };
}
async function pexels(q, key) {
  const j = await get('https://api.pexels.com/v1/search?per_page=1&orientation=landscape&query=' + encodeURIComponent(q + ' food'), { Authorization: key });
  const p = j && j.photos && j.photos[0];
  if (p) return { url: p.src.large, credit: p.photographer + ' · Pexels', creditUrl: p.url };
}

export async function onRequestGet({ request, env }) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 80);
  if (!q) return out({ none: true });
  const hit = (await mealdb(q)) || (await wiki(q))
    || (env.PIXABAY_API_KEY && (await pixabay(q, env.PIXABAY_API_KEY)))
    || (env.PEXELS_API_KEY && (await pexels(q, env.PEXELS_API_KEY)));
  return out(hit || { none: true });
}
