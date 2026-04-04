'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Onboarding from '@/components/Onboarding'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100vh', background: '#f5f5f5' }} />
})

export default function Home() {
  // null = todavía no sabemos (estamos leyendo localStorage)
  // true = mostrar onboarding
  // false = ya configuró, mostrar solo el mapa
  const [mostrarOnboarding, setMostrarOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    const lang = localStorage.getItem('lang')
    setMostrarOnboarding(!lang)
  }, [])

  // Mientras leemos localStorage no mostramos nada para evitar un flash
  if (mostrarOnboarding === null) return null

  return (
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Map />
      {mostrarOnboarding && (
        <Onboarding onComplete={() => setMostrarOnboarding(false)} />
      )}
    </main>
  )
}