'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { IDIOMAS, MONEDAS } from '@/lib/opciones'

export default function Settings() {
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('en')
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('USD')
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const t = useTranslations('settings')

  useEffect(() => {
    const lang = localStorage.getItem('lang') || 'en'
    const currency = localStorage.getItem('currency') || 'USD'
    setIdiomaSeleccionado(lang)
    setMonedaSeleccionada(currency)
  }, [])

  function handleGuardar() {
    localStorage.setItem('lang', idiomaSeleccionado)
    localStorage.setItem('currency', monedaSeleccionada)
    window.location.href = `/${idiomaSeleccionado}/settings`
  }

  return (
    <main className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 flex flex-col gap-6 shadow-sm border border-border-color">

        <div>
          <h1 className="text-2xl font-semibold text-text-main">{t('titulo')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('subtitulo')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-main">{t('idioma')}</label>
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
          <label className="text-sm font-medium text-text-main">{t('moneda')}</label>
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
          onClick={handleGuardar}
          className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg"
        >
          {t('guardar')}
        </button>

        <div className="border-t border-border-color pt-4">
          <Link
            href={`/${locale}/negocio/login`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border-color text-sm font-medium text-text-secondary hover:text-text-main hover:border-primary transition-colors"
          >
            <span>🏪</span>
            {t('accesoNegocios')}
          </Link>
        </div>

      </div>
    </main>
  )
}