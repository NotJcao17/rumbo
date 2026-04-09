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

  // Mapeo de tipo de BD → clave de traducción
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      padding: '24px 16px 80px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <h1 style={{ color: '#164E63', fontSize: '22px', fontWeight: 600, marginBottom: '24px' }}>
        {t('titulo')}
      </h1>

      {/* Selector de número de lugares */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        border: '1px solid #E5E5E5',
      }}>
        <p style={{ color: '#164E63', fontWeight: 500, marginBottom: '12px' }}>
          {t('cuantosLugares')}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => {
              const nuevo = Math.max(2, numLugares - 1)
              setNumLugares(nuevo)
              setSeleccionadas(prev => prev.slice(0, nuevo))
            }}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: '1px solid #E5E5E5', backgroundColor: 'white',
              fontSize: '20px', cursor: 'pointer', color: '#164E63',
            }}
          >−</button>
          <span style={{ fontSize: '24px', fontWeight: 600, color: '#164E63' }}>
            {numLugares}
          </span>
          <button
            onClick={() => setNumLugares(n => Math.min(6, n + 1))}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: '1px solid #E5E5E5', backgroundColor: 'white',
              fontSize: '20px', cursor: 'pointer', color: '#164E63',
            }}
          >+</button>
        </div>
      </div>

      {/* Selector de zona */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        border: '1px solid #E5E5E5',
      }}>
        <p style={{ color: '#164E63', fontWeight: 500, marginBottom: '12px' }}>
          {t('desdeZona')}
        </p>
        <select
          value={zonaSeleccionada.id}
          onChange={(e) => {
            const zona = ZONAS.find(z => z.id === e.target.value)!
            setZonaSeleccionada(zona)
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #E5E5E5',
            fontSize: '14px',
            color: '#164E63',
            backgroundColor: 'white',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            cursor: 'pointer',
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid #E5E5E5',
      }}>
        <p style={{ color: '#164E63', fontWeight: 500, marginBottom: '16px' }}>
          {t('queQuieresHacer')}
        </p>

        {cargando ? (
          <p style={{ color: '#888888', fontSize: '14px' }}>{t('cargando')}</p>
        ) : (
          Object.entries(categoriasPorTipo).map(([tipo, cats]) => (
            <div key={tipo} style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#888888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {TIPO_KEYS[tipo] ? t(TIPO_KEYS[tipo] as any) : tipo}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {cats.map(cat => {
                  const activa = seleccionadas.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategoria(cat.id)}
                      disabled={!seleccionadas.includes(cat.id) && seleccionadas.length >= numLugares}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: '1px solid',
                        borderColor: activa ? '#0891B2' : '#E5E5E5',
                        backgroundColor: activa ? '#CFFAFE' : 'white',
                        color: activa ? '#164E63' : '#888888',
                        fontSize: '14px',
                        cursor: (!seleccionadas.includes(cat.id) && seleccionadas.length >= numLugares)
                          ? 'not-allowed'
                          : 'pointer',
                        fontWeight: activa ? 500 : 400,
                        opacity: (!seleccionadas.includes(cat.id) && seleccionadas.length >= numLugares)
                          ? 0.4
                          : 1,
                      }}
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

      {/* Mensaje de progreso */}
      <div style={{
        backgroundColor: seleccionadas.length === numLugares ? '#CFFAFE' : '#FFF7ED',
        border: `1px solid ${seleccionadas.length === numLugares ? '#0891B2' : '#E5E5E5'}`,
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}>
        <p style={{
          color: seleccionadas.length === numLugares ? '#164E63' : '#888888',
          fontSize: '13px',
          margin: 0,
          textAlign: 'center',
        }}>
          {seleccionadas.length === numLugares
            ? t('listoProgreso', { sel: seleccionadas.length, total: numLugares })
            : t('faltanCategorias', { sel: seleccionadas.length, total: numLugares })
          }
        </p>
      </div>

      {/* Botón generar ruta */}
      <button
        onClick={generarRuta}
        disabled={seleccionadas.length !== numLugares}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: seleccionadas.length !== numLugares ? '#E5E5E5' : '#0891B2',
          color: seleccionadas.length !== numLugares ? '#888888' : 'white',
          fontSize: '16px',
          fontWeight: 600,
          cursor: seleccionadas.length !== numLugares ? 'not-allowed' : 'pointer',
        }}
      >
        {t('siguiente')}
      </button>
    </div>
  )
}
