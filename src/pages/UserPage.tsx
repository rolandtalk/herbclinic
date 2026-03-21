import { useState, useEffect, useCallback, useMemo } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { fetchSheetData, getDisplayLabel, type DataRow } from '../lib/sheets'
import { getSession, setSession, clearSession } from '../lib/auth'
import { SEARCHABLE_COLUMNS, SEARCH_ALL_KEY } from '../lib/columnLabels'
import { detectInAppBrowser, inAppVendorLabel, type InAppVendor } from '../lib/inAppBrowser'
import { openUrlInExternalBrowser, isIOSDevice } from '../lib/openExternalBrowser'
import './UserPage.css'

const HAS_GOOGLE_CLIENT_ID = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

// 推薦食物 1/2、推薦運動 1/2：合併為「推薦 X：YY -> 功效」
const PAIRED_DISPLAY: { key: string; effectKey: string; label: string }[] = [
  { key: 'food1', effectKey: 'food1_effect', label: '推薦食物 1' },
  { key: 'food2', effectKey: 'food2_effect', label: '推薦食物 2' },
  { key: 'exercise1', effectKey: 'exercise1_effect', label: '推薦運動 1' },
  { key: 'exercise2', effectKey: 'exercise2_effect', label: '推薦運動 2' },
]
const EFFECT_KEYS = new Set(PAIRED_DISPLAY.map((p) => p.effectKey))

function isYouTubeUrl(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  const t = str.trim()
  return /youtube\.com\/watch\?v=|youtu\.be\//i.test(t) || /^https?:\/\/.*youtube\.com\/embed\//i.test(t)
}

