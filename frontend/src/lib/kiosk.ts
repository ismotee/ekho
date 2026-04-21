/**
 * Kiosk / fullscreen helpers. Browsers require a user gesture to enter fullscreen;
 * iOS Safari has limited Fullscreen API support — prefer “Add to Home Screen” PWA.
 */

export function isKioskBuild(): boolean {
  const v = import.meta.env.VITE_KIOSK
  return v === 'true' || v === '1'
}

export async function requestAppFullscreen(): Promise<boolean> {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>
    mozRequestFullScreen?: () => Promise<void>
    msRequestFullscreen?: () => Promise<void>
  }
  try {
    if (el.requestFullscreen) await el.requestFullscreen()
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
    else if (el.mozRequestFullScreen) await el.mozRequestFullScreen()
    else if (el.msRequestFullscreen) await el.msRequestFullscreen()
    else return false
    return true
  } catch {
    return false
  }
}
