'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function RegistroNegocioPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError('No se pudo crear el usuario.');
        return;
      }

      // 2. Insertar en usuarios_negocio con rol 'dueno'
      const { error: insertError } = await supabase
        .from('usuarios_negocio')
        .insert({
          id: userId,
          email,
          rol: 'dueno',
          negocio_id: null,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // 3. Redirigir al panel del negocio
      router.push(`/${locale}/mi-negocio`);
    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-page px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-text-main text-center mb-6">
          {t('registroTitle')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-main mb-1">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-main mb-1">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-accent">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? t('loading') : t('registroBtn')}
          </button>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          {t('yaTienesCuenta')}{' '}
          <Link href={`/${locale}/negocio/login`} className="text-primary hover:underline">
            {t('iniciarSesion')}
          </Link>
        </p>
      </div>
    </main>
  );
}
