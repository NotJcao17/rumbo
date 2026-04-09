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
    try{
        const response = await fetch(
            `https://economia.awesomeapi.com.br/json/last/MXN-${currency}`
        )
        const data = await response.json()

        //Awesome API devuelve un objeto con clave dinámica tipo "MXNEUR"
        const key = `MXN${currency}`
        const rate = parseFloat(data[key].bid)

        //Guardamos en caché
        cache[currency] = {rate, timestamp: ahora}

        //Registrar evento en logs_eventos
        await fetch(`${request.nextUrl.origin}/api/log-evento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'conversion_divisa', metadata: { divisa: currency } }),
})

        return NextResponse.json({ currency, rate, cached:false })
    } catch(error){
        return NextResponse.json({error: 'Error consultando tipo de cambio'}, {status:500}) //500: internal server error
    }
}