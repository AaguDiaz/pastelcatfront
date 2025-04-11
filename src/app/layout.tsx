'use client';

import Link from 'next/link';
import './globals.css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth= () => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    if (!token && window.location.pathname !== "/login") {
      router.push("/login");
    }
  };

  useEffect(() => {
    checkAuth();

    const handleStorageChange = () => {
      checkAuth();
    };
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(checkAuth, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <html lang="es">
      <body className="bg-pastel-cream">
        <nav className="bg-pastel-pink p-4 shadow-md">
          <div className="flex justify-between items-center px-10">
            <Link href="/" className="text-2xl font-bold">Pastel Cat</Link>
            <div className="space-x-6">
              <Link href="/" className="hover: transition">Inicio</Link>
              {isAuthenticated? (
                <button onClick={handleLogout} className="hover: transition cursor-pointer">Cerrar Sesión</button>
              ) : (
                  <Link href="/login" className="hover: transition">Iniciar Sesión</Link>
              )}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
