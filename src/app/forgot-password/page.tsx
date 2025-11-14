'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const API_BASE_URL = api;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || 'No se pudo enviar el correo.');
      }

      setMessage(
        data?.message ||
          'Si el correo existe en nuestros registros, recibirás un enlace para continuar.',
      );
      setEmail('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-pastel-beige pt-16">
      <div className="w-full max-w-md rounded-lg bg-pastel-cream p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center text-neutral-900">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Ingresá tu correo electrónico y te enviaremos un enlace para
          restablecerla.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-800"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 w-full rounded border border-neutral-200 p-2 focus:ring-1 focus:ring-pastel-blue"
              placeholder="tu@correo.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          {message && (
            <p className="text-sm text-green-600 text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pastel-blue py-2 font-semibold text-black transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
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
