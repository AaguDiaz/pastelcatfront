'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  MailCheck,
  Search,
  Square,
} from 'lucide-react';

type NotificationCategory = 'pedido' | 'evento' | 'sistema';

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  category: NotificationCategory;
  trigger_type?: string | null;
  id_pedido?: number | null;
  id_evento?: number | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  is_read: boolean;
  read_at?: string | null;
};

const categoryStyles: Record<NotificationCategory, string> = {
  pedido: 'bg-pastel-blue/20 text-slate-800 border border-pastel-blue/40',
  evento: 'bg-pastel-pink/30 text-slate-800 border border-pastel-pink/50',
  sistema: 'bg-pastel-yellow/30 text-slate-800 border border-pastel-yellow/60',
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '';

const formatCreator = (name?: string | null, id?: string | null) => {
  if (name) return name;
  if (id) return `Usuario ${id.slice(0, 6)}...`;
  return 'Sistema';
};

export default function Notificaciones() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory | 'todas'>('todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pageSize', '50');
      if (activeFilter !== 'todas') {
        params.set('category', activeFilter);
      }
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const res = await fetch(`${api}/notificaciones?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'No se pudieron cargar las notificaciones.');
      }

      const data = await res.json();
      setNotifications(data?.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, search]);

  const toggleRead = async (id: number, nextRead: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${api}/notificaciones/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: nextRead }),
      });

      if (!res.ok) {
        throw new Error('No se pudo actualizar la notificacion.');
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: nextRead, read_at: nextRead ? new Date().toISOString() : null } : item,
        ),
      );

      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${api}/notificaciones/mark-all-read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('No se pudieron marcar todas como leidas.');
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() })));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff4eb] via-[#fffaf4] to-[#f0e8da] text-slate-800">
      <div className="mx-auto max-w-screen-xl space-y-6 px-4 py-10">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-md">
              <Bell className="h-5 w-5 text-pastel-blue" />
            </span>
            Centro de notificaciones
          </div>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Alertas del equipo</h1>
              <p className="max-w-2xl text-base text-slate-700">
                Visualiza pedidos, eventos y avisos del sistema. Marca lo leido para mantener la bandeja limpia.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 shadow-md">
                <CheckCircle2 className="h-4 w-4 text-pastel-blue" />
                <span className="font-semibold text-slate-900">{notifications.length}</span>
                <span className="text-slate-600">totales</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 shadow-md">
                <AlertTriangle className="h-4 w-4 text-pastel-red" />
                <span className="font-semibold text-slate-900">{unreadCount}</span>
                <span className="text-slate-600">sin leer</span>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(['todas', 'pedido', 'evento', 'sistema'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === key
                      ? 'bg-pastel-blue text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:-translate-y-0.5 hover:shadow'
                  }`}
                >
                  {key === 'todas' ? <Bell className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {key === 'todas' ? 'Todas' : key === 'pedido' ? 'Pedidos' : key === 'evento' ? 'Eventos' : 'Sistema'}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:min-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-sm text-slate-800 shadow-inner outline-none transition focus:border-pastel-blue focus:bg-white"
                  placeholder="Buscar por titulo, tipo o texto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={markAllRead}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pastel-blue px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <MailCheck className="h-4 w-4" />
                Marcar todo como leido
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-inner">
            <div className="flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Ultimas novedades
              </span>
              <span className="hidden sm:block">Click para marcar como leido</span>
            </div>

            <div className="divide-y divide-slate-100">
              {loading && (
                <div className="px-6 py-6 text-sm text-slate-500">Cargando notificaciones...</div>
              )}

              {!loading && error && (
                <div className="px-6 py-6 text-sm text-pastel-red">Error: {error}</div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-slate-500">
                  <Bell className="h-8 w-8 text-slate-400" />
                  <p className="text-sm">No hay notificaciones con esos filtros.</p>
                </div>
              )}

              {!loading &&
                !error &&
                notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleRead(item.id, !item.is_read)}
                    className={`group grid w-full grid-cols-[1fr,auto] items-center gap-4 px-5 py-4 text-left transition ${
                      !item.is_read
                        ? 'bg-pastel-cream hover:bg-pastel-cream/80'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${!item.is_read ? 'bg-pastel-red' : 'bg-slate-300'}`}
                          aria-hidden
                        />
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[item.category]}`}
                        >
                          {item.category === 'pedido'
                            ? 'Pedido'
                            : item.category === 'evento'
                              ? 'Evento'
                              : 'Sistema'}
                        </span>
                        {item.id_pedido && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                            Pedido #{item.id_pedido}
                          </span>
                        )}
                        {item.id_evento && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                            Evento #{item.id_evento}
                          </span>
                        )}
                        {item.trigger_type && (
                          <span className="rounded-full bg-pastel-blue/15 px-3 py-1 text-[11px] font-semibold text-slate-700">
                            {item.trigger_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {!item.is_read ? (
                          <Square className="h-4 w-4 text-pastel-red" />
                        ) : (
                          <Check className="h-4 w-4 text-slate-400" />
                        )}
                        <span>{item.title}</span>
                      </div>
                      <p className="text-sm text-slate-600">{item.body}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-pastel-blue" />
                          {formatCreator(item.created_by_name, item.created_by)}
                        </span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-xs font-semibold text-slate-500">
                      <span>{formatTime(item.created_at)}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-600">
                        {!item.is_read ? 'Nuevo' : 'Leido'}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <AlertTriangle className="h-4 w-4 text-pastel-red" />
            Las alertas se cargan en vivo desde el backend. Si algo falla, revisa tu sesion y conexion.
          </div>
        </section>
      </div>
    </div>
  );
}
