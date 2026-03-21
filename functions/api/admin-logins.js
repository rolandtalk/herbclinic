const KV_KEY = 'login_events_v1'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function adminSecretOk(context, request) {
  const url = new URL(request.url)
  const q = url.searchParams.get('secret') || ''
  const auth = request.headers.get('Authorization') || ''
  const bearer = auth.replace(/^Bearer\s+/i, '').trim()
  const expected = context.env.ADMIN_LOG_SECRET || 'fang0925'
  return q === expected || bearer === expected
}

export async function onRequestGet(context) {
  if (!adminSecretOk(context, context.request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const kv = context.env.LOGIN_LOG
  if (!kv) {
    return Response.json([])
  }

  let list = []
  try {
    const raw = await kv.get(KV_KEY, { type: 'json' })
    if (Array.isArray(raw)) list = raw
  } catch {
    /* empty */
  }

  const cutoff = Date.now() - SEVEN_DAYS_MS
  const last7 = list.filter((e) => typeof e.timestamp === 'number' && e.timestamp >= cutoff)
  return Response.json(last7, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
