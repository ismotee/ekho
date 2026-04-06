import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en/translation.json'
import enRecordForm from '../locales/en/recordForm.json'
import fi from '../locales/fi/translation.json'
import fiRecordForm from '../locales/fi/recordForm.json'

const resources = {
  en: { translation: { ...en, recordForm: enRecordForm } },
  fi: { translation: { ...fi, recordForm: fiRecordForm } },
} as const

const isTest = import.meta.env.MODE === 'test'

if (!isTest) {
  i18n.use(LanguageDetector)
}

void i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  supportedLngs: ['en', 'fi'],
  lng: isTest ? 'en' : undefined,
  interpolation: { escapeValue: false },
  ...(isTest
    ? {}
    : {
        detection: {
          order: ['localStorage', 'navigator'] as const,
          caches: ['localStorage'] as const,
          lookupLocalStorage: 'ekho_i18nextLng',
        },
      }),
})

export default i18n
