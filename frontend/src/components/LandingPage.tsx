/**
 * Landing page (placeholder — content to be added later).
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import partnerLogo from '../../assets/logos/vihrea-logo-valkoinen-teksti.png'
import './LandingPage.css'

export const LandingPage = () => {
  const { t } = useTranslation()
  const introParagraphs = ['landing.introParagraph1', 'landing.introParagraph2', 'landing.introParagraph3']
    .map((key) => t(key))
    .filter((paragraph) => paragraph.trim().length > 0)

  return (
    <div className="landing-page">
      <div className="landing-page__cta">
        <div className="landing-page__intro">
          {introParagraphs.map((paragraph) => (
            <p key={paragraph} className="landing-page__intro-p">
              {paragraph}
            </p>
          ))}
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
