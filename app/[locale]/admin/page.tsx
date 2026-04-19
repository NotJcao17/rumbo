'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoriaJoin {
  categoria_id: string;
  categorias: { nombre: string; tipo: string };
}

interface Negocio {
  id: string;
  nombre: string;
  direccion: string;
  ubicacion: unknown;
  rango_precios: string;
  metodos_pago: string[];
  idiomas_atencion: string[];
  accesibilidad: string[];
  horario: string;
  es_gastronomico: boolean;
  estado: string;
  created_at: string;
  negocio_categorias: CategoriaJoin[];
}

// ─── Read-only map ────────────────────────────────────────────────────────────

function StaticMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
      interactive: false,
    });

    new mapboxgl.Marker({ color: '#EA580C' })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-48 rounded-lg overflow-hidden" />;
}

// ─── Badge component ──────────────────────────────────────────────────────────

function Badge({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent';
}) {
  const styles = {
    default: 'bg-surface text-text-main',
    primary: 'bg-surface text-primary',
    accent:  'bg-accent-soft text-accent-text',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ─── Negocio card (list item) ─────────────────────────────────────────────────

function NegocioCard({
  negocio, onClick, tRegistrado, tCategorias,
}: {
  negocio: Negocio;
  onClick: () => void;
  tRegistrado: string;
  tCategorias: string;
}) {
  const fecha = new Date(negocio.created_at).toLocaleDateString();
  const cats = negocio.negocio_categorias
    .map((nc) => nc.categorias?.nombre)
    .filter(Boolean);

  return (
    <button
      onClick={onClick}
      className="card card-hover w-full text-left p-4"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-display text-base font-semibold text-text-main">{negocio.nombre}</h3>
        <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
          {tRegistrado}: {fecha}
        </span>
      </div>
      {cats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {cats.map((cat) => (
            <Badge key={cat} variant="primary">{cat}</Badge>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Negocio detail view ──────────────────────────────────────────────────────

function NegocioDetail({
  negocio, onAprobar, onRechazar, onVolver, acting,
}: {
  negocio: Negocio;
  onAprobar: () => void;
  onRechazar: () => void;
  onVolver: () => void;
  acting: boolean;
}) {
  const t  = useTranslations('admin');
  const tn = useTranslations('negocio');

  // Extract coordinates — Supabase PostGIS returns GeoJSON via REST
  let lat = 19.413;
  let lng = -99.1735;
  const ub = negocio.ubicacion as { type?: string; coordinates?: number[] } | null;
  if (ub?.coordinates) {
    lng = ub.coordinates[0];
    lat = ub.coordinates[1];
  }

  const cats = negocio.negocio_categorias
    .map((nc) => nc.categorias?.nombre)
    .filter(Boolean);

  const [min, max] = (negocio.rango_precios ?? '').split('-');
  const rangoFormatted = min && max ? `$${min} – $${max} MXN` : negocio.rango_precios;

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button onClick={onVolver}
        className="text-sm text-primary hover:underline">
        ← {t('btnVolver')}
      </button>

      <div className="card overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0891B2 0%, #0EA5C9 60%, #EA580C 100%)' }} />
        <div className="p-6 space-y-5">
        <h2 className="font-display text-xl font-bold text-text-main">{negocio.nombre}</h2>

        {/* Dirección */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            {t('direccion')}
          </p>
          <p className="text-sm text-text-main">{negocio.direccion}</p>
        </div>

        {/* Mapa */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            {t('ubicacion')}
          </p>
          <StaticMap lat={lat} lng={lng} />
          <p className="text-xs text-text-secondary mt-1">
            Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
          </p>
        </div>

        {/* Categorías */}
        {cats.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              {t('categorias')}
            </p>
            <div className="flex flex-wrap gap-1">
              {cats.map((c) => <Badge key={c} variant="primary">{c}</Badge>)}
            </div>
          </div>
        )}

        {/* Gastronómico */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            {t('esGastronomico')}
          </p>
          <p className="text-sm text-text-main">
            {negocio.es_gastronomico ? t('si') : t('no')}
          </p>
        </div>

        {/* Rango de precios */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            {t('rangoPrecios')}
          </p>
          <p className="text-sm text-text-main">{rangoFormatted}</p>
        </div>

        {/* Métodos de pago */}
        {negocio.metodos_pago?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              {t('metodosPago')}
            </p>
            <div className="flex flex-wrap gap-1">
              {negocio.metodos_pago.map((m) => (
                <Badge key={m}>{tn(`metodoPago.${m}`)}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Idiomas */}
        {negocio.idiomas_atencion?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              {t('idiomasAtencion')}
            </p>
            <div className="flex flex-wrap gap-1">
              {negocio.idiomas_atencion.map((i) => (
                <Badge key={i}>{tn(`idioma.${i}`)}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Accesibilidad */}
        {negocio.accesibilidad?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              {t('accesibilidad')}
            </p>
            <div className="flex flex-wrap gap-1">
              {negocio.accesibilidad.map((a) => (
                <Badge key={a}>{tn(`acceso.${a}`)}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Horario */}
        {negocio.horario && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              {t('horario')}
            </p>
            <p className="text-sm text-text-main">{negocio.horario}</p>
          </div>
        )}

        {/* Acciones (solo para pendientes) */}
        {negocio.estado === 'pendiente' && (
          <div className="flex gap-3 pt-2">
            <button onClick={onAprobar} disabled={acting}
              className="btn-primary flex-1 py-2.5 disabled:opacity-50">
              {t('btnAprobar')}
            </button>
            <button onClick={onRechazar} disabled={acting}
              className="btn-accent flex-1 py-2.5 disabled:opacity-50">
              {t('btnRechazar')}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [token, setToken]           = useState<string | null>(null);
  const [pendientes, setPendientes] = useState<Negocio[]>([]);
  const [aprobados, setAprobados]   = useState<Negocio[]>([]);
  const [selected, setSelected]     = useState<Negocio | null>(null);
  const [tab, setTab]               = useState<'pendientes' | 'aprobados'>('pendientes');

  const [pageLoading, setPageLoading] = useState(true);
  const [acting, setActing]           = useState(false);
  const [msg, setMsg]                 = useState('');

  // ── auth + load ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${locale}/negocio/login`); return; }

      // Verificar rol admin
      const { data: profile } = await supabase
        .from('usuarios_negocio')
        .select('rol')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.rol !== 'admin') {
        router.push(`/${locale}/negocio/login`);
        return;
      }

      setToken(session.access_token);
      await loadNegocios(session.access_token);
      setPageLoading(false);
    })();
  }, [locale, router]);

  async function loadNegocios(accessToken: string) {
    const res = await fetch('/api/admin/negocios', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setPendientes(data.pendientes ?? []);
    setAprobados(data.aprobados ?? []);
  }

  // ── actions ────────────────────────────────────────────────────────────────
  async function handleEstado(negocioId: string, estado: 'aprobado' | 'rechazado') {
    if (!token) return;
    setActing(true);
    setMsg('');

    const res = await fetch('/api/admin/negocios', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ negocio_id: negocioId, estado }),
    });

    if (res.ok) {
      setMsg(estado === 'aprobado' ? t('aprobadoExito') : t('rechazadoExito'));
      setSelected(null);
      await loadNegocios(token);
    }

    setActing(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/negocio/login`);
  };

  // ── loading ────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <main className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-secondary">{t('cargando')}</p>
      </main>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-bg-page p-4 pb-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-2xl font-bold text-text-main">{t('title')}</h1>
          <button onClick={handleLogout} className="text-sm text-accent hover:underline transition-opacity hover:opacity-80">
            {t('cerrarSesion')}
          </button>
        </div>

        {/* Mensaje de éxito */}
        {msg && (
          <div className="mb-4 p-3 rounded-lg bg-surface">
            <p className="text-sm text-text-main">{msg}</p>
          </div>
        )}

        {/* Detail view */}
        {selected ? (
          <NegocioDetail
            negocio={selected}
            onAprobar={() => handleEstado(selected.id, 'aprobado')}
            onRechazar={() => handleEstado(selected.id, 'rechazado')}
            onVolver={() => { setSelected(null); setMsg(''); }}
            acting={acting}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex mb-5 border-b border-border-color">
              <button
                onClick={() => setTab('pendientes')}
                className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                  tab === 'pendientes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-main'
                }`}
              >
                {t('tabPendientes')} ({pendientes.length})
              </button>
              <button
                onClick={() => setTab('aprobados')}
                className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                  tab === 'aprobados'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-main'
                }`}
              >
                {t('tabAprobados')} ({aprobados.length})
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {tab === 'pendientes' && (
                pendientes.length === 0
                  ? <p className="text-sm text-text-secondary text-center py-8">{t('sinPendientes')}</p>
                  : pendientes.map((n) => (
                      <NegocioCard key={n.id} negocio={n}
                        onClick={() => setSelected(n)}
                        tRegistrado={t('registrado')}
                        tCategorias={t('categorias')} />
                    ))
              )}
              {tab === 'aprobados' && (
                aprobados.length === 0
                  ? <p className="text-sm text-text-secondary text-center py-8">{t('sinAprobados')}</p>
                  : aprobados.map((n) => (
                      <NegocioCard key={n.id} negocio={n}
                        onClick={() => setSelected(n)}
                        tRegistrado={t('registrado')}
                        tCategorias={t('categorias')} />
                    ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
