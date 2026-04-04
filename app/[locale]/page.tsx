'use client'

import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100vh', background: '#f5f5f5' }} />
})

export default function Home() {
  return (
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Map />
    </main>
  )
}