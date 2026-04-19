'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IDIOMAS, MONEDAS } from '@/lib/opciones'

type Props = {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: Props) {
  const t = useTranslations('onboarding')
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('en')
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('USD')

  function handleComenzar() {
    localStorage.setItem('lang', idiomaSeleccionado)
    localStorage.setItem('currency', monedaSeleccionada)
    onComplete()
    window.location.href = `/${idiomaSeleccionado}`
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50"
      style={{ background: 'linear-gradient(160deg, rgba(8,145,178,0.82) 0%, rgba(8,70,100,0.75) 45%, rgba(234,88,12,0.55) 100%)' }}>

      {/* Modal bottom sheet con glassmorphism */}
      <div className="glass w-full max-w-md rounded-t-3xl p-8 flex flex-col gap-6 shadow-[0_-8px_40px_rgba(0,0,0,0.18)]">

        <div className="text-center">
          <h1
            className="font-display font-bold"
            style={{
              fontSize: '3rem',
              lineHeight: 1.1,
              background: 'linear-gradient(135deg, #0891B2 0%, #164E63 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Rumbo
          </h1>
          <p className="text-text-main/70 mt-1 text-sm">{t('welcome')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-main">
            {t('selectLanguage')}
          </label>
          <div className="flex gap-2">
            {IDIOMAS.map((idioma) => (
              <button
                key={idioma.codigo}
                onClick={() => setIdiomaSeleccionado(idioma.codigo)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                  ${idiomaSeleccionado === idioma.codigo
                    ? 'border-primary bg-surface text-text-main ring-primary-glow'
                    : 'border-border-color text-gray-400 hover:border-primary/40'
                  }`}
              >
                <span className="text-xl block mb-1">{idioma.bandera}</span>
                {idioma.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-main">
            {t('selectCurrency')}
          </label>
          <div className="flex gap-2">
            {MONEDAS.map((moneda) => (
              <button
                key={moneda.codigo}
                onClick={() => setMonedaSeleccionada(moneda.codigo)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                  ${monedaSeleccionada === moneda.codigo
                    ? 'border-primary bg-surface text-text-main ring-primary-glow'
                    : 'border-border-color text-gray-400 hover:border-primary/40'
                  }`}
              >
                <span className="text-xl block mb-1">{moneda.simbolo}</span>
                {moneda.codigo}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleComenzar}
          className="btn-primary btn-pulse text-base py-4"
        >
          {t('start')}
        </button>

      </div>
    </div>
  )
}
