'use client'
import BusinessCard from '@/components/BusinessCard'

const NEGOCIO_FALSO = {
  id: '1',
  nombre: 'Taquería El Califa',
  direccion: 'Álvaro Obregón 120, Roma Norte',
  rango_precios: '80-150',
  metodos_pago: ['efectivo', 'tarjeta_debito'],
  idiomas_atencion: ['es', 'en'],
  accesibilidad: ['rampa'],
  horario: 'Lun-Dom 8:00-23:00',
  es_gastronomico: true,
  estado: 'aprobado',
  latitud: 19.4167,
  longitud: -99.1617,
}

export default function TestFicha() {
  return (
    <main className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <BusinessCard negocio={NEGOCIO_FALSO} />
    </main>
  )
}