'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const API_BASE_URL = api;

export default function SetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem('pendingPasswordReset');
    const token = localStorage.getItem('token');
    if (!token || pending !== 'true') {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Tu sesión expiró. Iniciá sesión nuevamente.');
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error?.message || 'No se pudo actualizar la contraseña.',
        );
      }

      localStorage.removeItem('pendingPasswordReset');
      setSuccess('Contraseña actualizada correctamente. Redirigiendo...');
      setTimeout(() => {
        router.replace('/');
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-pastel-beige pt-16">
      <div className="w-full max-w-md rounded-lg bg-pastel-cream p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center text-neutral-900">
          Definir nueva contraseña
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Es tu primer ingreso. Actualizá tu contraseña para continuar usando
          PastelCat.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-800"
            >
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
          {success && (
            <p className="text-center text-sm text-green-600">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pastel-blue py-2 font-semibold text-black transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-600">
          <Link href="/login" className="text-blue-500 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
