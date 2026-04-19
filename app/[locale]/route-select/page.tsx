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
      <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-4 border-surface animate-spin-slow"
          style={{ borderTopColor: '#0891B2' }}
        />
        <p className="text-text-secondary font-medium animate-fade-in">{tSelect('buscando')}</p>
      </div>
    )
  }

  const paso = pasos[pasoActual]
  const idsSeleccionados = new Set(seleccionados.map(s => s.negocio_id))
  const opcionesDisponibles = paso.opciones.filter(o => !idsSeleccionados.has(o.negocio_id))

  return (
    <div className="min-h-screen bg-bg-page pb-24 px-4 pt-6">

      {/* Encabezado */}
      <div className="mb-6 animate-slide-up">
        <button
          onClick={volverAtras}
          className="text-primary text-sm font-semibold cursor-pointer mb-5 flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
          </svg>
          {tSelect('atras')}
        </button>

        {/* Journey dots — visualización de progreso */}
        <div className="flex items-center gap-2 mb-5">
          {pasos.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`transition-all duration-400 flex items-center justify-center font-bold text-xs rounded-full ${
                i < pasoActual
                  ? 'w-7 h-7 bg-primary text-white shadow-[0_2px_8px_rgba(8,145,178,0.4)]'
                  : i === pasoActual
                  ? 'w-8 h-8 bg-primary text-white shadow-[0_4px_12px_rgba(8,145,178,0.45)] ring-4 ring-primary/20'
                  : 'w-6 h-6 bg-border-color text-text-secondary'
              }`}>
                {i < pasoActual ? '✓' : i + 1}
              </div>
              {i < pasos.length - 1 && (
                <div className={`h-0.5 flex-1 w-6 rounded-full transition-all duration-300 ${
                  i < pasoActual ? 'bg-primary' : 'bg-border-color'
                }`} />
              )}
            </div>
          ))}
        </div>

        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">
          {tSelect('paso', { n: pasoActual + 1, total: pasos.length })}
        </p>
        <h1 className="font-display text-2xl font-bold text-gradient-primary leading-tight">
          {tSelect('dondePrefières', { categoria: tCats(paso.categoria_nombre as any) })}
        </h1>
      </div>

      {/* Tarjetas de opciones con entrada escalonada */}
      <div className="flex flex-col gap-3">
        {opcionesDisponibles.map((opcion, i) => (
          <button
            key={opcion.negocio_id}
            onClick={() => seleccionarNegocio(opcion)}
            className="card-elevated card-hover p-5 text-left w-full animate-slide-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {/* Barra de gradiente superior */}
            <div
              className="h-1 w-16 rounded-full mb-3 animate-gradient-x"
              style={{ background: 'linear-gradient(90deg, #0891B2, #EA580C)', backgroundSize: '200% 100%' }}
            />
            <p className="font-display text-text-main font-bold mb-0.5 text-base">
              {opcion.nombre}
            </p>
            <p className="text-text-secondary text-sm mb-3">{opcion.direccion}</p>
            <div className="flex gap-1.5 flex-wrap">

              {/* Precio */}
              <span className="bg-surface text-text-main text-xs px-3 py-1 rounded-full font-medium">
                💰 ${opcion.rango_precios} MXN
              </span>

              {/* Distancia */}
              {gpsUsado && opcion.distancia > 0 && (
                <span className="bg-surface text-text-main text-xs px-3 py-1 rounded-full font-medium">
                  📍 {Math.round(opcion.distancia)} m
                </span>
              )}

              {/* Idiomas */}
              {opcion.idiomas_atencion?.map(idioma => (
                <span key={idioma} className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                  🌐 {IDIOMAS_LABELS[idioma] ?? idioma}
                </span>
              ))}

              {/* Métodos de pago */}
              {normalizarMetodos(opcion.metodos_pago).map(metodo => (
                <span key={metodo} className="bg-accent-soft text-accent-text text-xs px-3 py-1 rounded-full font-medium">
                  {METODOS_PAGO_LABELS[metodo] ?? metodo}
                </span>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <span className="text-primary text-xs font-bold flex items-center gap-1">
                Elegir →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
