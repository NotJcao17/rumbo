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

  const categoryEmoji = negocio.es_gastronomico ? '🍽️' : '🛍️'

  return (
    <div className="card-elevated max-w-md w-full overflow-hidden animate-slide-up">

      {/* Header visual con gradiente animado */}
      <div
        className="relative overflow-hidden animate-gradient-x"
        style={{
          height: '96px',
          background: 'linear-gradient(135deg, #0891B2, #0EA5E9, #EA580C, #0891B2)',
          backgroundSize: '300% 300%',
        }}
      >
        {/* Emoji de categoría como fondo decorativo */}
        <span
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
          style={{ fontSize: '64px', opacity: 0.18, filter: 'grayscale(0.2)' }}
        >
          {categoryEmoji}
        </span>

        {/* Brillo superior izquierdo */}
        <div
          className="absolute top-0 left-0 w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }}
        />

        {/* Badge verificado — flotando arriba a la izquierda */}
        {negocio.estado === 'aprobado' && (
          <span
            className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(8px)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('verificado')}
          </span>
        )}

        {/* Distancia — flotando arriba a la derecha */}
        {distanciaKm !== null && (
          <span
            className="absolute top-3 right-3 text-text-main px-2.5 py-1.5 rounded-full flex flex-col items-end leading-tight"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-xs font-bold flex items-center gap-1">
              📍 {distanciaKm >= 1
                ? `${distanciaKm.toFixed(1)} km`
                : `${Math.round(distanciaKm * 1000)} m`}
            </span>
            <span className="text-[9px] font-medium text-text-secondary">{t('distanciaEstadio')}</span>
          </span>
        )}

        {/* Nombre del negocio sobre el header — parte baja */}
        <div
          className="absolute bottom-0 left-0 right-0 px-5 pb-3 pt-6"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
        >
          <h2 className="font-display text-xl font-bold text-white leading-tight drop-shadow">
            {negocio.nombre}
          </h2>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* Dirección */}
        <p className="text-sm text-text-secondary flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
          {negocio.direccion}
        </p>

        {/* Horario */}
        {negocio.horario && (
          <InfoSection label={t('horario')} icon="🕐">
            <p className="text-sm text-text-main">{negocio.horario}</p>
          </InfoSection>
        )}

        {/* Rango de precios */}
        <InfoSection label={t('preciosReferencia')} icon="💰">
          <div className="flex gap-2 flex-wrap">
            <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full font-medium">
              ${negocio.rango_precios} MXN
            </span>
            {rate && currency !== 'MXN' && (
              <span className="bg-accent-soft text-accent-text text-sm px-3 py-1 rounded-full font-medium">
                {convertirRango(negocio.rango_precios)}
              </span>
            )}
          </div>
        </InfoSection>

        {/* Métodos de pago */}
        <InfoSection label={t('metodosPago')} icon="💳">
          <div className="flex flex-wrap gap-2">
            {negocio.metodos_pago.map((metodo) => (
              <span key={metodo} className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                {t(`metodosPagoMap.${metodo}` as any)}
              </span>
            ))}
          </div>
        </InfoSection>

        {/* Idiomas de atención */}
        <InfoSection label={t('idiomasAtencion')} icon="🌐">
          <div className="flex flex-wrap gap-2">
            {negocio.idiomas_atencion.map((idioma) => (
              <span key={idioma} className="bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full">
                {t(`idiomasMap.${idioma}` as any)}
              </span>
            ))}
          </div>
        </InfoSection>

        {/* Accesibilidad */}
        {negocio.accesibilidad.length > 0 && (
          <InfoSection label={t('accesibilidad')} icon="♿">
            <div className="flex flex-wrap gap-2">
              {negocio.accesibilidad.map((item) => (
                <span key={item} className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                  {t(`accesibilidadMap.${item}` as any)}
                </span>
              ))}
            </div>
          </InfoSection>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 pt-1">
          {negocio.es_gastronomico && (
            <button
              onClick={onTraducirMenu ?? (() => router.push(`/${locale}/scanner`))}
              className="btn-accent flex items-center justify-center gap-2 py-3 text-base"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 15.2C10.2 15.2 8.8 13.8 8.8 12S10.2 8.8 12 8.8 15.2 10.2 15.2 12 13.8 15.2 12 15.2zM12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7zM2 13H4V11H2V13zM20 13H22V11H20V13zM11 2V4H13V2H11zM11 20V22H13V20H11z" fill="white"/>
              </svg>
              {t('traducirMenu')}
            </button>
          )}
          <button
            onClick={abrirEnGoogleMaps}
            className="btn-ghost flex items-center justify-center gap-2 py-3 text-base"
          >
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

function InfoSection({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        {label}
      </p>
      {children}
    </div>
  )
}
