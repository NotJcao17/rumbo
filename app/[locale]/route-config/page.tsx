'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase-client'

interface Categoria {
  id: string
  nombre: string
  tipo: string
}

const TIPO_LABELS: Record<string, string> = {
  gastronomia: 'Gastronomía',
  cultura: 'Cultura',
  compras: 'Compras',
  entretenimiento: 'Entretenimiento',
}

export default function RouteConfig() {
  const router = useRouter()
  const locale = useLocale()

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [seleccionadas, setSeleccionadas] = useState<string[]>([])
  const [numLugares, setNumLugares] = useState(3)
  const [cargando, setCargando] = useState(true)

  function getMensajeAdvertencia(): string | null {
  if (seleccionadas.length === 0) return null
  if (seleccionadas.length > numLugares) {
    return `Seleccionaste ${seleccionadas.length} categorías pero solo ${numLugares} lugar${numLugares === 1 ? '' : 'es'}. No podremos incluir todas las categorías en tu ruta.`
  }
  if (numLugares > seleccionadas.length) {
    return `Algunos lugares de tu ruta pueden repetir categoría porque pediste ${numLugares} lugares con solo ${seleccionadas.length} categoría${seleccionadas.length === 1 ? '' : 's'}.`
  }
  return null
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

  function toggleCategoria(id: string) {
    setSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function generarRuta() {
    if (seleccionadas.length === 0) return

    const params = new URLSearchParams({
      categorias: seleccionadas.join(','),
      num: numLugares.toString(),
    })

    router.push(`/${locale}?${params.toString()}`)
  }

  // Agrupar categorías por tipo
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
      padding: '24px 16px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <h1 style={{ color: '#164E63', fontSize: '22px', fontWeight: 600, marginBottom: '24px' }}>
        Configura tu ruta
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
          ¿Cuántos lugares quieres visitar?
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setNumLugares(n => Math.max(2, n - 1))}
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

      {/* Checkboxes de categorías */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid #E5E5E5',
      }}>
        <p style={{ color: '#164E63', fontWeight: 500, marginBottom: '16px' }}>
          ¿Qué quieres hacer?
        </p>

        {cargando ? (
          <p style={{ color: '#888888', fontSize: '14px' }}>Cargando categorías...</p>
        ) : (
          Object.entries(categoriasPorTipo).map(([tipo, cats]) => (
            <div key={tipo} style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#888888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {TIPO_LABELS[tipo] || tipo}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {cats.map(cat => {
                  const activa = seleccionadas.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategoria(cat.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: '1px solid',
                        borderColor: activa ? '#0891B2' : '#E5E5E5',
                        backgroundColor: activa ? '#CFFAFE' : 'white',
                        color: activa ? '#164E63' : '#888888',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: activa ? 500 : 400,
                      }}
                    >
                      {cat.nombre}
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Advertencia de desbalance */}
      {getMensajeAdvertencia() && (
        <div style={{
          backgroundColor: '#FFF7ED',
          border: '1px solid #EA580C',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
        }}>
          <p style={{
            color: '#9A3412',
            fontSize: '13px',
            margin: 0,
            lineHeight: '1.5',
          }}>
            ⚠️ {getMensajeAdvertencia()}
          </p>
        </div>
      )}

      {/* Botón generar ruta */}
      <button
        onClick={generarRuta}
        disabled={seleccionadas.length === 0}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: seleccionadas.length === 0 ? '#E5E5E5' : '#0891B2',
          color: seleccionadas.length === 0 ? '#888888' : 'white',
          fontSize: '16px',
          fontWeight: 600,
          cursor: seleccionadas.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        Generar ruta
      </button>
    </div>
  )
}