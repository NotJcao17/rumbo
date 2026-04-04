'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
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
  const modoRuta = !!categorias && !!num

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

    // Geolocalización del turista
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords
          userLocation.current = [longitude, latitude]

          // Solo mover el mapa a la ubicación del turista si NO estamos en modo ruta
          // En modo ruta, fitBounds se encarga de ajustar la vista a las paradas
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
          console.log('Geolocalización no disponible, usando ubicación por defecto')
          userLocation.current = DEFAULT_CENTER
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
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <p style="font-weight: 600; margin: 0 0 4px 0; color: #164E63;">${negocio.nombre}</p>
          <p style="margin: 0 0 2px 0; font-size: 12px; color: #888888;">Categoría: ${negocio.categoria_principal}</p>
          <p style="margin: 0; font-size: 12px; color: #888888;">Rango de precios: $${negocio.rango_precios} MXN</p>
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
    // Esperar a que tengamos la ubicación del usuario
    let intentos = 0
    while (!userLocation.current && intentos < 20) {
      await new Promise(r => setTimeout(r, 300))
      intentos++
    }

    const [lng, lat] = userLocation.current ?? DEFAULT_CENTER
    const categoriaIds = categorias!.split(',')
    const numLugares = parseInt(num!)

    const { data, error } = await supabase.rpc('get_negocios_para_ruta', {
      categoria_ids: categoriaIds,
      user_lng: lng,
      user_lat: lat,
      limite: numLugares,
    })

    if (error || !data || data.length === 0) {
      console.error('Error generando ruta:', error)
      return
    }

    setParadas(data)
    // Dibujar marcadores cian numerados
    data.forEach((negocio: Negocio, index: number) => {
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
          <p style="margin: 0 0 2px 0; font-size: 12px; color: #888888;">Categoría: ${negocio.categoria_principal}</p>
          <p style="margin: 0; font-size: 12px; color: #888888;">Rango de precios: $${negocio.rango_precios} MXN</p>
        </div>
      `)

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([negocio.longitud, negocio.latitud])
        .setPopup(popup)
        .addTo(map.current!)

      routeMarkers.current.push(marker)
    })

    // Trazar la ruta con Mapbox Directions API
    await trazarRuta(data)

    // Ajustar la vista para ver todas las paradas
    const bounds = new mapboxgl.LngLatBounds()
    data.forEach((negocio: Negocio) => {
      bounds.extend([negocio.longitud, negocio.latitud])
    })
    map.current?.fitBounds(bounds, { padding: 80 })

    // Registrar evento en logs_eventos
    await supabase.from('logs_eventos').insert({
      tipo: 'ruta_generada',
      metadata: {
        categorias: categoriaIds,
        num_paradas: data.length,
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

    // Agregar la línea de la ruta al mapa
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

    // Calcular tiempo total en minutos
    const minutos = Math.round(ruta.duration / 60)
    setTiempoTotal(minutos)
  }

  function limpiarRuta() {
    // Eliminar marcadores de ruta
    routeMarkers.current.forEach(marker => marker.remove())
    routeMarkers.current = []
    setParadas([])
    setTiempoTotal(null)

    // Eliminar línea de ruta del mapa
    if (map.current?.getLayer('ruta')) map.current.removeLayer('ruta')
    if (map.current?.getSource('ruta')) map.current.removeSource('ruta')

    // Navegar a la URL limpia sin parámetros
    router.push(`/${locale}`)
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
      {/* Panel de información de ruta */}
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
          {/* Encabezado fijo */}
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
                🚶 Recorrido total: {tiempoTotal} min
              </p>
            </div>
          )}
          {/* Lista de paradas con scroll */}
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
                    {parada.categoria_principal} · {Math.round(parada.distancia)} m desde tu ubicación
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
            backgroundColor: '#0891B2',
            color: 'white',
            border: 'none',
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
          {modoRuta ? 'Cambiar ruta' : 'Generar ruta'}
        </button>

        {modoRuta && (
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
            Borrar ruta
          </button>
        )}

        {modoRuta && (
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