import { useState, useEffect } from 'react'
import { getLoginLogLast7Days, getLoginCountByUser, type LoginRecord, type LoginSource } from '../lib/auth'
import './AdminPage.css'

const ADMIN_PASSWORD = 'fang0925'
const ADMIN_AUTH_KEY = 'herbclinic_admin_auth'

function checkAdminAuth(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === '1'
  } catch {
    return false
  }
}

function setAdminAuth(): void {
  sessionStorage.setItem(ADMIN_AUTH_KEY, '1')
}

function sourceLabel(source?: LoginSource): string {
  if (source === 'google') return '已註冊'
  if (source === 'demo') return '未註冊'
  return '—'
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [logins, setLogins] = useState<LoginRecord[]>([])
  const [counts, setCounts] = useState<{ email: string; name: string; count: number }[]>([])

  useEffect(() => {
    setAuthenticated(checkAdminAuth())
  }, [])

  useEffect(() => {
    if (authenticated) {
      const records = getLoginLogLast7Days()
      setLogins(records)
      setCounts(getLoginCountByUser(records))
    }
  }, [authenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password === ADMIN_PASSWORD) {
      setAdminAuth()
      setAuthenticated(true)
      setPassword('')
    } else {
      setError('密碼錯誤')
    }
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!authenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <h1>管理後台</h1>
          <p className="admin-login-hint">請輸入密碼</p>
          <form onSubmit={handleSubmit} className="admin-login-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密碼"
              className="admin-password-input"
              autoComplete="current-password"
              autoFocus
            />
            {error && <p className="admin-login-error">{error}</p>}
            <button type="submit" className="btn btn-admin-submit">
              登入
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>管理後台 — 登入紀錄</h1>
        <p className="subtitle">最近 7 天登入紀錄與每人登入次數（含已註冊／未註冊用戶）</p>
      </header>

      <section className="admin-section">
        <h2>每人登入次數（最近 7 天）</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>Email</th>
                <th>登入次數</th>
              </tr>
            </thead>
            <tbody>
              {counts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty">
                    尚無登入紀錄
                  </td>
                </tr>
              ) : (
                counts.map(({ email, name, count }) => (
                  <tr key={email}>
                    <td>{name}</td>
                    <td>{email}</td>
                    <td>{count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>登入時間明細（最近 7 天，含未註冊用戶）</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>Email</th>
                <th>用戶類型</th>
                <th>登入時間</th>
              </tr>
            </thead>
            <tbody>
              {logins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty">
                    尚無登入紀錄
                  </td>
                </tr>
              ) : (
                [...logins]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((r, i) => (
                    <tr key={`${r.email}-${r.timestamp}-${i}`}>
                      <td>{r.name}</td>
                      <td>{r.email}</td>
                      <td>{sourceLabel(r.source)}</td>
                      <td>{formatDate(r.timestamp)}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
