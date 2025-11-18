'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

const parseTokenParams = () => {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);

  const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');

  return { accessToken, refreshToken };
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { accessToken, refreshToken } = parseTokenParams();
    if (!accessToken || !refreshToken) {
      setError('El enlace es inválido o ya expiró. Volvé a solicitarlo.');
      setStatus('error');
      return;
    }

    supabaseClient.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError('No se pudo validar el enlace. Pedí otro e inténtalo nuevamente.');
          setStatus('error');
        } else {
          setStatus('ready');
        }
      })
      .catch(() => {
        setError('Ocurrió un error al validar el enlace.');
        setStatus('error');
      });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== 'ready') {
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.trim().length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword.trim(),
      });

      if (updateError) {
        throw new Error(updateError.message || 'No se pudo actualizar la contraseña.');
      }

      setSuccess('Contraseña actualizada correctamente. Redirigiendo al inicio de sesión...');
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-pastel-beige pt-16">
      <div className="w-full max-w-md rounded-lg bg-pastel-cream p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center text-neutral-900">Restablecer contraseña</h1>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Elegí una nueva contraseña para continuar usando PastelCat.
        </p>

        {status === 'checking' && (
          <p className="mt-6 text-center text-sm text-neutral-500">Validando enlace...</p>
        )}

        {status === 'error' && (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <Link href="/forgot-password" className="text-blue-500 hover:underline">
              Volver a solicitar enlace
            </Link>
          </div>
        )}

        {status === 'ready' && (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-800">
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                className="mt-1 w-full rounded border border-neutral-200 p-2 focus:ring-1 focus:ring-pastel-blue"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-neutral-800"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="mt-1 w-full rounded border border-neutral-200 p-2 focus:ring-1 focus:ring-pastel-blue"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-center text-sm text-red-500">{error}</p>}
            {success && <p className="text-center text-sm text-green-600">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-pastel-blue py-2 font-semibold text-black transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-neutral-600">
          <Link href="/login" className="text-blue-500 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
