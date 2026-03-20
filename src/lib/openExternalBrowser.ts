/**
 * 嘗試用「系統瀏覽器」開啟網址（從 LINE / FB 等內嵌 WebView 跳出）。
 * 無法保證所有 App／版本都成功，失敗時可搭配複製網址。
 */
export function openUrlInExternalBrowser(url: string): void {
  if (typeof window === 'undefined' || !url) return

  const ua = navigator.userAgent || ''
  const isAndroid = /Android/i.test(ua)

  if (isAndroid) {
    try {
      const u = new URL(url)
      const hostPath = `${u.host}${u.pathname}${u.search}${u.hash || ''}`
      const intent = `intent://${hostPath}#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(url)};end`
      window.location.href = intent
      return
    } catch {
      /* fall through */
    }
  }

  // iOS / 桌面：程式點擊 <a target="_blank"> 有時比 window.open 更容易觸發外部瀏覽器
  try {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
