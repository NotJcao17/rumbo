import { supabaseAdmin } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/** Verifica el JWT y devuelve el userId, o null si inválido */
async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/** GET /api/negocios — devuelve el negocio del usuario autenticado (bypasa RLS) */
export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Obtener negocio_id del usuario
  const { data: userData, error: userErr } = await supabaseAdmin
    .from('usuarios_negocio')
    .select('negocio_id')
    .eq('id', userId)
    .single();

  if (userErr || !userData?.negocio_id) {
    return NextResponse.json({ negocio: null, categorias_ids: [] });
  }

  const nid = userData.negocio_id;

  // Cargar negocio y sus categorías en paralelo
  const [negRes, ncRes] = await Promise.all([
    supabaseAdmin.from('negocios').select('*').eq('id', nid).single(),
    supabaseAdmin.from('negocio_categorias').select('categoria_id').eq('negocio_id', nid),
  ]);

  if (negRes.error || !negRes.data) {
    return NextResponse.json({ negocio: null, categorias_ids: [] });
  }

  return NextResponse.json({
    negocio: negRes.data,
    categorias_ids: ncRes.data?.map((r) => r.categoria_id) ?? [],
  });
}

/** POST /api/negocios — crea un negocio nuevo */
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { nombre, direccion, ubicacion, rango_precios, metodos_pago,
          idiomas_atencion, accesibilidad, horario, es_gastronomico, categorias_ids } = body;

  // Insertar negocio
  const { data: negocio, error: negErr } = await supabaseAdmin
    .from('negocios')
    .insert({
      nombre,
      direccion,
      ubicacion,
      rango_precios,
      metodos_pago: metodos_pago.length > 0 ? metodos_pago : [],
      idiomas_atencion: idiomas_atencion.length > 0 ? idiomas_atencion : [],
      accesibilidad: accesibilidad.length > 0 ? accesibilidad : [],
      horario,
      es_gastronomico,
      estado: 'pendiente',
    })
    .select('id')
    .single();

  if (negErr || !negocio) {
    return NextResponse.json({ error: negErr?.message ?? 'Error al crear negocio' }, { status: 500 });
  }

  // Insertar relaciones negocio_categorias
  if (categorias_ids.length > 0) {
    const { error: catErr } = await supabaseAdmin
      .from('negocio_categorias')
      .insert(categorias_ids.map((cid: string) => ({ negocio_id: negocio.id, categoria_id: cid })));

    if (catErr) {
      return NextResponse.json({ error: catErr.message }, { status: 500 });
    }
  }

  // Vincular negocio_id al usuario
  const { error: linkErr } = await supabaseAdmin
    .from('usuarios_negocio')
    .update({ negocio_id: negocio.id })
    .eq('id', userId);

  if (linkErr) {
    return NextResponse.json({ error: linkErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: negocio.id }, { status: 201 });
}

/** PATCH /api/negocios — actualiza un negocio existente */
export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { negocio_id, nombre, direccion, ubicacion, rango_precios, metodos_pago,
          idiomas_atencion, accesibilidad, horario, es_gastronomico, categorias_ids } = body;

  // Verificar que el negocio le pertenece
  const { data: ownership } = await supabaseAdmin
    .from('usuarios_negocio')
    .select('negocio_id')
    .eq('id', userId)
    .single();

  if (ownership?.negocio_id !== negocio_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // Actualizar negocio
  const { error: updErr } = await supabaseAdmin
    .from('negocios')
    .update({
      nombre,
      direccion,
      ubicacion,
      rango_precios,
      metodos_pago: metodos_pago.length > 0 ? metodos_pago : [],
      idiomas_atencion: idiomas_atencion.length > 0 ? idiomas_atencion : [],
      accesibilidad: accesibilidad.length > 0 ? accesibilidad : [],
      horario,
      es_gastronomico,
    })
    .eq('id', negocio_id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Reemplazar categorías
  await supabaseAdmin.from('negocio_categorias').delete().eq('negocio_id', negocio_id);

  if (categorias_ids.length > 0) {
    const { error: catErr } = await supabaseAdmin
      .from('negocio_categorias')
      .insert(categorias_ids.map((cid: string) => ({ negocio_id, categoria_id: cid })));

    if (catErr) {
      return NextResponse.json({ error: catErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
