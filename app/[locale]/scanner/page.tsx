'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import BottomNav from '@/components/BottomNav'
import { useTranslations } from 'next-intl'

type Platillo = {
    nombre_original: string
    nombre_traducido: string
    precio_mxn: number | null
    precio_convertido: number | null
}

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

    const inputRef = useRef<HTMLInputElement>(null)

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

    async function manejarFoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setImagenURL(URL.createObjectURL(file))
        setEstado('cargando')

        try {
            const base64 = await fileABase64(file)

            const targetLang = localStorage.getItem('lang') || 'en'
            const savedCurrency = localStorage.getItem('currency') || 'USD'
            setCurrency(savedCurrency)

            fetch('/api/log-evento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: 'escaner_abierto' }),
            })

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
        if (inputRef.current) inputRef.current.value = ''
    }

    // ── PANTALLA: Capturando ──────────────────────────────────────────
    if (estado === 'capturando') {
        return (
            <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center gap-8 p-6 pb-28">

                {/* Hero visual */}
                <div className="text-center animate-slide-up">
                    <div className="relative inline-flex items-center justify-center mb-5">
                        {/* Anillo decorativo exterior */}
                        <div
                            className="absolute w-28 h-28 rounded-full animate-spin-slow"
                            style={{
                                background: 'conic-gradient(from 0deg, #0891B2, #EA580C, #0891B2)',
                                padding: '2px',
                                opacity: 0.5,
                            }}
                        />
                        <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-[0_8px_32px_rgba(8,145,178,0.2)]">
                            <span className="text-5xl animate-float" style={{ animationDuration: '2.5s' }}>📷</span>
                        </div>
                    </div>
                    <h1 className="font-display text-3xl font-bold text-gradient-primary mb-2">{t('titulo')}</h1>
                    <p className="text-text-secondary text-sm max-w-xs mx-auto">{t('descripcion')}</p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={manejarFoto}
                />

                {/* Área de drop / CTA */}
                <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="btn-accent btn-pulse w-full py-5 text-lg font-bold font-display rounded-2xl flex items-center justify-center gap-3"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15.2C10.2 15.2 8.8 13.8 8.8 12S10.2 8.8 12 8.8 15.2 10.2 15.2 12 13.8 15.2 12 15.2zM12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7zM2 13H4V11H2V13zM20 13H22V11H20V13zM11 2V4H13V2H11zM11 20V22H13V20H11z" fill="white"/>
                        </svg>
                        {t('tomarFoto')}
                    </button>
                </div>

                <button
                    onClick={() => router.push(`/${locale}`)}
                    className="text-text-secondary text-sm hover:text-primary transition-colors duration-200"
                >
                    ← {t('volverMapa')}
                </button>

                <BottomNav />
            </div>
        )
    }

    // ── PANTALLA: Cargando ────────────────────────────────────────────
    if (estado === 'cargando') {
        return (
            <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center gap-6 p-6">

                {/* Imagen con línea de escaneo animada */}
                {imagenURL && (
                    <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-fade-in">
                        <img src={imagenURL} alt="Menú" className="w-full h-48 object-cover opacity-70" />
                        <div className="scan-line" />
                        {/* Overlay de scanning */}
                        <div
                            className="absolute inset-0 flex items-end p-4"
                            style={{ background: 'linear-gradient(to top, rgba(8,145,178,0.4) 0%, transparent 60%)' }}
                        >
                            <span className="text-white text-xs font-semibold tracking-widest uppercase">Analizando...</span>
                        </div>
                    </div>
                )}

                <div className="text-center animate-fade-in">
                    <div
                        className="w-10 h-10 rounded-full border-4 border-surface mx-auto mb-4 animate-spin-slow"
                        style={{ borderTopColor: '#EA580C' }}
                    />
                    <p className="text-text-main font-bold text-lg">{t('traduciendo')}</p>
                    <p className="text-text-secondary text-sm mt-1">{t('espera')}</p>
                </div>
            </div>
        )
    }

    // ── PANTALLA: Error ───────────────────────────────────────────────
    if (estado === 'error') {
        return (
            <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center gap-6 p-6 pb-28 animate-slide-up">
                <div className="w-20 h-20 rounded-full bg-accent-soft flex items-center justify-center text-4xl animate-scale-in">
                    😕
                </div>
                <div className="text-center">
                    <h2 className="font-display text-2xl font-bold text-text-main mb-2">{t('errorTitulo')}</h2>
                    <p className="text-text-secondary text-sm">{mensajeError}</p>
                    <p className="text-text-secondary text-sm mt-2">{t('errorConsejo')}</p>
                </div>
                <button
                    onClick={reiniciar}
                    className="btn-accent py-4 px-8 text-base font-bold rounded-2xl"
                >
                    📷 {t('intentarDeNuevo')}
                </button>
                <BottomNav />
            </div>
        )
    }

    // ── PANTALLA: Resultados ──────────────────────────────────────────
    return (
        <div className="min-h-screen bg-bg-page flex flex-col pb-28">

            {/* Header con imagen */}
            {imagenURL && (
                <div className="relative w-full">
                    <img
                        src={imagenURL}
                        alt="Foto del menú"
                        className="w-full h-52 object-cover"
                    />
                    {/* Overlay gradiente */}
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(8,145,178,0.7) 0%, transparent 55%)' }}
                    />
                    <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="font-display text-xl font-bold text-white drop-shadow">
                            {platillos.length} {platillos.length !== 1 ? t('platillosDetectadosPlural') : t('platillosDetectados')}
                        </h2>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 p-4">

                {/* Lista de platillos con entrada escalonada */}
                {platillos.map((p, i) => (
                    <div
                        key={i}
                        className="card-elevated p-4 animate-slide-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        {/* Barra de color */}
                        <div
                            className="h-1 w-10 rounded-full mb-3"
                            style={{ background: 'linear-gradient(90deg, #EA580C, #0891B2)' }}
                        />
                        <p className="text-text-secondary text-xs mb-0.5">{p.nombre_original}</p>
                        <p className="text-text-main font-bold text-base">{p.nombre_traducido}</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                            {p.precio_mxn != null && (
                                <span
                                    className="text-white text-sm px-3 py-1 rounded-full font-bold shadow-sm"
                                    style={{ background: 'linear-gradient(135deg, #EA580C, #C2410C)' }}
                                >
                                    💰 ${p.precio_mxn} MXN
                                </span>
                            )}
                            {p.precio_convertido != null && currency !== 'MXN' && (
                                <span className="bg-surface text-text-main text-sm px-3 py-1 rounded-full font-medium">
                                    {p.precio_convertido} {currency}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {/* Botones */}
                <div className="flex flex-col gap-3 mt-2 animate-slide-up" style={{ animationDelay: `${platillos.length * 60}ms` }}>
                    <button onClick={reiniciar} className="btn-accent py-3.5 text-base font-bold">
                        📷 {t('otraFoto')}
                    </button>
                    <button
                        onClick={() => router.push(`/${locale}`)}
                        className="btn-ghost py-3.5 text-base font-bold"
                    >
                        🗺️ {t('volverMapa')}
                    </button>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}
