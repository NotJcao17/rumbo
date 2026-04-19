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
    <div
      className="fixed inset-0 flex items-end justify-center z-50 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #084655 0%, #0a3d4a 40%, #1c1a14 100%)',
      }}
    >
      {/* Partículas decorativas flotantes */}
      <div
        className="absolute top-10 left-6 rounded-full hero-glow animate-float"
        style={{ width: 220, height: 220, background: '#0891B2', animationDelay: '0s', animationDuration: '4s' }}
      />
      <div
        className="absolute bottom-56 right-2 rounded-full hero-glow animate-float"
        style={{ width: 160, height: 160, background: '#EA580C', animationDelay: '1.3s', animationDuration: '3.5s' }}
      />
      <div
        className="absolute top-1/3 right-8 rounded-full hero-glow animate-float"
        style={{ width: 100, height: 100, background: '#0891B2', animationDelay: '0.7s', animationDuration: '5s' }}
      />
      <div
        className="absolute top-1/4 left-1/2 rounded-full hero-glow animate-float"
        style={{ width: 70, height: 70, background: '#EA580C', animationDelay: '2s', animationDuration: '4.5s' }}
      />

      {/* Branding centrado sobre el sheet */}
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center" style={{ bottom: '380px' }}>
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="text-6xl animate-float inline-block" style={{ animationDuration: '3s' }}>🧭</span>
          <h1
            className="font-display font-bold mt-3"
            style={{
              fontSize: '4rem',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #67E8F9 0%, #ffffff 60%, #FED7AA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Rumbo
          </h1>
          <p className="text-white/60 mt-2 text-sm tracking-wide">{t('welcome')}</p>
        </div>
      </div>

      {/* Bottom sheet con glassmorphism mejorado */}
      <div
        className="glass w-full max-w-md rounded-t-3xl p-8 flex flex-col gap-6 animate-slide-up"
        style={{
          animationDelay: '0.2s',
          boxShadow: '0 -16px 60px rgba(8,145,178,0.25), 0 -2px 16px rgba(0,0,0,0.25)',
          borderTop: '1px solid rgba(255,255,255,0.25)',
        }}
      >

        {/* Selector de idioma */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            🌍 {t('selectLanguage')}
          </label>
          <div className="flex gap-2">
            {IDIOMAS.map((idioma) => (
              <button
                key={idioma.codigo}
                onClick={() => setIdiomaSeleccionado(idioma.codigo)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                  ${idiomaSeleccionado === idioma.codigo
                    ? 'border-primary bg-surface text-text-main ring-primary-glow scale-105'
                    : 'border-border-color text-gray-400 hover:border-primary/40 hover:bg-surface/50'
                  }`}
              >
                <span className="text-2xl block mb-1">{idioma.bandera}</span>
                <span className="text-xs font-semibold">{idioma.etiqueta}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de moneda */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            💱 {t('selectCurrency')}
          </label>
          <div className="flex gap-2">
            {MONEDAS.map((moneda) => (
              <button
                key={moneda.codigo}
                onClick={() => setMonedaSeleccionada(moneda.codigo)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                  ${monedaSeleccionada === moneda.codigo
                    ? 'border-primary bg-surface text-text-main ring-primary-glow scale-105'
                    : 'border-border-color text-gray-400 hover:border-primary/40 hover:bg-surface/50'
                  }`}
              >
                <span className="text-2xl block mb-1">{moneda.simbolo}</span>
                <span className="text-xs font-semibold">{moneda.codigo}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleComenzar}
          className="btn-primary btn-pulse text-base py-4 font-display tracking-wide"
          style={{ fontSize: '1.05rem', letterSpacing: '0.03em' }}
        >
          {t('start')} →
        </button>

      </div>
    </div>
  )
}
