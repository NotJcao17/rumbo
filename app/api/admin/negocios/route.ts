import { supabaseAdmin } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/** Verifica JWT y que el usuario sea admin */
async function getAdminUserId(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from('usuarios_negocio')
    .select('rol')
    .eq('id', data.user.id)
    .single();

  if (profile?.rol !== 'admin') return null;
  return data.user.id;
}

/** GET /api/admin/negocios — lista negocios pendientes y aprobados con sus categorías */
export async function GET(request: NextRequest) {
  const adminId = await getAdminUserId(request);
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Traer negocios pendientes y aprobados
  const [pendientesRes, aprobadosRes] = await Promise.all([
    supabaseAdmin
      .from('negocios')
      .select('*, negocio_categorias(categoria_id, categorias(nombre, tipo))')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('negocios')
      .select('*, negocio_categorias(categoria_id, categorias(nombre, tipo))')
      .eq('estado', 'aprobado')
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    pendientes: pendientesRes.data ?? [],
    aprobados: aprobadosRes.data ?? [],
  });
}

/** PATCH /api/admin/negocios — cambia estado de un negocio (aprobar/rechazar) */
export async function PATCH(request: NextRequest) {
  const adminId = await getAdminUserId(request);
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { negocio_id, estado } = await request.json();

  if (!['aprobado', 'rechazado'].includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('negocios')
    .update({ estado })
    .eq('id', negocio_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
