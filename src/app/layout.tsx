'use client';

import Link from 'next/link';
import './globals.css';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const checkAuth= () => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    if (!token && window.location.pathname !== "/login") {
      router.push("/login");
    }
  };

  useEffect(() => {
    checkAuth();

    const handleStorageChange = () => checkAuth();
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(checkAuth, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    }
  }, [router, checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <html lang="es">
      <body className="bg-pastel-beige min-h-screen">
        {/* Sidebar */}
        {isAuthenticated && (
          <aside
            className={`fixed top-0 left-0 h-full w-64 bg-pastel-pink shadow-xl transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } z-50`}
            style={{ display: isSidebarOpen ? 'block' : 'none' }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">Menú</h2>
                <button
                  onClick={closeSidebar}
                  className="text-black focus:outline-none hover:bg-pastel-red hover:scale-155 transition-transform duration-200"
                  aria-label="Close sidebar"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <nav>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/materia-prima"
                      className="block text-black hover:bg-pastel-blue hover:scale-105 transition-transform duration-200 p-2 rounded"
                      onClick={closeSidebar}
                    >
                      Materia Prima
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/events"
                      className="block text-black hover:bg-pastel-blue hover:scale-105 transition-transform duration-200 p-2 rounded"
                      onClick={closeSidebar}
                    >
                      Eventos
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>
        )}

        {/* Contenido principal */}
        <div className="flex-1">
          <nav className="bg-pastel-pink p-4 shadow-md flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <button
                  onClick={toggleSidebar}
                  className="text-black focus:outline-none hover:scale-125 transition-transform"
                  aria-label="Toggle sidebar"
                >
                  <Image
                    src="/hamburguesa.png"
                    alt="Menu"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </button>
              )}
              <Link href={isAuthenticated ? '/dashboard' : '/'} className="text-black text-2xl font-bold">
                Pastel Cat
              </Link>
            </div>
            <div>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="text-black hover:text-pastel-blue transition bg-transparent border-none cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              ) : (
                <Link href="/login" className="text-black hover:text-pastel-blue transition">
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </nav>
          <main className="p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}