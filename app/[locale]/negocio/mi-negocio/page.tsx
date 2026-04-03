'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';

interface Negocio {
  id: string;
  nombre: string;
  direccion: string;
  rango_precios: string;
  metodos_pago: string[];
  idiomas_atencion: string[];
  accesibilidad: string[];
  horario: string;
  es_gastronomico: boolean;
  estado: string;
  categorias: string[];
  lat: number;
  lng: number;
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
}

export default function MiNegocioPage() {
  const t = useTranslations();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    lat: 19.4130,
    lng: -99.1735,
    rango_precios: '$',
    metodos_pago: [] as string[],
    idiomas_atencion: [] as string[],
    accesibilidad: [] as string[],
    horario: '',
    es_gastronomico: false,
    categorias_seleccionadas: [] as string[],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push(`/${locale}/negocio/login`);
        return;
      }

      setUser(sessionData.session.user);

      // Cargar categorías
      const { data: catData } = await supabase
        .from('categorias')
        .select('id, nombre, tipo');
      if (catData) {
        setCategorias(catData as Categoria[]);
      }

      // Cargar datos del negocio si existen
      const { data: userData } = await supabase
        .from('usuarios_negocio')
        .select('negocio_id')
        .eq('id', sessionData.session.user.id)
        .single();

      if (userData?.negocio_id) {
        const { data: negocioData } = await supabase
          .from('negocios')
          .select('*')
          .eq('id', userData.negocio_id)
          .single();

        if (negocioData) {
          const ubicacion = negocioData.ubicacion as any;
          setNegocio(negocioData);
          setForm({
            nombre: negocioData.nombre || '',
            direccion: negocioData.direccion || '',
            lat: ubicacion?.coordinates?.[1] || 19.4130,
            lng: ubicacion?.coordinates?.[0] || -99.1735,
            rango_precios: negocioData.rango_precios || '$',
            metodos_pago: negocioData.metodos_pago || [],
            idiomas_atencion: negocioData.idiomas_atencion || [],
            accesibilidad: negocioData.accesibilidad || [],
            horario: negocioData.horario || '',
            es_gastronomico: negocioData.es_gastronomico || false,
            categorias_seleccionadas: [],
          });

          // Cargar categorías del negocio
          const { data: negCatData } = await supabase
            .from('negocio_categorias')
            .select('categoria_id')
            .eq('negocio_id', userData.negocio_id);
          if (negCatData) {
            setForm((prev) => ({
              ...prev,
              categorias_seleccionadas: negCatData.map((nc) => nc.categoria_id),
            }));
          }
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [locale, router]);

  const toggleMetodoPago = (metodo: string) => {
    setForm((prev) => ({
      ...prev,
      metodos_pago: prev.metodos_pago.includes(metodo)
        ? prev.metodos_pago.filter((m) => m !== metodo)
        : [...prev.metodos_pago, metodo],
    }));
  };

  const toggleIdiomaAtencion = (idioma: string) => {
    setForm((prev) => ({
      ...prev,
      idiomas_atencion: prev.idiomas_atencion.includes(idioma)
        ? prev.idiomas_atencion.filter((i) => i !== idioma)
        : [...prev.idiomas_atencion, idioma],
    }));
  };

  const toggleAccesibilidad = (acceso: string) => {
    setForm((prev) => ({
      ...prev,
      accesibilidad: prev.accesibilidad.includes(acceso)
        ? prev.accesibilidad.filter((a) => a !== acceso)
        : [...prev.accesibilidad, acceso],
    }));
  };

  const toggleCategoria = (catId: string) => {
    setForm((prev) => ({
      ...prev,
      categorias_seleccionadas: prev.categorias_seleccionadas.includes(catId)
        ? prev.categorias_seleccionadas.filter((c) => c !== catId)
        : [...prev.categorias_seleccionadas, catId],
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');

    try {
      // Validaciones básicas
      if (!form.nombre || !form.direccion || form.categorias_seleccionadas.length === 0) {
        setError('Por favor completa nombre, dirección y al menos una categoría');
        setSaving(false);
        return;
      }

      if (form.metodos_pago.length === 0 || form.idiomas_atencion.length === 0) {
        setError('Debes seleccionar al menos un método de pago y un idioma');
        setSaving(false);
        return;
      }

      // Si es un negocio nuevo
      if (!negocio) {
        const { data: newNegocio, error: insertError } = await supabase
          .from('negocios')
          .insert({
            nombre: form.nombre,
            direccion: form.direccion,
            ubicacion: `POINT(${form.lng} ${form.lat})`,
            rango_precios: form.rango_precios,
            metodos_pago: form.metodos_pago,
            idiomas_atencion: form.idiomas_atencion,
            accesibilidad: form.accesibilidad,
            horario: form.horario,
            es_gastronomico: form.es_gastronomico,
            estado: 'pendiente',
          })
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }

        // Insertar categorías
        const { error: catError } = await supabase
          .from('negocio_categorias')
          .insert(
            form.categorias_seleccionadas.map((catId) => ({
              negocio_id: newNegocio.id,
              categoria_id: catId,
            }))
          );

        if (catError) {
          setError(catError.message);
          setSaving(false);
          return;
        }

        // Actualizar usuarios_negocio
        const { error: userError } = await supabase
          .from('usuarios_negocio')
          .update({ negocio_id: newNegocio.id })
          .eq('id', user.id);

        if (userError) {
          setError(userError.message);
          setSaving(false);
          return;
        }

        setNegocio(newNegocio);
      } else {
        // Actualizar negocio existente
        const { error: updateError } = await supabase
          .from('negocios')
          .update({
            nombre: form.nombre,
            direccion: form.direccion,
            ubicacion: `POINT(${form.lng} ${form.lat})`,
            rango_precios: form.rango_precios,
            metodos_pago: form.metodos_pago,
            idiomas_atencion: form.idiomas_atencion,
            accesibilidad: form.accesibilidad,
            horario: form.horario,
            es_gastronomico: form.es_gastronomico,
          })
          .eq('id', negocio.id);

        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }

        // Actualizar categorías: eliminar antiguas e insertar nuevas
        await supabase
          .from('negocio_categorias')
          .delete()
          .eq('negocio_id', negocio.id);

        const { error: catError } = await supabase
          .from('negocio_categorias')
          .insert(
            form.categorias_seleccionadas.map((catId) => ({
              negocio_id: negocio.id,
              categoria_id: catId,
            }))
          );

        if (catError) {
          setError(catError.message);
          setSaving(false);
          return;
        }
      }

      setSaving(false);
    } catch (err) {
      setError('Error al guardar');
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/negocio/login`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-secondary">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-page p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-text-main">
            {negocio ? 'Editar mi negocio' : 'Registrar mi negocio'}
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-accent hover:underline"
          >
            Cerrar sesión
          </button>
        </div>

        {negocio && (
          <div className="mb-4 p-3 bg-surface rounded-lg">
            <p className="text-sm font-medium text-text-main">
              Estado: <span className="capitalize">{negocio.estado}</span>
            </p>
            {negocio.estado === 'pendiente' && (
              <p className="text-sm text-text-secondary mt-1">
                Tu negocio será revisado por un administrador antes de publicarse
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-accent-soft rounded-lg border border-accent">
            <p className="text-sm text-accent-text">{error}</p>
          </div>
        )}

        <form className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Nombre del negocio
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: Café La Condesa"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: Avenida Paseo de la Reforma 505"
            />
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Latitud
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Longitud
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Categorías */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Categorías
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categorias.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.categorias_seleccionadas.includes(cat.id)}
                    onChange={() => toggleCategoria(cat.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-text-main">{cat.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Es gastronómico */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.es_gastronomico}
                onChange={(e) => setForm({ ...form, es_gastronomico: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-text-main">
                Este es un negocio gastronómico (restaurante, café, etc.)
              </span>
            </label>
          </div>

          {/* Rango de precios */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Rango de precios
            </label>
            <select
              value={form.rango_precios}
              onChange={(e) => setForm({ ...form, rango_precios: e.target.value })}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="$">$ - Económico</option>
              <option value="$$">$$ - Medio</option>
              <option value="$$$">$$$ - Alto</option>
            </select>
          </div>

          {/* Métodos de pago */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Métodos de pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'].map(
                (metodo) => (
                  <label key={metodo} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.metodos_pago.includes(metodo)}
                      onChange={() => toggleMetodoPago(metodo)}
                      className="rounded"
                    />
                    <span className="text-sm text-text-main capitalize">
                      {metodo.replace('_', ' ')}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Idiomas de atención */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Idiomas de atención
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['es', 'en', 'de'].map((idioma) => (
                <label key={idioma} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.idiomas_atencion.includes(idioma)}
                    onChange={() => toggleIdiomaAtencion(idioma)}
                    className="rounded"
                  />
                  <span className="text-sm text-text-main uppercase">{idioma}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Accesibilidad */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Accesibilidad
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['rampa', 'bano_accesible', 'menu_braille', 'espacio_amplio'].map(
                (acceso) => (
                  <label key={acceso} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.accesibilidad.includes(acceso)}
                      onChange={() => toggleAccesibilidad(acceso)}
                      className="rounded"
                    />
                    <span className="text-sm text-text-main capitalize">
                      {acceso.replace('_', ' ')}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Horario */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Horario
            </label>
            <input
              type="text"
              value={form.horario}
              onChange={(e) => setForm({ ...form, horario: e.target.value })}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: Lun-Vie 8:00-18:00, Sáb 9:00-15:00"
            />
          </div>

          {/* Botón guardar */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Guardando...' : negocio ? 'Guardar cambios' : 'Registrar negocio'}
          </button>
        </form>
      </div>
    </main>
  );
}
