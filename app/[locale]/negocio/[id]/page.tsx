'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase-client'
import BusinessCard from '@/components/BusinessCard'

interface Negocio {
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
  latitud?: number
  longitud?: number
}

interface NegocioRpc {
  id: string
  latitud: number
  longitud: number
}

export default function NegocioPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string

  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarNegocio() {
      // Datos principales del negocio
      const { data, error } = await supabase
        .from('negocios')
        .select('id, nombre, direccion, rango_precios, metodos_pago, idiomas_atencion, accesibilidad, horario, es_gastronomico, estado')
        .eq('id', id)
        .single()

      if (error || !data) {
        setCargando(false)
        return
      }

      // Coordenadas vía RPC (extrae de PostGIS)
      const { data: coordData } = await supabase.rpc('get_negocios_con_coordenadas')
      const coordInfo = (coordData as NegocioRpc[] | null)?.find(n => n.id === id)

      setNegocio({
        ...data,
        latitud: coordInfo?.latitud,
        longitud: coordInfo?.longitud,
      })
      setCargando(false)
    }

    cargarNegocio()
  }, [id])

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
        <p style={{ color: '#888888' }}>Cargando...</p>
      </div>
    )
  }

  if (!negocio) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        gap: '16px',
      }}>
        <p style={{ color: '#888888' }}>Negocio no encontrado.</p>
        <button
          onClick={() => router.push(`/${locale}`)}
          style={{
            color: '#0891B2',
            background: 'none',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          ← Volver al mapa
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      padding: '24px 16px 80px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: '#0891B2',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '0 0 16px 0',
          display: 'block',
        }}
      >
        ← Atrás
      </button>
      <BusinessCard negocio={negocio} />
    </div>
  )
}
