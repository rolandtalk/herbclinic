/**
 * 嘗試用「系統瀏覽器」開啟網址（從 LINE / FB 等內嵌 WebView 跳出）。
 * iOS LINE 內建瀏覽器常封鎖程式觸發的 target="_blank"，需搭配長按連結或 LINE 選單。
 */

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/i.test(ua)) return true
  // iPadOS 13+ 可能回報 MacIntel
  if (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1) return true
  return false
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

export function openUrlInExternalBrowser(url: string): void {
  if (typeof window === 'undefined' || !url) return

  const ua = navigator.userAgent || ''
  const isAndroid = /Android/i.test(ua)
  const isIOS = isIOSDevice()

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

  // iOS：必須盡量留在「使用者點擊」的同一個同步堆疊內呼叫 window.open
  if (isIOS) {
    const popup = window.open(url, '_blank', 'noopener,noreferrer')
    if (popup) {
      try {
        popup.opener = null
      } catch {
        /* ignore */
      }
      return
    }
    // 被擋彈窗時：嘗試交給 Chrome App（若已安裝）
    try {
      window.location.href = `googlechrome://open-url?url=${encodeURIComponent(url)}`
      return
    } catch {
      /* fall through */
    }
  }

  // 桌面 / 其他：程式點擊 <a target="_blank">
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
