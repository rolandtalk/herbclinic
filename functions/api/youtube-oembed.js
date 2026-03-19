export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const videoUrl = url.searchParams.get('url');
  if (!videoUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  const res = await fetch(oembedUrl);
  const data = await res.json();
  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
