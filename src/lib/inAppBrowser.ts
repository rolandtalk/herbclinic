/**
 * 偵測常見 App 內建瀏覽器（LINE、FB、IG、微信等）。
 * Google OAuth 在這些環境會回傳 403 disallowed_useragent，無法由前端繞過。
 */
export type InAppVendor = 'line' | 'facebook' | 'instagram' | 'wechat' | 'threads' | 'unknown' | null

export function detectInAppBrowser(): { inApp: boolean; vendor: InAppVendor } {
  if (typeof navigator === 'undefined') return { inApp: false, vendor: null }
  const ua = navigator.userAgent || ''

  if (/Line\//i.test(ua) || /Liff\//i.test(ua)) return { inApp: true, vendor: 'line' }
  if (/FBAN|FBAV|FB_IAB|Facebook/i.test(ua)) return { inApp: true, vendor: 'facebook' }
  if (/Instagram/i.test(ua)) return { inApp: true, vendor: 'instagram' }
  if (/MicroMessenger/i.test(ua)) return { inApp: true, vendor: 'wechat' }
  if (/Threads/i.test(ua)) return { inApp: true, vendor: 'threads' }

  return { inApp: false, vendor: null }
}

export function inAppVendorLabel(vendor: InAppVendor): string {
  switch (vendor) {
    case 'line':
      return 'LINE'
    case 'facebook':
      return 'Facebook'
    case 'instagram':
      return 'Instagram'
    case 'wechat':
      return '微信'
    case 'threads':
      return 'Threads'
    default:
      return '此 App'
  }
}
