'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import BottomNav from '@/components/BottomNav'
import { useTranslations } from 'next-intl'

// Tipo para cada platillo que devuelve la API
type Platillo = {
    nombre_original: string
    nombre_traducido: string
    precio_mxn: number | null
    precio_convertido: number | null
}

// Los dos estados posibles de la pantalla
type Estado = 'capturando' | 'cargando' | 'resultados' | 'error'

export default function ScannerPage() {
    const router = useRouter()
    const locale = useLocale()
    const t = useTranslations('scanner')

    const [estado, setEstado] = useState<Estado>('capturando')
    const [platillos, setPlatillos] = useState<Platillo[]>([])
    const [imagenURL, setImagenURL] = useState<string | null>(null)
    const [mensajeError, setMensajeError] = useState<string>('')
    const [currency, setCurrency] = useState<string>('USD')

    // Referencia al input de archivo oculto
    const inputRef = useRef<HTMLInputElement>(null)

    // Convierte un File/Blob a base64 (sin el prefijo "data:...")
    function fileABase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const result = reader.result as string
                const base64 = result.split(',')[1]
                resolve(base64)
            }
            reader.onerror = () => reject(new Error('Error al leer la imagen'))
        })
    }

    // Se ejecuta cuando el turista selecciona o toma una foto
    async function manejarFoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Guardamos la URL de la imagen para mostrarla en resultados
        setImagenURL(URL.createObjectURL(file))
        setEstado('cargando')

        try {
            const base64 = await fileABase64(file)

            // Leemos las preferencias del turista
            const targetLang = localStorage.getItem('lang') || 'en'
            const savedCurrency = localStorage.getItem('currency') || 'USD'
            setCurrency(savedCurrency)

            // Registramos que el turista abrió el escáner
            fetch('/api/log-evento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: 'escaner_abierto' }),
            })

            // Llamamos a nuestra API route
            const res = await fetch('/api/translate-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_base64: base64,
                    target_lang: targetLang,
                    currency: savedCurrency,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setMensajeError(data.error || 'Ocurrió un error al traducir el menú.')
                setEstado('error')
                return
            }

            setPlatillos(data.items)
            setEstado('resultados')
        } catch {
            setMensajeError('No se pudo procesar la imagen. Intenta de nuevo.')
            setEstado('error')
        }
    }

    function reiniciar() {
        setEstado('capturando')
        setPlatillos([])
        setImagenURL(null)
        setMensajeError('')
        // Limpiamos el input para que se pueda volver a seleccionar la misma foto
        if (inputRef.current) inputRef.current.value = ''
    }

    // ── PANTALLA: Capturando ──────────────────────────────────────────
    if (estado === 'capturando') {
        return (
            <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center gap-6 p-6 pb-24">
                <div className="text-center">
                    <p className="text-5xl mb-4">📷</p>
                    <h1 className="text-2xl font-semibold text-text-main mb-2">{t('titulo')}</h1>
                    <p className="text-text-secondary">{t('descripcion')}</p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={manejarFoto}
                />

                <button
                    onClick={() => inputRef.current?.click()}
                    className="bg-accent text-white px-8 py-4 rounded-2xl text-lg font-medium"
                >
                    📸 {t('tomarFoto')}
                </button>

                <button
                    onClick={() => router.push(`/${locale}`)}
                    className="text-text-secondary text-sm underline"
                >
                    {t('volverMapa')}
                </button>

                <BottomNav />
            </div>
        )
    }

    // ── PANTALLA: Cargando ────────────────────────────────────────────
    if (estado === 'cargando') {
        return (
            <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center gap-4 p-6">
                <div className="text-5xl animate-spin">⏳</div>
                <p className="text-text-main font-medium text-lg">{t('traduciendo')}</p>
                <p className="text-text-secondary text-sm">{t('espera')}</p>
            </div>
        )
    }

    // ── PANTALLA: Error ───────────────────────────────────────────────
    if (estado === 'error') {
        return (
            <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center gap-6 p-6 pb-24">
                <p className="text-5xl">😕</p>
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-text-main mb-2">{t('errorTitulo')}</h2>
                    <p className="text-text-secondary text-sm">{mensajeError}</p>
                </div>
                <p className="text-text-secondary text-sm text-center">{t('errorConsejo')}</p>
                <button
                    onClick={reiniciar}
                    className="bg-accent text-white px-8 py-4 rounded-2xl font-medium"
                >
                    📷 {t('intentarDeNuevo')}
                </button>
                <BottomNav />
            </div>
        )
    }

    // ── PANTALLA: Resultados ──────────────────────────────────────────
    return (
        <div className="min-h-screen bg-bg-page flex flex-col pb-24">

            {/* Imagen del menú */}
            {imagenURL && (
                <div className="w-full">
                    <img
                        src={imagenURL}
                        alt="Foto del menú"
                        className="w-full h-auto"
                    />
                </div>
            )}

            <div className="flex flex-col gap-4 p-4">
                <h2 className="text-xl font-semibold text-text-main">
                    {platillos.length} {platillos.length !== 1 ? t('platillosDetectadosPlural') : t('platillosDetectados')}
                </h2>

                {/* Lista de platillos */}
                {platillos.map((p, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-border-color shadow-sm">
                        <p className="text-text-secondary text-sm">{p.nombre_original}</p>
                        <p className="text-text-main font-semibold text-base mt-0.5">{p.nombre_traducido}</p>
                        <div className="flex gap-3 mt-2">
                            {p.precio_mxn != null && (
                                <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                                    🇲🇽 ${p.precio_mxn} MXN
                                </span>
                            )}
                            {p.precio_convertido != null && currency !== 'MXN' && (
                                <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full">
                                    {p.precio_convertido} {currency}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {/* Botones */}
                <div className="flex flex-col gap-3 mt-2">
                    <button
                        onClick={reiniciar}
                        className="w-full bg-accent text-white py-3 rounded-xl font-medium"
                    >
                        📷 {t('otraFoto')}
                    </button>
                    <button
                        onClick={() => router.push(`/${locale}`)}
                        className="w-full border-2 border-primary text-primary py-3 rounded-xl font-medium"
                    >
                        🗺️ {t('volverMapa')}
                    </button>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}