import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { tipo, metadata } = body

  if (!tipo) {
    return NextResponse.json({ error: 'Falta el campo tipo' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('logs_eventos').insert({
    tipo,
    metadata: metadata || {},
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}