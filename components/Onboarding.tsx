'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Los idiomas que soporta la app (según el documento de requisitos)
const IDIOMAS = [
  { codigo: 'es', etiqueta: 'Español', bandera: '🇲🇽' },
  { codigo: 'en', etiqueta: 'English', bandera: '🇺🇸' },
  { codigo: 'de', etiqueta: 'Deutsch', bandera: '🇩🇪' },
]

// Las monedas disponibles
const MONEDAS = [
  { codigo: 'MXN', etiqueta: 'Peso mexicano', simbolo: '$' },
  { codigo: 'USD', etiqueta: 'US Dollar', simbolo: '$' },
  { codigo: 'EUR', etiqueta: 'Euro', simbolo: '€' },
]

export default function Onboarding() {
  // useState guarda qué opción eligió el turista
  // El valor inicial es 'en' (inglés) y 'USD por defecto)
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('en')
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('USD')

  const router = useRouter()

  // Esta función se llama cuando el turista toca "Comenzar"
  function handleComenzar() {
    // Guardamos las preferencias en localStorage para recordarlas
    localStorage.setItem('lang', idiomaSeleccionado)
    localStorage.setItem('currency', monedaSeleccionada)

    // Redirigimos al mapa con el idioma seleccionado
    router.push(`/${idiomaSeleccionado}`)
  }

  return (
    // Fondo oscuro semitransparente que cubre toda la pantalla
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">

      {/* Tarjeta blanca que sube desde abajo */}
      <div className="bg-white w-full max-w-md rounded-t-3xl p-8 flex flex-col gap-6">

        {/* Título y bienvenida */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-text-main">Rumbo</h1>
          <p className="text-gray-500 mt-1">Tu guía local para el Mundial 2026</p>
        </div>

        {/* Selector de idioma */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-main">
            Idioma / Language / Sprache
          </label>
          <div className="flex gap-2">
            {IDIOMAS.map((idioma) => (
              <button
                key={idioma.codigo}
                onClick={() => setIdiomaSeleccionado(idioma.codigo)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors
                  ${idiomaSeleccionado === idioma.codigo
                    ? 'border-primary bg-surface text-text-main'
                    : 'border-border-color text-gray-400'
                  }`}
              >
                <span className="text-xl block mb-1">{idioma.bandera}</span>
                {idioma.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de moneda */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-main">
            Moneda / Currency / Währung
          </label>
          <div className="flex gap-2">
            {MONEDAS.map((moneda) => (
              <button
                key={moneda.codigo}
                onClick={() => setMonedaSeleccionada(moneda.codigo)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors
                  ${monedaSeleccionada === moneda.codigo
                    ? 'border-primary bg-surface text-text-main'
                    : 'border-border-color text-gray-400'
                  }`}
              >
                <span className="text-xl block mb-1">{moneda.simbolo}</span>
                {moneda.codigo}
              </button>
            ))}
          </div>
        </div>

        {/* Botón Comenzar */}
        <button
          onClick={handleComenzar}
          className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg"
        >
          Comenzar →
        </button>

      </div>
    </div>
  )
}