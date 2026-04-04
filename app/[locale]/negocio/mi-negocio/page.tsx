'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
}

interface FormState {
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  rango_min: string;
  rango_max: string;
  metodos_pago: string[];
  idiomas_atencion: string[];
  accesibilidad: string[];
  horario: string;
  es_gastronomico: boolean;
  categorias_ids: string[];
}

const INIT_FORM: FormState = {
  nombre: '', direccion: '',
  lat: 19.413, lng: -99.1735,
  rango_min: '', rango_max: '',
  metodos_pago: [], idiomas_atencion: [], accesibilidad: [],
  horario: '', es_gastronomico: false, categorias_ids: [],
};

const METODOS_PAGO = ['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'];
const IDIOMAS      = ['es', 'en', 'de'];
const ACCESIBILIDAD = ['rampa', 'bano_accesible', 'menu_braille', 'espacio_amplio'];

// ─── Location Picker (Mapbox) ─────────────────────────────────────────────────

function LocationPicker({ lat, lng, onChange }: {
  lat: number; lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markerRef    = useRef<mapboxgl.Marker | null>(null);
  const onChangeRef  = useRef(onChange);
  onChangeRef.current = onChange;

  const t = useTranslations('negocio');

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
    });

    markerRef.current = new mapboxgl.Marker({ color: '#EA580C', draggable: true })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    markerRef.current.on('dragend', () => {
      const { lat: newLat, lng: newLng } = markerRef.current!.getLngLat();
      onChangeRef.current(newLat, newLng);
    });

    mapRef.current.on('click', (e) => {
      markerRef.current!.setLngLat(e.lngLat);
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={containerRef} className="w-full h-64 rounded-lg overflow-hidden" />
      <p className="text-xs text-text-secondary mt-1">
        {t('ubicacionHint')} Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
      </p>
    </div>
  );
}

// ─── Checkbox group ───────────────────────────────────────────────────────────

