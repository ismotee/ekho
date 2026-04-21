/**
 * First-interaction fullscreen for kiosk builds (required by browser security policy).
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isKioskBuild, requestAppFullscreen } from '../../lib/kiosk'
import './KioskFullscreenGate.css'

export function KioskFullscreenGate() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => isKioskBuild())

  useEffect(() => {
    if (!isKioskBuild()) return
    document.documentElement.setAttribute('data-kiosk', 'true')
    return () => document.documentElement.removeAttribute('data-kiosk')
  }, [])

  const onActivate = useCallback(async () => {
    await requestAppFullscreen()
    setVisible(false)
  }, [])

  if (!isKioskBuild() || !visible) return null

  return (
    <div
      className="kiosk-fullscreen-gate"
      role="button"
      tabIndex={0}
      aria-label={t('app.kioskTapToEnter')}
      onPointerDown={(e) => {
        e.preventDefault()
        void onActivate()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          void onActivate()
        }
      }}
    >
      <p className="kiosk-fullscreen-gate__text">{t('app.kioskTapToEnter')}</p>
    </div>
  )
}

KioskFullscreenGate.displayName = 'KioskFullscreenGate'
