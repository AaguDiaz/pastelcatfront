'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const API_BASE_URL = api;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Error al iniciar sesión');
      }

      if (!data?.session?.access_token) {
        throw new Error('No se pudo obtener el token de autenticación.');
      }

      localStorage.setItem('token', data.session.access_token);

      if (data?.requiresPasswordReset) {
        localStorage.setItem('pendingPasswordReset', 'true');
        router.push('/set-password');
        return;
      }

      localStorage.removeItem('pendingPasswordReset');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start bg-pastel-beige justify-center pt-16">
      <div className="w-full max-w-md p-8 bg-pastel-cream shadow-2xl rounded-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Iniciar Sesión</h2>
        <p className="text-center text-sm text-neutral-600 mb-4">
          Ingresá tus credenciales para acceder al panel de PastelCat.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mt-1 border rounded focus:ring-1 focus:ring-pastel-blue"
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-1 border rounded focus:ring-1 focus:ring-pastel-blue"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-pastel-blue rounded-lg hover:bg-blue-500 transition disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-blue-500 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