function CheckboxGroup({ label, items, selected, onToggle, getLabel }: {
  label: string; items: string[]; selected: string[];
  onToggle: (v: string) => void; getLabel: (v: string) => string;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-text-main mb-2">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={selected.includes(item)}
              onChange={() => onToggle(item)} className="accent-primary rounded" />
            <span className="text-sm text-text-main">{getLabel(item)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const t = useTranslations('negocio');
  const styles: Record<string, string> = {
    pendiente: 'bg-accent-soft text-accent-text',
    aprobado:  'bg-surface text-primary',
    rechazado: 'bg-red-50 text-red-700',
  };
  const labels: Record<string, string> = {
    pendiente: t('estadoPendiente'),
    aprobado:  t('estadoAprobado'),
    rechazado: t('estadoRechazado'),
  };
  return (
    <div className="mb-4 p-3 rounded-lg bg-bg-page border border-border-color">
      <p className="text-sm text-text-main">
        {t('estadoLabel')}:{' '}
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[estado] ?? ''}`}>
          {labels[estado] ?? estado}
        </span>
      </p>
      {estado === 'pendiente' && (
        <p className="text-xs text-text-secondary mt-1">{t('msgPendiente')}</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MiNegocioPage() {
  const t = useTranslations('negocio');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [negocioId,   setNegocioId]   = useState<string | null>(null);
  const [estado,      setEstado]      = useState<string | null>(null);
  const [categorias,  setCategorias]  = useState<Categoria[]>([]);
  const [form,        setForm]        = useState<FormState>(INIT_FORM);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  // ── toggle helper ──────────────────────────────────────────────────────────
  const toggle = useCallback((
    field: 'metodos_pago' | 'idiomas_atencion' | 'accesibilidad' | 'categorias_ids',
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }, []);

  // ── load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${locale}/negocio/login`); return; }

      const token = session.access_token;
      setAccessToken(token);

      // Categorías (lectura pública — no necesita service_role)
      const catRes = await supabase.from('categorias').select('id, nombre, tipo');
      if (catRes.data) setCategorias(catRes.data as Categoria[]);

      // Negocio del usuario — usa el API route para bypasar RLS de estado
      const negRes = await fetch('/api/negocios', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const { negocio, categorias_ids } = await negRes.json();

      if (negocio) {
        setNegocioId(negocio.id);
        setEstado(negocio.estado);
        const [min, max] = (negocio.rango_precios ?? '').split('-');
        setForm({
          nombre:           negocio.nombre ?? '',
          direccion:        negocio.direccion ?? '',
          lat:              19.413,
          lng:              -99.1735,
          rango_min:        min ?? '',
          rango_max:        max ?? '',
          metodos_pago:     negocio.metodos_pago ?? [],
          idiomas_atencion: negocio.idiomas_atencion ?? [],
          accesibilidad:    negocio.accesibilidad ?? [],
          horario:          negocio.horario ?? '',
          es_gastronomico:  negocio.es_gastronomico ?? false,
          categorias_ids:   categorias_ids ?? [],
        });
      }

      setPageLoading(false);
    })();
  }, [locale, router]);

  // ── save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.nombre.trim() || !form.direccion.trim()) { setErrorMsg(t('errorNombreDireccion')); return; }
    if (form.categorias_ids.length === 0)               { setErrorMsg(t('errorCategoria'));       return; }
    if (form.metodos_pago.length === 0)                 { setErrorMsg(t('errorMetodoPago'));      return; }
    if (form.idiomas_atencion.length === 0)             { setErrorMsg(t('errorIdioma'));          return; }
    if (!form.rango_min || !form.rango_max)             { setErrorMsg(t('errorRango'));           return; }

    setSaving(true);

    const payload = {
      nombre:          form.nombre.trim(),
      direccion:       form.direccion.trim(),
      ubicacion:       `POINT(${form.lng} ${form.lat})`,   // PostGIS: lng lat
      rango_precios:   `${form.rango_min}-${form.rango_max}`,
      metodos_pago:    form.metodos_pago,
      idiomas_atencion: form.idiomas_atencion,
      accesibilidad:   form.accesibilidad,
      horario:         form.horario.trim(),
      es_gastronomico: form.es_gastronomico,
      categorias_ids:  form.categorias_ids,
      ...(negocioId ? { negocio_id: negocioId } : {}),
    };

    const res = await fetch(`/api/negocios`, {
      method:  negocioId ? 'PATCH' : 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      setErrorMsg(json.error ?? 'Error al guardar');
      setSaving(false);
      return;
    }

    if (!negocioId) {
      setNegocioId(json.id);
      setEstado('pendiente');
      setSuccessMsg(t('msgRegistrado'));
    } else {
      setSuccessMsg(t('msgGuardado'));
    }

    setSaving(false);
  };

  // ── logout ─────────────────────────────────────────────────────────────────
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

  const categoriasPorTipo = categorias.reduce<Record<string, Categoria[]>>((acc, cat) => {
    (acc[cat.tipo] ||= []).push(cat);
    return acc;
  }, {});

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-bg-page p-4 pb-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-text-main">
            {negocioId ? t('titleEditar') : t('titleRegistrar')}
          </h1>
          <button onClick={handleLogout}
            className="text-sm text-accent hover:underline">
            {t('cerrarSesion')}
          </button>
        </div>

        {/* Estado (solo en modo edición) */}
        {estado && <EstadoBadge estado={estado} />}

        {/* Mensajes */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-accent-soft">
            <p className="text-sm text-accent-text">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-surface">
            <p className="text-sm text-text-main">{successMsg}</p>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              {t('fieldNombre')} *
            </label>
            <input type="text" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder={t('fieldNombrePlaceholder')}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              {t('fieldDireccion')} *
            </label>
            <input type="text" value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder={t('fieldDireccionPlaceholder')}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {/* Mapa */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              {t('fieldUbicacion')} *
            </label>
            <LocationPicker lat={form.lat} lng={form.lng}
              onChange={(lat, lng) => setForm((prev) => ({ ...prev, lat, lng }))} />
          </div>

          {/* Categorías agrupadas */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              {t('fieldCategorias')} *
            </label>
            {Object.entries(categoriasPorTipo).map(([tipo, cats]) => (
              <div key={tipo} className="mb-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  {tipo}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {cats.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.categorias_ids.includes(cat.id)}
                        onChange={() => toggle('categorias_ids', cat.id)}
                        className="accent-primary rounded" />
                      <span className="text-sm text-text-main capitalize">{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Es gastronómico */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.es_gastronomico}
              onChange={(e) => setForm({ ...form, es_gastronomico: e.target.checked })}
              className="accent-primary rounded" />
            <span className="text-sm font-medium text-text-main">{t('fieldEsGastronomico')}</span>
          </label>

          {/* Rango de precios MIN-MAX */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              {t('fieldRangoPrecios')} *
            </label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} value={form.rango_min}
                onChange={(e) => setForm({ ...form, rango_min: e.target.value })}
                placeholder={t('rangoMin')}
                className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary" />
              <span className="text-text-secondary font-medium">–</span>
              <input type="number" min={0} value={form.rango_max}
                onChange={(e) => setForm({ ...form, rango_max: e.target.value })}
                placeholder={t('rangoMax')}
                className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <p className="text-xs text-text-secondary mt-1">{t('rangoHint')}</p>
          </div>

          {/* Métodos de pago */}
          <CheckboxGroup label={`${t('fieldMetodosPago')} *`} items={METODOS_PAGO}
            selected={form.metodos_pago} onToggle={(v) => toggle('metodos_pago', v)}
            getLabel={(v) => t(`metodoPago.${v}`)} />

          {/* Idiomas */}
          <CheckboxGroup label={`${t('fieldIdiomasAtencion')} *`} items={IDIOMAS}
            selected={form.idiomas_atencion} onToggle={(v) => toggle('idiomas_atencion', v)}
            getLabel={(v) => t(`idioma.${v}`)} />

          {/* Accesibilidad */}
          <CheckboxGroup label={t('fieldAccesibilidad')} items={ACCESIBILIDAD}
            selected={form.accesibilidad} onToggle={(v) => toggle('accesibilidad', v)}
            getLabel={(v) => t(`acceso.${v}`)} />

          {/* Horario */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              {t('fieldHorario')}
            </label>
            <input type="text" value={form.horario}
              onChange={(e) => setForm({ ...form, horario: e.target.value })}
              placeholder={t('horarioPlaceholder')}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {/* Botón guardar */}
          <button type="button" onClick={handleSave} disabled={saving}
            className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving
              ? t('btnGuardando')
              : negocioId ? t('btnGuardar') : t('btnRegistrar')}
          </button>

        </div>
      </div>
    </main>
  );
}
