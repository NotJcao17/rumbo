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
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-8 flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-semibold text-text-main">Rumbo</h1>
          <p className="text-gray-500 mt-1">{t('welcome')}</p>
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
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors
                  ${idiomaSeleccionado === idioma.codigo
                    ? 'border-primary bg-surface text-text-main'
                    : 'border-border-color text-gray-400'
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
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors
                  ${monedaSeleccionada === moneda.codigo
                    ? 'border-primary bg-surface text-text-main'
                    : 'border-border-color text-gray-400'
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
          className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg"
        >
          {t('start')}
        </button>

      </div>
    </div>
  )
}