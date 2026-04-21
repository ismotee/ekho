/**
 * Landing page (placeholder — content to be added later).
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import partnerLogo from '../../assets/logos/vihrea-logo-valkoinen-teksti.png'
import './LandingPage.css'

export const LandingPage = () => {
  const { t } = useTranslation()

  return (
    <div className="landing-page">
      <div className="landing-page__cta">
        <div className="landing-page__intro">
          <p className="landing-page__intro-p">{t('landing.introParagraph1')}</p>
          <p className="landing-page__intro-p">{t('landing.introParagraph2')}</p>
        </div>
        <Link to="/records" className="landing-page__collection-btn">
          {t('app.goToRecords')}
        </Link>
        <div className="landing-page__partner-logo-wrap">
          <img
            src={partnerLogo}
            alt={t('landing.partnerLogoAlt')}
            className="landing-page__partner-logo"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}

LandingPage.displayName = 'LandingPage'