function VideoCell({ value }: { value: string }) {
  const [title, setTitle] = useState<string | null>(null)
  const url = (value || '').trim()
  const showAsLink = url && (url.startsWith('http://') || url.startsWith('https://'))

  useEffect(() => {
    if (!url || !isYouTubeUrl(url)) return
    const oembedUrl = `/api/youtube-oembed?url=${encodeURIComponent(url)}&format=json`
    let cancelled = false
    fetch(oembedUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.title) setTitle(data.title)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [url])

  if (!url) return <span className="result-value">—</span>
  return (
    <span className="result-value result-value-video">
      {showAsLink ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="video-link">
          在 YouTube 觀看
        </a>
      ) : (
        <span>{url}</span>
      )}
      {title != null && <span className="video-title">{title}</span>}
    </span>
  )
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export default function UserPage() {
  const [user, setUser] = useState<{ email: string; name: string; picture?: string } | null>(null)
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searchCol, setSearchCol] = useState(SEARCH_ALL_KEY)
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedCol, setAppliedCol] = useState(SEARCH_ALL_KEY)
  const [appliedQuery, setAppliedQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inAppHelpOpen, setInAppHelpOpen] = useState(false)
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const { inApp, vendor } = useMemo(() => detectInAppBrowser(), [])
  const vendorName = inAppVendorLabel(vendor as InAppVendor)
  const ios = useMemo(() => isIOSDevice(), [])

  const triggerSearch = () => {
    setAppliedCol(searchCol)
    setAppliedQuery(searchQuery.trim())
    setHasSearched(true)
    setSelectedIndex(null)
  }

  const currentSearchLabel = SEARCHABLE_COLUMNS.find((c) => c.key === searchCol)?.label ?? '全部'

  const loadSession = useCallback(() => {
    const s = getSession()
    if (s) setUser({ email: s.email, name: s.name, picture: s.picture })
    else setUser(null)
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const profile = await res.json()
        const u = { email: profile.email, name: profile.name || profile.email, picture: profile.picture }
        setSession(u, 'google')
        setUser(u)
      } catch (e) {
        setError('登入失敗')
      }
    },
    onError: () => setError('登入失敗'),
  })

  const handleGoogleLoginClick = () => {
    if (inApp) {
      setInAppHelpOpen(true)
      return
    }
    googleLogin()
  }

  const demoLogin = () => {
    const u = { email: 'demo@example.com', name: '示範使用者' }
    setSession(u, 'demo')
    setUser(u)
    setInAppHelpOpen(false)
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchSheetData()
      setData(rows)
    } catch (e) {
      setError('無法載入表單資料，請確認試算表已設為「知道連結的使用者」可檢視')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadData()
  }, [!!user])

  const filtered =
    hasSearched && appliedQuery
      ? data.filter((row) => {
          const q = appliedQuery.toLowerCase()
          if (appliedCol === SEARCH_ALL_KEY) {
            return Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(q))
          }
          const val = row[appliedCol] ?? ''
          return String(val).toLowerCase().includes(q)
        })
      : []

  const displayKeys = data[0] ? Object.keys(data[0]) : []

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  const launchSystemBrowser = useCallback(() => {
    openUrlInExternalBrowser(pageUrl)
  }, [pageUrl])

  const copyPageUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopyHint('已複製網址，請貼到 Chrome 或 Safari')
      setTimeout(() => setCopyHint(null), 3500)
    } catch {
      setCopyHint('無法自動複製，請長按網址列手動複製')
      setTimeout(() => setCopyHint(null), 3500)
    }
  }, [pageUrl])

  return (
    <div className="user-page">
      {inApp && !user && (
        <div className="in-app-notice" role="status">
          <strong>內嵌瀏覽器提示</strong>
          <p>
            您目前使用 {vendorName} 內建瀏覽器。依 Google 安全政策，<b>無法在此環境完成 Google 登入</b>（錯誤
            403），這一點無法由網站程式解除。
          </p>
          <p>請點「使用 Google 登入」查看<strong>在外部瀏覽器開啟</strong>的方式，或先使用<strong>示範登入</strong>試用查詢功能。</p>
          <div className="in-app-notice-actions">
            <button type="button" className="btn btn-primary in-app-launch-btn" onClick={launchSystemBrowser}>
              用系統瀏覽器開啟本頁
            </button>
            <button type="button" className="btn btn-outline in-app-copy-btn" onClick={copyPageUrl}>
              複製網址
            </button>
          </div>
          {copyHint && <p className="in-app-copy-hint">{copyHint}</p>}
          {ios && (
            <div className="ios-safari-fallback">
              <p className="ios-safari-title">iPhone / iPad（含 LINE）建議：</p>
              <a href={pageUrl} className="ios-safari-link" target="_blank" rel="noopener noreferrer">
                {pageUrl}
              </a>
              <p className="ios-safari-hint">
                <strong>長按</strong>上方藍色連結 → 選「在 Safari 開啟」或「Open in Safari」。若無選單，請用右上角 <strong>⋯</strong> →「在瀏覽器開啟」。
              </p>
            </div>
          )}
        </div>
      )}

      {inAppHelpOpen && (
        <div className="in-app-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="in-app-modal-title">
          <div className="in-app-modal">
            <h2 id="in-app-modal-title">在外部瀏覽器完成 Google 登入</h2>
            <p>
              Google 不允許在 LINE、Facebook、Instagram、微信等 App 的內建瀏覽器進行登入。請改用
              <strong> Chrome </strong>或<strong> Safari </strong>開啟本網站。
            </p>
            <ol className="in-app-steps">
              <li>
                <strong>iOS / LINE：</strong>按鈕可能被內建瀏覽器擋下。請<strong>長按下方藍色網址</strong>→「在 Safari 開啟」；或 LINE 右上角 <strong>⋯</strong>→「在瀏覽器開啟」。
              </li>
              <li>
                <strong>Android：</strong>先試「用系統瀏覽器開啟本頁」（常可跳出 Chrome）。
              </li>
              <li>或按「複製網址」，貼到 Safari / Chrome。</li>
            </ol>
            {ios && pageUrl && (
              <div className="ios-safari-fallback ios-safari-fallback-modal">
                <a href={pageUrl} className="ios-safari-link" target="_blank" rel="noopener noreferrer">
                  {pageUrl}
                </a>
                <p className="ios-safari-hint">↑ 長按連結，選「在 Safari 開啟」</p>
              </div>
            )}
            <button type="button" className="btn btn-primary btn-external" onClick={launchSystemBrowser}>
              用系統瀏覽器開啟本頁
            </button>
            <button type="button" className="btn btn-outline btn-external-secondary" onClick={copyPageUrl}>
              複製網址
            </button>
            {copyHint && <p className="in-app-copy-hint in-app-modal-copy-hint">{copyHint}</p>}
            <p className="in-app-modal-divider">或</p>
            <button type="button" className="btn btn-demo" onClick={demoLogin}>
              示範登入（僅試用，非 Google 帳號）
            </button>
            <button type="button" className="btn btn-outline btn-modal-close" onClick={() => setInAppHelpOpen(false)}>
              關閉
            </button>
          </div>
        </div>
      )}

      <header className="user-header">
        <h1>五運六氣查詢</h1>
        {user ? (
          <div className="user-info">
            <span className="user-name">登入：{user.name}</span>
            <button type="button" className="btn btn-outline" onClick={logout}>
              登出
            </button>
          </div>
        ) : (
          <div className="login-actions">
            <button type="button" className="btn btn-primary" onClick={handleGoogleLoginClick}>
              使用 Google 登入
            </button>
            {(!HAS_GOOGLE_CLIENT_ID || inApp) && (
              <button type="button" className="btn btn-demo" onClick={demoLogin}>
                {inApp ? '示範登入（內嵌瀏覽器試用）' : '示範登入（無 Client ID 時使用）'}
              </button>
            )}
          </div>
        )}
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {user && (
        <main className="user-main">
          <section className="search-section">
            <div className="search-key-frame">
              <span className="search-key-name">{currentSearchLabel}</span>
              <span className="search-key-arrow" aria-hidden>▼</span>
              <select
                value={searchCol}
                onChange={(e) => setSearchCol(e.target.value)}
                className="search-select-overlay"
                aria-label="搜尋欄位（點擊可列出所有選項）"
              >
                {SEARCHABLE_COLUMNS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="search-row">
              <input
                type="search"
                placeholder="輸入關鍵字搜尋…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                className="search-input"
                aria-label="搜尋關鍵字"
              />
              <button type="button" className="btn-search" onClick={triggerSearch} title="搜尋" aria-label="搜尋">
                <SearchIcon />
              </button>
            </div>
          </section>

          {loading ? (
            <p className="loading">載入中…</p>
          ) : (
            <section className="results-section">
              {!hasSearched ? (
                <p className="results-empty">請選擇搜尋欄位、輸入關鍵字後按搜尋，即可顯示結果。</p>
              ) : (
                <>
                  <p className="results-count">
                    共 {filtered.length} 筆（登入後 4 小時內有效）
                  </p>
                  {filtered.length === 0 ? (
                    <p className="results-empty">無符合條件的資料。</p>
                  ) : selectedIndex !== null ? (
                    <>
                      <button type="button" className="btn-back" onClick={() => setSelectedIndex(null)}>
                        ← 返回結果列表
                      </button>
                      <div className="result-card result-detail">
                        {displayKeys.map((key) => {
                          if (EFFECT_KEYS.has(key)) return null
                          const row = filtered[selectedIndex]
                          const paired = PAIRED_DISPLAY.find((p) => p.key === key)
                          if (paired) {
                            const name = row[paired.key] ?? '—'
                            const effect = row[paired.effectKey] ?? '—'
                            return (
                              <div key={key} className="result-row">
                                <span className="result-label">{paired.label}</span>
                                <span className="result-value result-value-paired">
                                  {name} → {effect}
                                </span>
                              </div>
                            )
                          }
                          return (
                            <div key={key} className="result-row">
                              <span className="result-label">{getDisplayLabel(key)}</span>
                              {key === 'video' ? (
                                <VideoCell value={row[key] ?? ''} />
                              ) : (
                                <span className="result-value">{row[key] ?? '—'}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="results-summary-hint">點擊出生年份可查看完整內容</p>
                      <ul className="summary-list">
                        {filtered.map((row, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              className="summary-item"
                              onClick={() => setSelectedIndex(i)}
                            >
                              <span className="summary-label">出生年份</span>
                              <span className="summary-value">{row.year ?? '—'}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </section>
          )}
        </main>
      )}

      {!user && (
        <p className="hint">請先使用 Google 登入，即可依欄位搜尋並查看結果。登入狀態有效期限為 4 小時。</p>
      )}
    </div>
  )
}
