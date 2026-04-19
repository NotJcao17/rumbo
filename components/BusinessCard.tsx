'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { calcularDistanciaKm } from '@/lib/helpers'

const ESTADIO_LAT = 19.3029
const ESTADIO_LNG = -99.1505

type Negocio = {
  id: string
  nombre: string
  direccion: string
  rango_precios: string
  metodos_pago: string[]
  idiomas_atencion: string[]
  accesibilidad: string[]
  horario: string
  es_gastronomico: boolean
  estado: string
  latitud?: number
  longitud?: number
}

type Props = {
  negocio: Negocio
  onTraducirMenu?: () => void
}

export default function BusinessCard({ negocio, onTraducirMenu }: Props) {
  const [rate, setRate] = useState<number | null>(null)
  const [currency, setCurrency] = useState('USD')
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('businessCard')

  const distanciaKm = negocio.latitud && negocio.longitud
    ? calcularDistanciaKm(negocio.latitud, negocio.longitud, ESTADIO_LAT, ESTADIO_LNG)
    : null

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') || 'USD'
    setCurrency(savedCurrency)

    if (savedCurrency !== 'MXN') {
      fetch(`/api/exchange-rate?currency=${savedCurrency}`)
        .then((res) => res.json())
        .then((data) => setRate(data.rate))
        .catch(() => setRate(null))
    }

    fetch('/api/log-evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'ficha_vista',
        metadata: { negocio_id: negocio.id },
      }),
    })
  }, [])

  function convertirRango(rango: string): string {
    if (!rate || currency === 'MXN') return `$${rango} MXN`
    const [min, max] = rango.split('-').map(Number)
    const minConv = (min * rate).toFixed(2)
    const maxConv = (max * rate).toFixed(2)
    return `${minConv}–${maxConv} ${currency}`
  }

  function abrirEnGoogleMaps() {
    const url = negocio.latitud && negocio.longitud
      ? `https://www.google.com/maps/dir/?api=1&destination=${negocio.latitud},${negocio.longitud}&travelmode=walking`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.direccion)}`
    window.open(url, '_blank')
  }

  return (
    <div className="card max-w-md w-full overflow-hidden">

      {/* Banda de gradiente superior */}
      <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #0891B2 0%, #0EA5C9 60%, #EA580C 100%)' }} />

      <div className="p-6 flex flex-col gap-5">

        {/* Encabezado */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-text-main">{negocio.nombre}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{negocio.direccion}</p>
          </div>
          {negocio.estado === 'aprobado' && (
            <span
              className="text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1"
              style={{ background: 'linear-gradient(135deg, #EA580C, #C2410C)' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('verificado')}
            </span>
          )}
        </div>

        {/* Distancia al Estadio Azteca */}
        {distanciaKm !== null && (
          <div className="flex items-center gap-1">
            <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
              {/* Walking icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" fill="currentColor"/>
              </svg>
              {distanciaKm >= 1
                ? `${t('a')} ${distanciaKm.toFixed(1)} km ${t('distanciaEstadio')}`
                : `${t('a')} ${Math.round(distanciaKm * 1000)} m ${t('distanciaEstadio')}`
              }
            </span>
          </div>
        )}

        {/* Horario */}
        {negocio.horario && (
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded-full bg-primary/40" />
              {t('horario')}
            </p>
            <p className="text-sm text-text-main">{negocio.horario}</p>
          </div>
        )}

        {/* Rango de precios */}
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded-full bg-primary/40" />
            {t('preciosReferencia')}
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
              {/* Tag/price icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" fill="currentColor"/>
              </svg>
              ${negocio.rango_precios} MXN
            </span>
            {rate && currency !== 'MXN' && (
              <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                {convertirRango(negocio.rango_precios)}
              </span>
            )}
          </div>
        </div>

        {/* Métodos de pago */}
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded-full bg-primary/40" />
            {t('metodosPago')}
          </p>
          <div className="flex flex-wrap gap-2">
            {negocio.metodos_pago.map((metodo) => (
              <span key={metodo} className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                {t(`metodosPagoMap.${metodo}` as any)}
              </span>
            ))}
          </div>
        </div>

        {/* Idiomas de atención */}
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded-full bg-primary/40" />
            {t('idiomasAtencion')}
          </p>
          <div className="flex flex-wrap gap-2">
            {negocio.idiomas_atencion.map((idioma) => (
              <span key={idioma} className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                {t(`idiomasMap.${idioma}` as any)}
              </span>
            ))}
          </div>
        </div>

        {/* Accesibilidad */}
        {negocio.accesibilidad.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded-full bg-primary/40" />
              {t('accesibilidad')}
            </p>
            <div className="flex flex-wrap gap-2">
              {negocio.accesibilidad.map((item) => (
                <span key={item} className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                  {t(`accesibilidadMap.${item}` as any)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 pt-2">
          {negocio.es_gastronomico && (
            <button
              onClick={onTraducirMenu ?? (() => router.push(`/${locale}/scanner`))}
              className="btn-accent flex items-center justify-center gap-2 py-3"
            >
              {/* Camera icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 15.2C10.2 15.2 8.8 13.8 8.8 12S10.2 8.8 12 8.8 15.2 10.2 15.2 12 13.8 15.2 12 15.2zM12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7zM2 13H4V11H2V13zM20 13H22V11H20V13zM11 2V4H13V2H11zM11 20V22H13V20H11z" fill="white"/>
              </svg>
              {t('traducirMenu')}
            </button>
          )}
          <button
            onClick={abrirEnGoogleMaps}
            className="btn-ghost flex items-center justify-center gap-2 py-3"
          >
            {/* Map icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
            {t('comoLlegar')}
          </button>
        </div>

      </div>
    </div>
  )
}
