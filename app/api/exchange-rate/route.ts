import { NextRequest, NextResponse  } from 'next/server'

//caché en memoria del servidor - se reinicia solo cuando el servidor se reinicia
//así evitamos llamar a AwesomeAPI en cada petición
const cache: Record<string, {rate: number; timestamp: number }> = {}
const TTL = 1000*60*60 //1 hora en milisegundos

export async function GET(request: NextRequest){
    const {searchParams} = new URL(request.url)
    const currency = searchParams.get('currency')

    if(!currency){
        return NextResponse.json({error: 'Falta el parámetro currency'}, {status: 400}) //bad request
        }
        //si tenemos el valor en caché y no ha expirado, lo devoldemos directo
        const cached = cache[currency]
        const ahora = Date.now()
        if(cached && ahora -cached.timestamp <TTL){
            return NextResponse.json({currency, rate: cached.rate, cached: true})
        }

    //Si no hay caché o expiró, consultamos AwesomeAPI
    // Si no hay caché o expiró, consultamos Frankfurter API
    try {
        // Frankfurter usa parámetros en la URL: ?from=MXN&to=USD
        const response = await fetch(
            `https://api.frankfurter.app/latest?from=MXN&to=${currency}`
        )
        const data = await response.json()
        console.log('Respuesta de Frankfurter:', JSON.stringify(data))

        // Validamos que la API haya devuelto la estructura correcta
        if (!data || !data.rates || typeof data.rates[currency] === 'undefined') {
            console.error('Estructura inesperada de la API o divisa no soportada:', data)
            throw new Error('Respuesta inválida de Frankfurter')
        }

        const rate = parseFloat(data.rates[currency])
        console.log('Rate calculado:', rate)

        cache[currency] = { rate, timestamp: ahora }

        await fetch(`${request.nextUrl.origin}/api/log-evento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'conversion_divisa', metadata: { divisa: currency } }),
        })

        return NextResponse.json({ currency, rate, cached: false })
    } catch (error) {
        console.error('Error completo:', error)
        return NextResponse.json({ error: 'Error consultando tipo de cambio' }, { status: 500 })
    }
}