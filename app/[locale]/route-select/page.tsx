'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase-client'

interface OpcionNegocio {
  categoria_id: string
  categoria_nombre: string
  negocio_id: string
  nombre: string
  direccion: string
  rango_precios: string
  metodos_pago: string[]
  idiomas_atencion?: string[]
  accesibilidad?: string[]
  longitud: number
  latitud: number
  distancia: number
}

interface PasoCategoria {
  categoria_id: string
  categoria_nombre: string
  opciones: OpcionNegocio[]
}

export default function RouteSelect() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const tCats = useTranslations('categories')
  const tSelect = useTranslations('routeSelect')
  const tCard = useTranslations('businessCard')

  const [pasos, setPasos] = useState<PasoCategoria[]>([])
  const [pasoActual, setPasoActual] = useState(0)
  const [seleccionados, setSeleccionados] = useState<OpcionNegocio[]>([])
  const [cargando, setCargando] = useState(true)
  const [gpsUsado, setGpsUsado] = useState(false)

  const categorias = searchParams.get('categorias')
  const zonaLat = searchParams.get('zona_lat')
  const zonaLng = searchParams.get('zona_lng')
  const zonaId = searchParams.get('zona_id')

  const METODOS_PAGO_LABELS: Record<string, string> = {
    efectivo: tCard('efectivo'),
    tarjeta: tCard('tarjeta'),
    transferencia: tCard('transferencia'),
  }

  const IDIOMAS_LABELS: Record<string, string> = {
    es: 'Español',
    en: 'English',
    de: 'Deutsch',
  }

  function normalizarMetodos(metodos: string[]): string[] {
    const set = new Set(metodos.map(m =>
      (m === 'tarjeta_debito' || m === 'tarjeta_credito') ? 'tarjeta' : m
    ))
    return Array.from(set)
  }

  useEffect(() => {
    async function cargarOpciones() {
      if (!categorias) return

      const categoriaIds = categorias.split(',')

      let lng = zonaLng ? parseFloat(zonaLng) : -99.1735
      let lat = zonaLat ? parseFloat(zonaLat) : 19.4130

      if (zonaId === 'gps') {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lng = pos.coords.longitude
              lat = pos.coords.latitude
              setGpsUsado(true)
              resolve()
            },
            () => resolve()
          )
        })
      }

      const { data, error } = await supabase.rpc('get_opciones_por_categoria', {
        categoria_ids: categoriaIds,
        user_lng: lng,
        user_lat: lat,
      })

      if (error || !data) {
        console.error('Error cargando opciones:', error)
        return
      }

      const agrupado: Record<string, PasoCategoria> = {}
      data.forEach((item: OpcionNegocio) => {
        if (!agrupado[item.categoria_id]) {
          agrupado[item.categoria_id] = {
            categoria_id: item.categoria_id,
            categoria_nombre: item.categoria_nombre,
            opciones: [],
          }
        }
        agrupado[item.categoria_id].opciones.push(item)
      })

      const pasosOrdenados = categoriaIds
        .map(id => agrupado[id])
        .filter(Boolean)

      setPasos(pasosOrdenados)
      setCargando(false)
    }

    cargarOpciones()
  }, [])

  function seleccionarNegocio(negocio: OpcionNegocio) {
    const nuevosSeleccionados = [...seleccionados, negocio]
    setSeleccionados(nuevosSeleccionados)

    if (pasoActual < pasos.length - 1) {
      setPasoActual(pasoActual + 1)
    } else {
      const ids = nuevosSeleccionados.map(n => n.negocio_id).join(',')
      const params = new URLSearchParams({
        negocio_ids: ids,
        zona_id: zonaId || 'gps',
        ...(zonaLat && { zona_lat: zonaLat }),
        ...(zonaLng && { zona_lng: zonaLng }),
      })
      router.push(`/${locale}?${params.toString()}`)
    }
  }

  function volverAtras() {
    if (pasoActual === 0) {
      router.back()
    } else {
      setPasoActual(pasoActual - 1)
      setSeleccionados(prev => prev.slice(0, -1))
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-secondary">{tSelect('buscando')}</p>
      </div>
    )
  }

  const paso = pasos[pasoActual]
  const idsSeleccionados = new Set(seleccionados.map(s => s.negocio_id))
  const opcionesDisponibles = paso.opciones.filter(o => !idsSeleccionados.has(o.negocio_id))

  return (
    <div className="min-h-screen bg-bg-page pb-24 px-4 pt-6">

      {/* Encabezado */}
      <div className="mb-6">
        <button
          onClick={volverAtras}
          className="text-primary text-sm font-medium cursor-pointer mb-4 flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
          </svg>
          {tSelect('atras')}
        </button>

        {/* Barra de progreso por pasos */}
        <div className="flex gap-1.5 mb-4">
          {pasos.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < pasoActual
                  ? 'bg-primary'
                  : i === pasoActual
                  ? 'bg-primary/50'
                  : 'bg-border-color'
              }`}
            />
          ))}
        </div>

        <p className="text-text-secondary text-xs mb-1">
          {tSelect('paso', { n: pasoActual + 1, total: pasos.length })}
        </p>
        <h1 className="font-display text-xl font-bold text-text-main">
          {tSelect('dondePrefières', { categoria: tCats(paso.categoria_nombre as any) })}
        </h1>
      </div>

      {/* Tarjetas de opciones */}
      <div className="flex flex-col gap-3">
        {opcionesDisponibles.map((opcion) => (
          <button
            key={opcion.negocio_id}
            onClick={() => seleccionarNegocio(opcion)}
            className="card card-hover p-4 text-left w-full"
          >
            <p className="font-display text-text-main font-semibold mb-1 text-[15px]">
              {opcion.nombre}
            </p>
            <p className="text-text-secondary text-sm mb-3">{opcion.direccion}</p>
            <div className="flex gap-1.5 flex-wrap">

              {/* Precio */}
              <span className="bg-surface text-text-main text-xs px-2.5 py-1 rounded-full">
                ${opcion.rango_precios} MXN
              </span>

              {/* Distancia */}
              {gpsUsado && opcion.distancia > 0 && (
                <span className="bg-surface text-text-main text-xs px-2.5 py-1 rounded-full">
                  {Math.round(opcion.distancia)} m
                </span>
              )}

              {/* Idiomas */}
              {opcion.idiomas_atencion?.map(idioma => (
                <span key={idioma} className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
                  {IDIOMAS_LABELS[idioma] ?? idioma}
                </span>
              ))}

              {/* Métodos de pago */}
              {normalizarMetodos(opcion.metodos_pago).map(metodo => (
                <span key={metodo} className="bg-accent-soft text-accent-text text-xs px-2.5 py-1 rounded-full">
                  {METODOS_PAGO_LABELS[metodo] ?? metodo}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
