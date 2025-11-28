'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  MailCheck,
  Search,
  Square,
} from 'lucide-react';

type NotificationCategory = 'pedido' | 'evento' | 'sistema';

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  scheduledFor?: string;
  category: NotificationCategory;
  createdBy: string;
  unread: boolean;
  tag?: string;
};

const STORAGE_KEY = 'pastelcat-mock-notifications';

const seedNotifications: NotificationItem[] = [
  {
    id: 'PED-1042',
    title: 'Nuevo pedido · Mesa dulce',
    detail: 'Registrado por Camila Romero. 12 mini tartas + 48 cupcakes para cumpleaños.',
    createdAt: '2025-05-18T10:00:00',
    scheduledFor: '2025-05-20',
    category: 'pedido',
    createdBy: 'Camila Romero',
    unread: true,
    tag: 'Entrega 17:00',
  },
  {
    id: 'EVE-203',
    title: 'Evento confirmado · Boda Alvarez',
    detail: 'Armado de candy bar y torta principal. Coordinar traslado y vajilla.',
    createdAt: '2025-05-18T09:20:00',
    scheduledFor: '2025-05-18',
    category: 'evento',
    createdBy: 'Leonor Peña',
    unread: true,
    tag: 'Hoy',
  },
  {
    id: 'PED-1041',
    title: 'Pago registrado · Pedido 1038',
    detail: 'Pago confirmado por transferencia. Actualiza estado a “Pago recibido”.',
    createdAt: '2025-05-17T18:30:00',
    category: 'pedido',
    createdBy: 'Pablo Nieva',
    unread: false,
    tag: 'Finanzas',
  },
  {
    id: 'SIS-12',
    title: 'Recordatorio de stock · Crema chantilly',
    detail: 'El stock queda por debajo del mínimo para dos eventos del viernes.',
    createdAt: '2025-05-17T08:10:00',
    category: 'sistema',
    createdBy: 'PastelCat',
    unread: true,
    tag: 'Alerta',
  },
  {
    id: 'EVE-198',
    title: 'Evento · Baby Shower Ortiz',
    detail: 'Revisar lista de alérgenos y definir emplatado. Confirmar personal.',
    createdAt: '2025-05-16T16:00:00',
    scheduledFor: '2025-05-19',
    category: 'evento',
    createdBy: 'Lucía Torres',
    unread: false,
    tag: 'Planificación',
  },
  {
    id: 'PED-1039',
    title: 'Pedido listo para envío',
    detail: 'Caja premium + topper personalizado. Confirmar logística con Ramiro.',
    createdAt: '2025-05-15T12:45:00',
    scheduledFor: '2025-05-18',
    category: 'pedido',
    createdBy: 'Ramiro Velázquez',
    unread: false,
    tag: 'Despacho',
  },
  {
    id: 'SIS-11',
    title: 'Backup generado',
    detail: 'Respaldo diario completado. Descarga disponible por 7 días.',
    createdAt: '2025-05-15T07:00:00',
    category: 'sistema',
    createdBy: 'PastelCat',
    unread: false,
    tag: 'Sistema',
  },
];

const categoryStyles: Record<NotificationCategory, string> = {
  pedido: 'bg-pastel-blue/20 text-slate-800 border border-pastel-blue/40',
  evento: 'bg-pastel-pink/30 text-slate-800 border border-pastel-pink/50',
  sistema: 'bg-pastel-yellow/30 text-slate-800 border border-pastel-yellow/60',
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    : '';

const isToday = (value?: string) => {
  if (!value) return false;
  const today = new Date();
  const target = new Date(value);
  return (
    today.getFullYear() === target.getFullYear() &&
    today.getMonth() === target.getMonth() &&
    today.getDate() === target.getDate()
  );
};

const ensureStorageSeed = () => {
  if (typeof window === 'undefined') return seedNotifications;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as NotificationItem[];
    } catch {
      // continue with seed
    }
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedNotifications));
  return seedNotifications;
};

export default function Notificaciones() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory | 'todas'>('todas');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setNotifications(ensureStorageSeed());
  }, []);

  const persist = (items: NotificationItem[]) => {
    setNotifications(items);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('notifications-updated'));
    }
  };

  const toggleRead = (id: string) => {
    const updated = notifications.map((item) =>
      item.id === id ? { ...item, unread: !item.unread } : item,
    );
    persist(updated);
  };

  const markAllRead = () => {
    const updated = notifications.map((item) => ({ ...item, unread: false }));
    persist(updated);
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesCategory = activeFilter === 'todas' || item.category === activeFilter;
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.detail.toLowerCase().includes(term) ||
        item.createdBy.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [notifications, activeFilter, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff4eb] via-[#fffaf4] to-[#f0e8da] text-slate-800">
      <div className="mx-auto max-w-screen space-y-6 px-4 py-10">
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
                Visualiza pedidos, eventos y avisos del sistema. Marca lo leído y prioriza lo que vence hoy.
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
                  placeholder="Buscar por persona, pedido o evento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={markAllRead}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pastel-blue px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <MailCheck className="h-4 w-4" />
                Marcar todo como leído
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-inner">
            <div className="flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Últimas novedades
              </span>
              <span className="hidden sm:block">Click para marcar como leído</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-slate-500">
                  <Bell className="h-8 w-8 text-slate-400" />
                  <p className="text-sm">No hay notificaciones con esos filtros.</p>
                </div>
              )}

              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleRead(item.id)}
                  className={`group grid w-full grid-cols-[1fr,auto] items-center gap-4 px-5 py-4 text-left transition ${
                    item.unread
                      ? 'bg-pastel-cream hover:bg-pastel-cream/80'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${item.unread ? 'bg-pastel-red' : 'bg-slate-300'}`}
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
                      {item.tag && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                          {item.tag}
                        </span>
                      )}
                      {isToday(item.scheduledFor) && (
                        <span className="flex items-center gap-1 rounded-full bg-pastel-red/15 px-3 py-1 text-[11px] font-semibold text-pastel-red">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Hoy
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      {item.unread ? (
                        <Square className="h-4 w-4 text-pastel-red" />
                      ) : (
                        <Check className="h-4 w-4 text-slate-400" />
                      )}
                      <span>{item.title}</span>
                    </div>
                    <p className="text-sm text-slate-600">{item.detail}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-pastel-blue" />
                        {item.createdBy}
                      </span>
                      <span>{formatDate(item.scheduledFor || item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs font-semibold text-slate-500">
                    <span>{formatTime(item.createdAt)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-600">
                      {item.unread ? 'Nuevo' : 'Leído'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <AlertTriangle className="h-4 w-4 text-pastel-red" />
            Las alertas se resetean al cerrar sesión. Luego podremos conectarlas al backend para notificar en tiempo real.
          </div>
        </section>
      </div>
    </div>
  );
}
