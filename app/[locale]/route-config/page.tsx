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

  return (
    <div className="min-h-screen bg-bg-page pb-24 px-4 pt-6">

      <h1 className="font-display text-2xl font-bold text-text-main mb-6">
        {t('titulo')}
      </h1>

      {/* Selector de número de lugares */}
      <div className="card p-4 mb-4">
        <p className="text-text-main font-medium mb-3">{t('cuantosLugares')}</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const nuevo = Math.max(2, numLugares - 1)
              setNumLugares(nuevo)
              setSeleccionadas(prev => prev.slice(0, nuevo))
            }}
            className="w-9 h-9 rounded-full border border-border-color bg-white text-text-main text-xl font-medium cursor-pointer hover:border-primary hover:bg-surface transition-all duration-150 flex items-center justify-center"
          >
            −
          </button>
          <span className="text-2xl font-bold font-display text-text-main">{numLugares}</span>
          <button
            onClick={() => setNumLugares(n => Math.min(6, n + 1))}
            className="w-9 h-9 rounded-full border border-border-color bg-white text-text-main text-xl font-medium cursor-pointer hover:border-primary hover:bg-surface transition-all duration-150 flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Selector de zona */}
      <div className="card p-4 mb-4">
        <p className="text-text-main font-medium mb-3">{t('desdeZona')}</p>
        <select
          value={zonaSeleccionada.id}
          onChange={(e) => {
            const zona = ZONAS.find(z => z.id === e.target.value)!
            setZonaSeleccionada(zona)
          }}
          className="w-full px-3 py-2.5 rounded-lg border border-border-color text-sm text-text-main bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer transition-all duration-150"
          style={{
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
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

      {/* Checkboxes de categorías */}
      <div className="card p-4 mb-6">
        <p className="text-text-main font-medium mb-4">{t('queQuieresHacer')}</p>

        {cargando ? (
          <p className="text-text-secondary text-sm">{t('cargando')}</p>
        ) : (
          Object.entries(categoriasPorTipo).map(([tipo, cats]) => (
            <div key={tipo} className="mb-4 last:mb-0">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">
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
                      className={`px-3.5 py-1.5 rounded-full border text-sm transition-all duration-150 ${
                        activa
                          ? 'chip-active'
                          : deshabilitada
                          ? 'border-border-color text-text-secondary opacity-40 cursor-not-allowed'
                          : 'border-border-color text-text-secondary hover:border-primary/50 hover:text-text-main cursor-pointer'
                      }`}
                    >
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
      <div className={`rounded-xl px-4 py-3 mb-4 border transition-all duration-300 ${
        listo
          ? 'border-primary bg-gradient-to-r from-surface to-primary/5'
          : 'border-border-color bg-accent-soft'
      }`}>
        <p className={`text-sm text-center ${listo ? 'text-text-main font-medium' : 'text-text-secondary'}`}>
          {listo
            ? t('listoProgreso', { sel: seleccionadas.length, total: numLugares })
            : t('faltanCategorias', { sel: seleccionadas.length, total: numLugares })
          }
        </p>
      </div>

      {/* Botón generar ruta */}
      <button
        onClick={generarRuta}
        disabled={!listo}
        className="btn-primary py-3.5 text-base"
      >
        {t('siguiente')}
      </button>
    </div>
  )
}
