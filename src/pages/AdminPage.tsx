import { useState, useEffect } from 'react'
import { getLoginLogLast7Days, getLoginCountByUser, type LoginRecord } from '../lib/auth'
import './AdminPage.css'

export default function AdminPage() {
  const [logins, setLogins] = useState<LoginRecord[]>([])
  const [counts, setCounts] = useState<{ email: string; name: string; count: number }[]>([])

  useEffect(() => {
    const records = getLoginLogLast7Days()
    setLogins(records)
    setCounts(getLoginCountByUser(records))
  }, [])

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

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>管理後台 — 登入紀錄</h1>
        <p className="subtitle">最近 7 天登入紀錄與每人登入次數</p>
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
        <h2>登入時間明細（最近 7 天）</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>Email</th>
                <th>登入時間</th>
              </tr>
            </thead>
            <tbody>
              {logins.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty">
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
