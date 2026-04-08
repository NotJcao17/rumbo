'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const DEFAULT_CENTER: [number, number] = [-99.1735, 19.4130]
const DEFAULT_ZOOM = 14

interface Negocio {
  id: string
  nombre: string
  direccion: string
  rango_precios: string
  longitud: number
  latitud: number
  categoria_principal: string
  distancia: number
}

export default function Map() {
  const t = useTranslations('map')
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const userMarker = useRef<mapboxgl.Marker | null>(null)
  const businessMarkers = useRef<mapboxgl.Marker[]>([])
  const routeMarkers = useRef<mapboxgl.Marker[]>([])
  const userLocation = useRef<[number, number] | null>(null)
  const [tiempoTotal, setTiempoTotal] = useState<number | null>(null)
  const [paradas, setParadas] = useState<Negocio[]>([])

  const categorias = searchParams.get('categorias')
  const num = searchParams.get('num')
  const negocioIds = searchParams.get('negocio_ids')
  const zonaLat = searchParams.get('zona_lat')
  const zonaLng = searchParams.get('zona_lng')
  const zonaId = searchParams.get('zona_id')
  const modoRuta = (!!categorias && !!num) || !!negocioIds

  // Guardamos t en un ref para usarlo dentro de funciones async
  // (las funciones async no pueden leer hooks directamente si se llaman fuera del ciclo de React)
  const tRef = useRef(t)
  useEffect(() => { tRef.current = t }, [t])

  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords
          userLocation.current = [longitude, latitude]

          if (!modoRuta) {
            map.current?.flyTo({
              center: [longitude, latitude],
              zoom: DEFAULT_ZOOM,
            })
          }

          const el = document.createElement('div')
          el.style.width = '16px'
          el.style.height = '16px'
          el.style.borderRadius = '50%'
          el.style.backgroundColor = '#3B82F6'
          el.style.border = '3px solid white'
          el.style.boxShadow = '0 0 0 2px #3B82F6'

          userMarker.current = new mapboxgl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(map.current!)
        },
        () => {
          console.log('Geolocalización no disponible')
        }
      )
    }

    map.current.on('load', async () => {
      if (modoRuta) {
        await generarRuta()
      } else {
        await cargarNegocios()
      }
    })

  }, [])

  async function cargarNegocios() {
    // Handler global para que el botón "Ver ficha" dentro del popup HTML pueda navegar
    ;(window as any).rumboVerFicha = (id: string) => {
      router.push(`/${locale}/negocio/${id}`)
    }

    // Obtener tipo de cambio del turista una sola vez
    const savedCurrency = localStorage.getItem('currency') || 'USD'
    let exchangeRate: number | null = null
    if (savedCurrency !== 'MXN') {
      try {
        const res = await fetch(`/api/exchange-rate?currency=${savedCurrency}`)
        const data = await res.json()
        exchangeRate = typeof data.rate === 'number' ? data.rate : null
      } catch {
        exchangeRate = null
      }
    }

    function precioConvertido(rango: string): string {
      if (!exchangeRate || savedCurrency === 'MXN') return ''
      const [min, max] = rango.split('-').map(Number)
      if (isNaN(min) || isNaN(max)) return ''
      return ` (~${(min * exchangeRate).toFixed(0)}–${(max * exchangeRate).toFixed(0)} ${savedCurrency})`
    }

    const { data, error } = await supabase.rpc('get_negocios_con_coordenadas')

    if (error) {
      console.error('Error cargando negocios:', error)
      return
    }

    if (!data || data.length === 0) return

    data.forEach((negocio: Negocio) => {
      const el = document.createElement('div')
      el.style.width = '14px'
      el.style.height = '14px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#EA580C'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 160px;">
          <p style="font-weight: 600; margin: 0 0 4px 0; color: #164E63;">${negocio.nombre}</p>
          <p style="margin: 0 0 2px 0; font-size: 12px; color: #888888;">${tRef.current('categoria')} ${negocio.categoria_principal.replace(/_/g, ' ')}</p>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #888888;">${tRef.current('rangoPrecios')} $${negocio.rango_precios} MXN${precioConvertido(negocio.rango_precios)}</p>
          <button onclick="window.rumboVerFicha('${negocio.id}')" style="width:100%;padding:6px 0;background:#0891B2;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;">Ver ficha →</button>
        </div>
      `)

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([negocio.longitud, negocio.latitud])
        .setPopup(popup)
        .addTo(map.current!)

      businessMarkers.current.push(marker)
    })
  }

  async function generarRuta() {
    let intentos = 0
    while (!userLocation.current && intentos < 20) {
      await new Promise(r => setTimeout(r, 300))
      intentos++
    }

    const [lng, lat] = userLocation.current ?? DEFAULT_CENTER
    let negociosParaRuta: Negocio[] = []

    if (negocioIds) {
      // Flujo paso a paso — negocios ya seleccionados por el usuario
      const ids = negocioIds.split(',')
      const { data, error } = await supabase
        .from('negocios')
        .select('id, nombre, direccion, rango_precios')
        .in('id', ids)

      if (error || !data || data.length === 0) {
        console.error('Error cargando negocios seleccionados:', error)
        return
      }

      // Obtener coordenadas con la función existente
      const { data: coordData, error: coordError } = await supabase
        .rpc('get_negocios_con_coordenadas')

      if (coordError || !coordData) return

      // Filtrar solo los negocios seleccionados manteniendo el orden
      negociosParaRuta = ids.map(id => {
        const negocio = coordData.find((n: Negocio) => n.id === id)
        return negocio
      }).filter(Boolean)

    } else {
      // Flujo automático — selección por categorías
      const usarLng = zonaId !== 'gps' && zonaLng ? parseFloat(zonaLng) : lng
      const usarLat = zonaId !== 'gps' && zonaLat ? parseFloat(zonaLat) : lat
      const categoriaIds = categorias!.split(',')
      const numLugares = parseInt(num!)

      const { data, error } = await supabase.rpc('get_negocios_para_ruta', {
        categoria_ids: categoriaIds,
        user_lng: usarLng,
        user_lat: usarLat,
        limite: numLugares,
      })

      if (error || !data || data.length === 0) {
        console.error('Error generando ruta:', error)
        return
      }

      negociosParaRuta = data
    }

    if (negociosParaRuta.length === 0) return

    setParadas(negociosParaRuta)

    // Dibujar marcadores cian numerados
    negociosParaRuta.forEach((negocio: Negocio, index: number) => {
      const el = document.createElement('div')
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#0891B2'
      el.style.border = '2px solid white'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.color = 'white'
      el.style.fontWeight = '600'
      el.style.fontSize = '13px'
      el.style.fontFamily = 'Inter, sans-serif'
      el.style.cursor = 'pointer'
      el.innerText = (index + 1).toString()

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <p style="font-weight: 600; margin: 0 0 4px 0; color: #164E63;">${index + 1}. ${negocio.nombre}</p>
          <p style="margin: 0 0 2px 0; font-size: 12px; color: #888888;">Categoría: ${negocio.categoria_principal.replace(/_/g, ' ')}</p>
          <p style="margin: 0; font-size: 12px; color: #888888;">Rango de precios: $${negocio.rango_precios} MXN</p>
        </div>
      `)

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([negocio.longitud, negocio.latitud])
        .setPopup(popup)
        .addTo(map.current!)

      routeMarkers.current.push(marker)
    })

    await trazarRuta(negociosParaRuta)

    // Ajustar vista
    const bounds = new mapboxgl.LngLatBounds()
    negociosParaRuta.forEach((negocio: Negocio) => {
      bounds.extend([negocio.longitud, negocio.latitud])
    })

    map.current?.fitBounds(bounds, { padding: 80 })

    // Log
    await supabase.from('logs_eventos').insert({
      tipo: 'ruta_generada',
      metadata: {
        categorias: categorias?.split(',') ?? [],
        num_paradas: negociosParaRuta.length,
      }
    })
  }

  async function trazarRuta(negocios: Negocio[]) {
    const coordenadas = negocios
      .map(n => `${n.longitud},${n.latitud}`)
      .join(';')

    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordenadas}?geometries=geojson&access_token=${mapboxgl.accessToken}`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.routes || data.routes.length === 0) return

    const ruta = data.routes[0]

    if (map.current?.getSource('ruta')) {
      (map.current.getSource('ruta') as mapboxgl.GeoJSONSource).setData(ruta.geometry)
    } else {
      map.current?.addSource('ruta', {
        type: 'geojson',
        data: ruta.geometry,
      })

      map.current?.addLayer({
        id: 'ruta',
        type: 'line',
        source: 'ruta',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0891B2',
          'line-width': 4,
          'line-dasharray': [2, 2],
        },
      })
    }

    const minutos = Math.round(ruta.duration / 60)
    setTiempoTotal(minutos)
  }

  function limpiarRuta() {
    routeMarkers.current.forEach(marker => marker.remove())
    routeMarkers.current = []
    setParadas([])
    setTiempoTotal(null)

    if (map.current?.getLayer('ruta')) map.current.removeLayer('ruta')
    if (map.current?.getSource('ruta')) map.current.removeSource('ruta')

    cargarNegocios()
    router.replace(`/${locale}`)
  }

  function abrirEnGoogleMaps() {
    if (paradas.length === 0) return

    const origen = `${paradas[0].latitud},${paradas[0].longitud}`
    const destino = `${paradas[paradas.length - 1].latitud},${paradas[paradas.length - 1].longitud}`
    const waypoints = paradas
      .slice(1, -1)
      .map(p => `${p.latitud},${p.longitud}`)
      .join('|')

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destino}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=walking`

    window.open(url)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100vh' }}
      />

      {modoRuta && paradas.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '56px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontFamily: 'Inter, sans-serif',
          overflow: 'hidden',
        }}>
          {tiempoTotal !== null && (
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid #E5E5E5',
            }}>
              <p style={{
                color: '#0891B2',
                fontWeight: 600,
                fontSize: '14px',
                margin: 0,
              }}>
                {t('recorridoTotal')} {tiempoTotal} min
              </p>
            </div>
          )}
          <div style={{
            maxHeight: '22vh',
            overflowY: 'auto',
            padding: '10px 16px',
          }}>
            {paradas.map((parada, index) => (
              <div key={parada.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: index < paradas.length - 1 ? '10px' : '0',
              }}>
                <div style={{
                  minWidth: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#0891B2',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {index + 1}
                </div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 500, color: '#164E63' }}>
                    {parada.nombre}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#888888' }}>
                    {parada.categoria_principal.replace(/_/g, ' ')}{parada.distancia != null ? ` · ${Math.round(parada.distancia)} ${t('desdeUbicacion')}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        width: 'calc(100% - 32px)',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => router.push(`/${locale}/route-config`)}
          style={{
            position: 'fixed',
            bottom: '80px',
            backgroundColor: '#0891B2',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            padding: '12px 20px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {modoRuta ? t('cambiarRuta') : t('generarRuta')}
        </button>

        {paradas.length > 0 && (
          <button
            onClick={limpiarRuta}
            style={{
              backgroundColor: 'white',
              color: '#EA580C',
              border: '2px solid #EA580C',
              borderRadius: '999px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {t('borrarRuta')}
          </button>
        )}

        {paradas.length > 0 && (
          <button
            onClick={abrirEnGoogleMaps}
            style={{
              backgroundColor: 'white',
              color: '#0891B2',
              border: '2px solid #0891B2',
              borderRadius: '999px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            📍 Google Maps
          </button>
        )}
      </div>
    </div>
  )
}