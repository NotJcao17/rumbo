import { NextRequest, NextResponse } from 'next/server'

// Caché en memoria para tipos de cambio (igual que en exchange-rate)
const cache: Record<string, { rate: number; timestamp: number }> = {}
const CACHE_TTL = 60 * 60 * 1000 // 1 hora en milisegundos

async function obtenerTipoDeCambio(currency: string): Promise<number | null> {
  if (currency === 'MXN') return 1

  const ahora = Date.now()
  if (cache[currency] && ahora - cache[currency].timestamp < CACHE_TTL) {
    return cache[currency].rate
  }

  try {
    const res = await fetch(`https://economia.awesomeapi.com.br/json/last/MXN-${currency}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RumboApp/1.0;)'
      },
      cache: 'no-store' // Evita interferencia de Next.js
    })
    
    if (!res.ok) {
      const text = await res.text()
      console.error(`Error AwesomeAPI status: ${res.status}. Body: ${text}`)
      return null
    }

    const data = await res.json()
    const key = `MXN${currency}`
    const rate = parseFloat(data[key]?.bid)
    if (isNaN(rate)) return null
    cache[currency] = { rate, timestamp: ahora }
    return rate
  } catch (error) {
    console.error("Error en obtenerTipoDeCambio catch:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image_base64, target_lang, currency } = body

    if (!image_base64 || !target_lang || !currency) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: image_base64, target_lang, currency' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de Gemini no configurada' }, { status: 500 })
    }

    // Mapa de códigos de idioma a nombres completos para el prompt
    const IDIOMAS: Record<string, string> = {
      es: 'español',
      en: 'inglés',
      de: 'alemán',
    }
    const idiomaDestino = IDIOMAS[target_lang] ?? target_lang

    const prompt = `Analiza esta imagen de un menú de restaurante mexicano.
Extrae cada platillo o producto visible.
Para cada uno devuelve un objeto JSON con exactamente estos campos:
- nombre_original: el nombre tal como aparece en el menú, en español
- nombre_traducido: el nombre traducido a ${idiomaDestino}
- precio_mxn: solo el número del precio en pesos mexicanos (sin símbolo), o null si no se detecta

Responde ÚNICAMENTE con un JSON array válido, sin markdown, sin backticks, sin texto adicional.
Si no puedes leer ningún platillo, responde con un array vacío: []`

    // Llamada a la API de Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: image_base64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Error de Gemini:', errText)
      return NextResponse.json({ error: 'Error al contactar Gemini' }, { status: 502 })
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Limpiamos por si Gemini agrega backticks o "```json" a pesar del prompt
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let platillos: { nombre_original: string; nombre_traducido: string; precio_mxn: number | null }[]
    try {
      platillos = JSON.parse(cleaned)
    } catch {
      console.error('Gemini devolvió JSON inválido:', cleaned)
      return NextResponse.json({ error: 'No se pudo leer el menú. Intenta con mejor iluminación.' }, { status: 422 })
    }

    // Convertir precios a la moneda del turista
    const rate = await obtenerTipoDeCambio(currency)

    const items = platillos.map((p) => ({
      nombre_original: p.nombre_original,
      nombre_traducido: p.nombre_traducido,
      precio_mxn: p.precio_mxn,
      precio_convertido:
        p.precio_mxn != null && rate != null
          ? parseFloat((p.precio_mxn * rate).toFixed(2))
          : null,
    }))

    // Registrar evento en logs
    await fetch(`${request.nextUrl.origin}/api/log-evento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'traduccion_menu',
        metadata: {
          idioma_destino: target_lang,
          platillos_detectados: items.length,
          currency,
        },
      }),
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error en translate-menu:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}