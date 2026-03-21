const KV_KEY = 'login_events_v1'
const MAX_ENTRIES = 2000
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export async function onRequestPost(context) {
  const kv = context.env.LOGIN_LOG
  if (!kv) {
    return Response.json({ error: 'KV not bound (LOGIN_LOG)' }, { status: 503 })
  }

  let body
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().slice(0, 320)
  const name = String(body.name ?? '').trim().slice(0, 200)
  const source = body.source === 'demo' || body.source === 'google' ? body.source : 'google'
  const timestamp =
    typeof body.timestamp === 'number' && Number.isFinite(body.timestamp)
      ? body.timestamp
      : Date.now()

  if (!email || !name) {
    return Response.json({ error: 'email and name required' }, { status: 400 })
  }

  let list = []
  try {
    const raw = await kv.get(KV_KEY, { type: 'json' })
    if (Array.isArray(raw)) list = raw
  } catch {
    /* empty */
  }

  list.push({ email, name, timestamp, source })
  const cutoff = Date.now() - RETENTION_MS
  list = list.filter((e) => typeof e.timestamp === 'number' && e.timestamp >= cutoff)
  if (list.length > MAX_ENTRIES) {
    list = list.slice(-MAX_ENTRIES)
  }

  await kv.put(KV_KEY, JSON.stringify(list))
  return Response.json({ ok: true })
}
