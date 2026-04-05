'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

// Tipo que describe la forma de un negocio (igual que la BD)
type Negocio = {
  id: string
  nombre: string
  direccion: string //SE DEJA STRING O EL TIPO GEOGRÁFICO(o eso solo es en supabase?)
  rango_precios: string
  metodos_pago: string[]
  idiomas_atencion: string[]
  accesibilidad: string[]
  horario: string
  es_gastronomico: boolean
  estado: string
}

// Mapeos de valores de BD a texto legible y emojis
const METODOS_PAGO_LABELS: Record<string, string> = {
  efectivo: '💵 Efectivo',
  tarjeta_debito: '💳 Débito',
  tarjeta_credito: '💳 Crédito',
  transferencia: '📲 Transferencia',
}

const IDIOMAS_LABELS: Record<string, string> = {
  es: '🇲🇽 Español',
  en: '🇺🇸 English',
  de: '🇩🇪 Deutsch',
}

const ACCESIBILIDAD_LABELS: Record<string, string> = {
  rampa: '♿ Rampa',
  bano_accesible: '🚻 Baño accesible',
  menu_braille: '👆 Menú braille',
  espacio_amplio: '↔️ Espacio amplio',
}

type Props = {
  negocio: Negocio
}

export default function BusinessCard({ negocio }: Props) {
  const [rate, setRate] = useState<number | null>(null)
  const [currency, setCurrency] = useState('USD')  //useState es por default?
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => { //useEffect se utiliza para efectos secundarios, ej: llamadas a API, suscripciones 
  // o manipulación de DOM tras el renderizado de componentes funcionales

    // Leemos la moneda que eligió el turista en el onboarding
    const savedCurrency = localStorage.getItem('currency') || 'USD'
    setCurrency(savedCurrency)

    if (savedCurrency !== 'MXN') { // No necesitamos conversión
        fetch(`/api/exchange-rate?currency=${savedCurrency}`)
      .then((res) => res.json())
      .then((data) => setRate(data.rate))
      .catch(() => setRate(null))
    } 

    // Consultamos nuestra API route
    //SÍ CONSULTAMOS O USAMOS LA VARIABLE CACHE QUE HABÍAMOS HECHO??
    fetch('/api/log-evento',{
        method: 'POST',
        headers: {'contentType': 'application/json'},
        body: JSON.stringify({
            tipo: 'ficha_vista',
            metadata: {negocio_id: negocio.id},
        }),
    })
  }, [])

  
  // Convierte el rango "25-60" a la moneda del turista
  function convertirRango(rango: string): string {
    if (!rate || currency === 'MXN') return `$${rango} MXN`
    const [min, max] = rango.split('-').map(Number) //separa la lista por "-"
    const minConv = (min * rate).toFixed(2)
    const maxConv = (max * rate).toFixed(2)
    return `${minConv}–${maxConv} ${currency}`
  }

  function abrirEnGoogleMaps() {
    // Por ahora abre la dirección en texto — cuando tengamos coords reales usaremos lat/lng
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.direccion)}`
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
            ✓ Verificado
          </span>
        )}
      </div>

      {/* Horario */}
      {negocio.horario && (
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Horario</p>
          <p className="text-sm text-text-main">{negocio.horario}</p>
        </div>
      )}

      {/* Rango de precios */}
      <div>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Precios de referencia</p>
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
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Métodos de pago</p>
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
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Idiomas de atención</p>
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
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Accesibilidad</p>
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
            onClick={() => router.push(`/${locale}/scanner`)}
            className="w-full bg-accent text-white py-3 rounded-xl font-medium"
          >
            📷 Traducir menú
          </button>
        )}
        <button
          onClick={abrirEnGoogleMaps}
          className="w-full border-2 border-primary text-primary py-3 rounded-xl font-medium"
        >
          🗺️ Cómo llegar
        </button>
      </div>

    </div>
  )
}