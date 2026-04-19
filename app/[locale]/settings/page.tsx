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
    <main className="min-h-screen bg-bg-page flex items-center justify-center p-4 pb-28">
      <div className="card w-full max-w-md overflow-hidden">

        {/* Banda gradiente superior */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0891B2 0%, #0EA5C9 60%, #EA580C 100%)' }} />

        <div className="p-8 flex flex-col gap-6">

          <div>
            <h1 className="font-display text-2xl font-bold text-text-main">{t('titulo')}</h1>
            <p className="text-sm text-gray-400 mt-1">{t('subtitulo')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-main">{t('idioma')}</label>
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
            <label className="text-sm font-medium text-text-main">{t('moneda')}</label>
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
            onClick={handleGuardar}
            className="btn-primary text-base py-4"
          >
            {t('guardar')}
          </button>

          <div className="border-t border-border-color pt-4">
            <Link
              href={`/${locale}/negocio/login`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border-color text-sm font-medium text-text-secondary hover:text-primary hover:border-primary transition-all duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor"/>
              </svg>
              {t('accesoNegocios')}
            </Link>
          </div>

        </div>
      </div>
    </main>
  )
}
