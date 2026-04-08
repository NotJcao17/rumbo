'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { calcularDistanciaKm } from '@/lib/helpers'

// Coordenadas del Estadio Azteca
const ESTADIO_LAT = 19.3029
const ESTADIO_LNG = -99.1505

// Tipo que describe la forma de un negocio (igual que la BD)
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
  latitud?: number   // opcional porque no todos los contextos lo pasan aún
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

  // Mapeos de valores de BD a texto legible — usan t() para traducir
  const METODOS_PAGO_LABELS: Record<string, string> = {
    efectivo: `💵 ${t('efectivo')}`,
    tarjeta_debito: `💳 ${t('tarjetaDebito')}`,
    tarjeta_credito: `💳 ${t('tarjetaCredito')}`,
    transferencia: `📲 ${t('transferencia')}`,
  }

  const IDIOMAS_LABELS: Record<string, string> = {
    es: '🇲🇽 Español',
    en: '🇺🇸 English',
    de: '🇩🇪 Deutsch',
  }

  const ACCESIBILIDAD_LABELS: Record<string, string> = {
    rampa: `♿ ${t('rampa')}`,
    bano_accesible: `🚻 ${t('banoAccesible')}`,
    menu_braille: `👆 ${t('menuBraille')}`,
    espacio_amplio: `↔️ ${t('espacioAmplio')}`,
  }

  // Calcular distancia al Estadio Azteca si tenemos coordenadas
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

    // Registrar que el turista vio esta ficha
    fetch('/api/log-evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // era 'contentType', estaba mal
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
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5 shadow-sm border border-border-color max-w-md w-full">

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-main">{negocio.nombre}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{negocio.direccion}</p>
        </div>
        {negocio.estado === 'aprobado' && (
          <span className="bg-accent text-white text-xs font-medium px-2 py-1 rounded-full">
            ✓ {t('verificado')}
          </span>
        )}
      </div>

      {/* Distancia al Estadio Azteca */}
      {distanciaKm !== null && (
        <div className="flex items-center gap-1">
          <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
            ⚽ {distanciaKm >= 1
              ? `${t('a')} ${distanciaKm.toFixed(1)} km ${t('distanciaEstadio')}`
              : `${t('a')} ${Math.round(distanciaKm * 1000)} m ${t('distanciaEstadio')}`
            }
          </span>
        </div>
      )}

      {/* Horario */}
      {negocio.horario && (
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
            {t('horario')}
          </p>
          <p className="text-sm text-text-main">{negocio.horario}</p>
        </div>
      )}

      {/* Rango de precios */}
      <div>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
          {t('preciosReferencia')}
        </p>
        <div className="flex gap-2">
          <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
            🇲🇽 ${negocio.rango_precios} MXN
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
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
          {t('metodosPago')}
        </p>
        <div className="flex flex-wrap gap-2">
          {negocio.metodos_pago.map((metodo) => (
            <span key={metodo} className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
              {METODOS_PAGO_LABELS[metodo] || metodo}
            </span>
          ))}
        </div>
      </div>

      {/* Idiomas de atención */}
      <div>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
          {t('idiomasAtencion')}
        </p>
        <div className="flex flex-wrap gap-2">
          {negocio.idiomas_atencion.map((idioma) => (
            <span key={idioma} className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
              {IDIOMAS_LABELS[idioma] || idioma}
            </span>
          ))}
        </div>
      </div>

      {/* Accesibilidad */}
      {negocio.accesibilidad.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
            {t('accesibilidad')}
          </p>
          <div className="flex flex-wrap gap-2">
            {negocio.accesibilidad.map((item) => (
              <span key={item} className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                {ACCESIBILIDAD_LABELS[item] || item}
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
            className="w-full bg-accent text-white py-3 rounded-xl font-medium"
          >
            📷 {t('traducirMenu')}
          </button>
        )}
        <button
          onClick={abrirEnGoogleMaps}
          className="w-full border-2 border-primary text-primary py-3 rounded-xl font-medium"
        >
          🗺️ {t('comoLlegar')}
        </button>
      </div>

    </div>
  )
}