'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function LoginNegocioPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleForgotPassword() {
    if (!email) {
      setError('Escribe tu email primero');
      return;
    }
    setResetLoading(true);
    setError('');
    const redirectTo = `${window.location.origin}/${locale}/negocio/reset-password`;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setResetSent(true);
    setResetLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError('Error al iniciar sesión.');
        return;
      }

      // 2. Consultar el rol del usuario
      const { data: usuario, error: profileError } = await supabase
        .from('usuarios_negocio')
        .select('rol')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        setError('Error al obtener el perfil. Intenta de nuevo.');
        return;
      }

      // Si no tiene perfil aún, crear uno con rol 'dueno'
      if (!usuario) {
        await supabase.from('usuarios_negocio').insert({
          id: userId,
          email: authData.user.email,
          rol: 'dueno',
          negocio_id: null,
        });
        router.push(`/${locale}/negocio/mi-negocio`);
        return;
      }

      // 3. Redirigir según rol
      if (usuario.rol === 'admin') {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/negocio/mi-negocio`);
      }
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
          {t('loginTitle')}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-color px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
            </button>
          </div>

          {resetSent && (
            <p className="text-sm text-primary">
              Te enviamos un correo para restablecer tu contraseña.
            </p>
          )}

          {error && (
            <p className="text-sm text-accent">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? t('loading') : t('loginBtn')}
          </button>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          {t('noTienesCuenta')}{' '}
          <Link href={`/${locale}/negocio/registro`} className="text-primary hover:underline">
            {t('crearCuenta')}
          </Link>
        </p>
      </div>
    </main>
  );
}
