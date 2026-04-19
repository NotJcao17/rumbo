'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase-client'


const ZONAS = [
  { id: 'gps', lat: null, lng: null },
  { id: 'condesa_roma', nombre: 'Condesa / Roma', lat: 19.4130, lng: -99.1735 },
  { id: 'centro', nombre: 'Centro Histórico', lat: 19.4326, lng: -99.1332 },
  { id: 'coyoacan', nombre: 'Coyoacán', lat: 19.3500, lng: -99.1627 },
  { id: 'polanco', nombre: 'Polanco', lat: 19.4335, lng: -99.1955 },
]

interface Categoria {
  id: string
  nombre: string
  tipo: string
}

export default function RouteConfig() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('routeConfig')
  const tCats = useTranslations('categories')

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [seleccionadas, setSeleccionadas] = useState<string[]>([])
  const [numLugares, setNumLugares] = useState(3)
  const [cargando, setCargando] = useState(true)
  const [zonaSeleccionada, setZonaSeleccionada] = useState(ZONAS[0])
  const [gpsDisponible, setGpsDisponible] = useState(true)

  const TIPO_KEYS: Record<string, string> = {
    gastronomia: 'tipoGastronomia',
    cultura: 'tipoCultura',
    compras: 'tipoCompras',
    entretenimiento: 'tipoEntretenimiento',
  }

  useEffect(() => {
    async function cargarCategorias() {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('tipo')

      if (!error && data) {
        setCategorias(data)
      }
      setCargando(false)
    }

    cargarCategorias()
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsDisponible(false)
      setZonaSeleccionada(ZONAS[1])
      return
    }
    navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then(result => {
      if (result.state === 'denied') {
        setGpsDisponible(false)
        setZonaSeleccionada(ZONAS[1])
      }
    }).catch(() => {/* permissions API no disponible, asumir que sí hay GPS */})
  }, [])

  function toggleCategoria(id: string) {
    setSeleccionadas(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id)
      if (prev.length >= numLugares) return prev
      return [...prev, id]
    })
  }

  function generarRuta() {
    if (seleccionadas.length !== numLugares) return

    const params = new URLSearchParams({
      categorias: seleccionadas.join(','),
      num: numLugares.toString(),
      zona_id: zonaSeleccionada.id,
      ...(zonaSeleccionada.lat !== null && {
        zona_lat: zonaSeleccionada.lat.toString(),
        zona_lng: zonaSeleccionada.lng!.toString(),
      }),
    })

    router.push(`/${locale}/route-select?${params.toString()}`)
  }

  const categoriasPorTipo = categorias.reduce<Record<string, Categoria[]>>(
    (acc, cat) => {
      if (!acc[cat.tipo]) acc[cat.tipo] = []
      acc[cat.tipo].push(cat)
      return acc
    },
    {}
  )

  const listo = seleccionadas.length === numLugares

  const TIPO_EMOJIS: Record<string, string> = {
    gastronomia: '🍽️',
    cultura: '🏛️',
    compras: '🛍️',
    entretenimiento: '🎭',
  }

  return (
    <div className="min-h-screen bg-bg-page pb-28 px-4 pt-6">

      {/* Header con gradiente de texto */}
      <div className="mb-6 animate-slide-up">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">🧭 Rumbo</p>
        <h1 className="font-display text-3xl font-bold text-gradient-primary leading-tight">
          {t('titulo')}
        </h1>
      </div>

      {/* Selector de número de lugares */}
      <div className="card-elevated p-5 mb-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <p className="text-text-main font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">📍</span> {t('cuantosLugares')}
        </p>
        <div className="flex items-center gap-5">
          <button
            onClick={() => {
              const nuevo = Math.max(2, numLugares - 1)
              setNumLugares(nuevo)
              setSeleccionadas(prev => prev.slice(0, nuevo))
            }}
            className="w-11 h-11 rounded-full border-2 border-border-color bg-white text-text-main text-2xl font-medium cursor-pointer hover:border-primary hover:bg-surface hover:scale-110 active:scale-95 transition-all duration-150 flex items-center justify-center shadow-sm"
          >
            −
          </button>
          <span className="text-4xl font-bold font-display text-gradient-primary min-w-[2ch] text-center">{numLugares}</span>
          <button
            onClick={() => setNumLugares(n => Math.min(6, n + 1))}
            className="w-11 h-11 rounded-full border-2 border-border-color bg-white text-text-main text-2xl font-medium cursor-pointer hover:border-primary hover:bg-surface hover:scale-110 active:scale-95 transition-all duration-150 flex items-center justify-center shadow-sm"
          >
            +
          </button>
          <span className="text-sm text-text-secondary ml-1">{t('lugares')}</span>
        </div>
      </div>

      {/* Selector de zona */}
      <div className="card-elevated p-5 mb-4 animate-slide-up" style={{ animationDelay: '120ms' }}>
        <p className="text-text-main font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">🗺️</span> {t('desdeZona')}
        </p>
        <select
          value={zonaSeleccionada.id}
          onChange={(e) => {
            const zona = ZONAS.find(z => z.id === e.target.value)!
            setZonaSeleccionada(zona)
          }}
          className="w-full px-4 py-3 rounded-xl border-2 border-border-color text-sm text-text-main bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer transition-all duration-150 font-medium"
          style={{
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230891B2' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
          }}
        >
          {ZONAS.map(zona => (
            <option key={zona.id} value={zona.id} disabled={zona.id === 'gps' && !gpsDisponible}>
              {zona.id === 'gps'
                ? `📍 ${t('ubicacionActual')}${!gpsDisponible ? ` ${t('gpsNoDisponible')}` : ''}`
                : `🗺️ ${'nombre' in zona ? zona.nombre : ''}`}
            </option>
          ))}
        </select>
      </div>

      {/* Chips de categorías */}
      <div className="card-elevated p-5 mb-5 animate-slide-up" style={{ animationDelay: '180ms' }}>
        <p className="text-text-main font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">✨</span> {t('queQuieresHacer')}
        </p>

        {cargando ? (
          <p className="text-text-secondary text-sm">{t('cargando')}</p>
        ) : (
          Object.entries(categoriasPorTipo).map(([tipo, cats]) => (
            <div key={tipo} className="mb-5 last:mb-0">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span>{TIPO_EMOJIS[tipo] ?? '•'}</span>
                {TIPO_KEYS[tipo] ? t(TIPO_KEYS[tipo] as any) : tipo}
              </p>
              <div className="flex flex-wrap gap-2">
                {cats.map(cat => {
                  const activa = seleccionadas.includes(cat.id)
                  const deshabilitada = !seleccionadas.includes(cat.id) && seleccionadas.length >= numLugares
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategoria(cat.id)}
                      disabled={deshabilitada}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                        activa
                          ? 'chip-active animate-scale-in'
                          : deshabilitada
                          ? 'border-border-color text-text-secondary opacity-35 cursor-not-allowed'
                          : 'border-border-color text-text-secondary hover:border-primary/60 hover:text-text-main hover:bg-surface/60 cursor-pointer hover:scale-105'
                      }`}
                    >
                      {activa && <span className="mr-1">✓</span>}
                      {tCats(cat.nombre as any)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Panel de progreso */}
      <div className={`rounded-2xl px-5 py-4 mb-4 border-2 transition-all duration-400 animate-slide-up ${
        listo
          ? 'border-primary bg-gradient-to-r from-surface via-white to-primary/5 shadow-[0_4px_20px_rgba(8,145,178,0.15)]'
          : 'border-border-color bg-white'
      }`} style={{ animationDelay: '240ms' }}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
            listo ? 'bg-primary text-white shadow-[0_4px_12px_rgba(8,145,178,0.4)]' : 'bg-surface text-text-secondary'
          }`}>
            {listo ? '✓' : seleccionadas.length}
          </div>
          <p className={`text-sm font-semibold ${listo ? 'text-text-main' : 'text-text-secondary'}`}>
            {listo
              ? t('listoProgreso', { sel: seleccionadas.length, total: numLugares })
              : t('faltanCategorias', { sel: seleccionadas.length, total: numLugares })
            }
          </p>
        </div>
      </div>

      {/* Botón generar ruta */}
      <button
        onClick={generarRuta}
        disabled={!listo}
        className={`btn-primary py-4 text-base font-display tracking-wide ${listo ? 'btn-pulse' : ''}`}
      >
        {t('siguiente')} {listo && '→'}
      </button>
    </div>
  )
}
