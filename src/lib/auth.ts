const SESSION_KEY = 'hurb_session'
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000 // 4 hours
const LOGIN_LOG_KEY = 'hurb_login_log'

export type SessionUser = {
  email: string
  name: string
  picture?: string
  exp: number
}

export type LoginSource = 'google' | 'demo'

export function setSession(
  user: { email: string; name: string; picture?: string },
  source: LoginSource = 'google'
): void {
  const exp = Date.now() + SESSION_DURATION_MS
  const session: SessionUser = { ...user, exp }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  appendLoginLog(user, source)
}

function appendLoginLog(user: { email: string; name: string }, source: LoginSource): void {
  try {
    const raw = localStorage.getItem(LOGIN_LOG_KEY)
    const log: LoginRecord[] = raw ? JSON.parse(raw) : []
    log.push({
      email: user.email,
      name: user.name,
      timestamp: Date.now(),
      source,
    })
    localStorage.setItem(LOGIN_LOG_KEY, JSON.stringify(log))
  } catch {
    localStorage.setItem(
      LOGIN_LOG_KEY,
      JSON.stringify([
        { email: user.email, name: user.name, timestamp: Date.now(), source },
      ])
    )
  }
}

export function getSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session: SessionUser = JSON.parse(raw)
    if (session.exp < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export type LoginRecord = {
  email: string
  name: string
  timestamp: number
  source?: LoginSource
}

export function getLoginLogLast7Days(): LoginRecord[] {
  try {
    const raw = localStorage.getItem(LOGIN_LOG_KEY)
    const log: LoginRecord[] = raw ? JSON.parse(raw) : []
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return log.filter((r) => r.timestamp >= cutoff)
  } catch {
    return []
  }
}

export function getLoginCountByUser(records: LoginRecord[]): { email: string; name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>()
  for (const r of records) {
    const cur = map.get(r.email)
    if (cur) {
      cur.count += 1
    } else {
      map.set(r.email, { name: r.name, count: 1 })
    }
  }
  return Array.from(map.entries()).map(([email, { name, count }]) => ({ email, name, count }))
}
