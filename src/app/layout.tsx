'use client';

import Link from 'next/link';
import './globals.css';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';
import { api } from '@/lib/api';

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openPasteleria, setOpenPasteleria] = useState(false);
  const [openCatering, setOpenCatering] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const pathname = window.location.pathname;
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    setIsAuthenticated(!!token);
    if (!token && !isPublicRoute) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();

    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkAuth, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [checkAuth]);

  const loadUnreadNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadNotifications(0);
      return;
    }

    try {
      const res = await fetch(`${api}/notificaciones?unread=true&pageSize=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setUnreadNotifications(0);
        return;
      }

      const data = await res.json();
      setUnreadNotifications(Number(data?.unreadCount || 0));
    } catch {
      setUnreadNotifications(0);
    }
  }, []);

  useEffect(() => {
    loadUnreadNotifications();

    const handleNotificationsUpdate = () => loadUnreadNotifications();
    window.addEventListener('notifications-updated', handleNotificationsUpdate);
    window.addEventListener('storage', handleNotificationsUpdate);

    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate);
      window.removeEventListener('storage', handleNotificationsUpdate);
    };
  }, [loadUnreadNotifications]);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${api}/auth/logout`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/login');
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
            className={`fixed top-0 left-0 h-full w-64 bg-pastel-cream shadow-xl transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } z-50`}
            style={{ display: isSidebarOpen ? 'block' : 'none' }}
          >
            <div className="min-h-screen w-64">
              <div className="bg-pastel-pink flex justify-between items-center p-4.5 mb-4 shadow-xl">
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
              <div className="p-4">
                <button onClick={()=> setOpenPasteleria(!openPasteleria)} className='w-full text-left font-semibold hover:scale-105 transition-transform mb-2'> 🎂 Gestión Pastelería</button>
                <AnimatePresence>
                  {openPasteleria && (
                    <motion.ul 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 pl-4 mb-4">
                      <li>
                        <Link
                          href="/pedido"
                          className="hover:underline cursor-pointer"
                          onClick={closeSidebar}
                        >
                          📦 Pedidos
                        </Link>
                      </li>
                      <li>
                        <Link
                            href="/torta"
                            className="hover:underline cursor-pointer"
                            onClick={closeSidebar}
                          >
                            🍰 Tortas
                          </Link>
                        </li>
                      <li>
                        <Link
                          href="/bandeja"
                          className="hover:underline cursor-pointer"
                          onClick={closeSidebar}
                        >
                          🍱 Bandejas
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/recetas"
                          className="hover:underline cursor-pointer"
                          onClick={closeSidebar}
                        >
                          📖 Recetas
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/materia-prima"
                          className="hover:underline cursor-pointer"
                          onClick={closeSidebar}
                        >
                          🥣 Materia Prima
                        </Link>
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
                <button onClick={() => setOpenCatering(!openCatering)} className="w-full text-left font-semibold hover:scale-105 transition-transform ">
                  🍽️ Gestión Catering
                </button>
                <AnimatePresence>
                  {openCatering && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 mb-4 space-y-1"
                    >
                      <li className="hover:underline cursor-pointer"><Link
                          href="/evento"
                          className="hover:underline cursor-pointer"
                          onClick={closeSidebar}
                        >
                          🎉 Eventos
                        </Link></li>
                      <li className="hover:underline cursor-pointer"><Link
                          href="/articulos"
                          className="hover:underline cursor-pointer"
                          onClick={closeSidebar}
                        >
                          🧂 Artículos
                        </Link></li>
                    </motion.ul>
                  )}
                </AnimatePresence>

                <div className="mt-4 space-y-2">
                  <Link
                    href="/notificaciones"
                    className="hover:scale-105 transition-transform cursor-pointer flex justify-between items-center"
                    onClick={closeSidebar}
                  >
                    <div className="flex items-center gap-2">
                      <span>🔔 Notificaciones</span>
                      {unreadNotifications > 0 && (
                        <span className="rounded-full bg-pastel-red px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow">
                          {unreadNotifications}
                        </span>
                      )}
                    </div>
                    <Bell size={16} />
                  </Link>
                  <div className="hover:scale-105 transition-transform cursor-pointer flex justify-between items-center">
                    <Link href="/calendario" className="cursor-pointer" onClick={closeSidebar}>📅 Calendario</Link>
                    <Calendar size={16} />
                  </div>
                  <Link href="/dashboard" className="hover:scale-105 transition-transform cursor-pointer flex justify-between items-center">
                    <span>📊 Reportes</span>
                    <LayoutDashboard size={16} />
                  </Link>
                  <Link href="/auditoria" className="hover:scale-105 transition-transform cursor-pointer flex justify-between items-center">
                    <span>🕵️ Auditoría</span>
                    <ShieldCheck size={16} />
                  </Link>
                  <div className="hover:scale-105 transition-transform cursor-pointer flex justify-between items-center">
                    <Link 
                      href="/usuarios"
                      className="hover:underline cursor-pointer"
                      onClick={closeSidebar}>
                      👥 Usuarios
                    </Link>
                    <Users size={16} />
                  </div>
                </div>
              </div>
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
              <Link href={isAuthenticated ? '/home' : '/'} className="text-black text-2xl font-bold">
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
