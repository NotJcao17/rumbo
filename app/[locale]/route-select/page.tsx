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
    efectivo: `💵 ${tCard('efectivo')}`,
    tarjeta: `💳 ${tCard('tarjeta')}`,
    transferencia: `📲 ${tCard('transferencia')}`,
  }

  const IDIOMAS_LABELS: Record<string, string> = {
    es: '🇲🇽 Español',
    en: '🇺🇸 English',
    de: '🇩🇪 Deutsch',
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

      // Agrupar por categoría
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
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <p style={{ color: '#888888' }}>{tSelect('buscando')}</p>
      </div>
    )
  }

  const paso = pasos[pasoActual]
  const idsSeleccionados = new Set(seleccionados.map(s => s.negocio_id))
  const opcionesDisponibles = paso.opciones.filter(o => !idsSeleccionados.has(o.negocio_id))

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      padding: '24px 16px',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={volverAtras}
          style={{
            background: 'none',
            border: 'none',
            color: '#0891B2',
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '16px',
          }}
        >
          {tSelect('atras')}
        </button>

        {/* Indicador de progreso */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {pasos.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '999px',
                backgroundColor: i <= pasoActual ? '#0891B2' : '#E5E5E5',
              }}
            />
          ))}
        </div>

        <p style={{ color: '#888888', fontSize: '13px', margin: '0 0 4px 0' }}>
          {tSelect('paso', { n: pasoActual + 1, total: pasos.length })}
        </p>
        <h1 style={{ color: '#164E63', fontSize: '20px', fontWeight: 600, margin: 0 }}>
          {tSelect('dondePrefières', { categoria: tCats(paso.categoria_nombre as any) })}
        </h1>
      </div>

      {/* Tarjetas de opciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {opcionesDisponibles.map((opcion) => (
          <button
            key={opcion.negocio_id}
            onClick={() => seleccionarNegocio(opcion)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #E5E5E5',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <p style={{ color: '#164E63', fontWeight: 600, margin: '0 0 4px 0', fontSize: '15px' }}>
              {opcion.nombre}
            </p>
            <p style={{ color: '#888888', fontSize: '13px', margin: '0 0 10px 0' }}>
              {opcion.direccion}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {/* Precio */}
              <span style={{
                backgroundColor: '#CFFAFE',
                color: '#164E63',
                fontSize: '12px',
                padding: '3px 10px',
                borderRadius: '999px',
              }}>
                ${opcion.rango_precios} MXN
              </span>

              {/* Distancia — solo si GPS fue exitoso */}
              {gpsUsado && opcion.distancia > 0 && (
                <span style={{
                  backgroundColor: '#CFFAFE',
                  color: '#164E63',
                  fontSize: '12px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}>
                  {Math.round(opcion.distancia)} m
                </span>
              )}

              {/* Idiomas de atención */}
              {opcion.idiomas_atencion?.map(idioma => (
                <span key={idioma} style={{
                  backgroundColor: '#F5F3FF',
                  color: '#6D28D9',
                  fontSize: '12px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}>
                  {IDIOMAS_LABELS[idioma] ?? idioma}
                </span>
              ))}

              {/* Métodos de pago (débito y crédito unificados como "tarjeta") */}
              {normalizarMetodos(opcion.metodos_pago).map(metodo => (
                <span key={metodo} style={{
                  backgroundColor: '#FFF7ED',
                  color: '#EA580C',
                  fontSize: '12px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}>
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
