'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ShieldCheck, RefreshCw, Clock4, Users, Activity } from 'lucide-react';
import type { jsPDF as JsPDFType } from 'jspdf';
import { AuthEvent, AuthUsageSummary } from '@/interfaces/auditoria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FormAuditoriaProps = {
  summary: AuthUsageSummary | null;
  summaryLoading?: boolean;
  events: AuthEvent[];
  loading?: boolean;
  page: number;
  totalPages: number;
  filters: { from: string; to: string; type: 'all' | 'login' | 'logout' };
  onDateChange: (from: string, to: string) => void;
  onTypeChange: (value: 'all' | 'login' | 'logout') => void;
  onPageChange: (page: number) => void;
  onReload: () => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
};

const eventLabel = (e: AuthEvent) => {
  const raw = e.type ?? e.status ?? e.metadata?.event_type ?? '';
  if (!raw) return 'Evento';
  const normalized = String(raw).toUpperCase();
  if (normalized.includes('LOGIN')) return 'Login';
  if (normalized.includes('USER_LOGOUT') || normalized.includes('LOGOUT')) return 'Logout';
  return normalized.replace(/_/g, ' ');
};

const eventBadgeColor = (kind: string) => {
  const k = kind.toLowerCase();
  if (k.includes('login') || k.includes('signin')) return 'bg-green-100 text-green-700';
  if (k.includes('logout') || k.includes('signout')) return 'bg-blue-100 text-blue-700';
  if (k.includes('signup')) return 'bg-amber-100 text-amber-700';
  if (k.includes('token')) return 'bg-purple-100 text-purple-700';
  return 'bg-neutral-200 text-neutral-700';
};

const CardStat = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-500">{label}</span>
      <div className="rounded-full bg-pastel-cream p-2 text-neutral-700">{icon}</div>
    </div>
    <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
  </div>
);

const FormAuditoria = ({
  summary,
  summaryLoading,
  events,
  loading,
  page,
  totalPages,
  filters,
  onTypeChange,
  onDateChange,
  onPageChange,
  onReload,
}: FormAuditoriaProps) => {
  const orderedTimeline = useMemo(() => {
    const data = summary?.timeline ?? [];
    return [...data].reverse(); // mas reciente primero
  }, [summary?.timeline]);
  const [timelinePage, setTimelinePage] = useState(1);
  const perPage = 7;
  const timelineTotalPages = Math.max(1, Math.ceil(orderedTimeline.length / perPage));
  useEffect(() => {
    setTimelinePage(1);
  }, [timelineTotalPages]);
  const timelineSlice = useMemo(
    () =>
      orderedTimeline.slice((timelinePage - 1) * perPage, timelinePage * perPage),
    [orderedTimeline, timelinePage, perPage],
  );
  const maxTimeline = useMemo(
    () =>
      timelineSlice.reduce((max, item) => {
        const count =
          Number(item.total ?? item.logins ?? item.logouts ?? item.signups ?? 0) || 0;
        return Math.max(max, count);
      }, 0),
    [timelineSlice],
  );
  const totals = summary?.totals;
  const uniqueUsers =
    summary?.uniqueUsers ??
    (summary?.topUsers ? summary.topUsers.length : undefined);
  const filtersLabel = `${filters.from || '-'} a ${filters.to || '-'}`;
  const topUsersList = useMemo(() => {
    if (!summary?.topUsers?.length) {
      return [];
    }
    return [...summary.topUsers]
      .sort((a, b) => {
        const totalA = Number(a.total ?? a.logins ?? 0);
        const totalB = Number(b.total ?? b.logins ?? 0);
        if (totalB !== totalA) return totalB - totalA;
        const lastA = a.lastEventAt ?? '';
        const lastB = b.lastEventAt ?? '';
        return lastB.localeCompare(lastA);
      })
      .slice(0, 4);
  }, [summary?.topUsers]);
  type JsPDFWithAutoTable = JsPDFType & { lastAutoTable?: { finalY: number } };

  const handleExportPdf = async () => {
    const [{ default: jsPDF }, autoTable] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc: JsPDFWithAutoTable = new jsPDF() as JsPDFWithAutoTable;
    let y = 14;
    doc.setFontSize(16);
    doc.text('Auditoria de eventos', 14, y);
    doc.setFontSize(10);
    y += 8;
    doc.text(`Rango: ${filtersLabel}`, 14, y);
    y += 6;
    doc.text(`Tipo: ${filters.type}`, 14, y);
    y += 4;

    autoTable.default(doc, {
      head: [['Eventos', 'Logins', 'Logouts', 'Usuarios unicos']],
      body: [[
        totals?.events ?? events.length ?? 0,
        totals?.logins ?? 0,
        totals?.logouts ?? 0,
        uniqueUsers ?? '-',
      ]],
      startY: y + 4,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [244, 241, 235] },
    });
    const afterSummary = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : y + 10;

    if (summary?.topUsers?.length) {
      autoTable.default(doc, {
        head: [['Top usuario', 'Email', 'Total', 'Ultimo evento']],
        body: summary.topUsers.slice(0, 10).map((u) => [
          u.name ?? u.email ?? u.userId ?? 'Usuario',
          u.email ?? '-',
          u.total ?? u.logins ?? 0,
          u.lastEventAt ? formatDateTime(u.lastEventAt) : '-',
        ]),
        startY: afterSummary,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [230, 242, 255] },
      });
    }

    const afterTop = doc.lastAutoTable?.finalY
      ? doc.lastAutoTable.finalY + 8
      : afterSummary + 8;
    const eventRows = events.map((evt) => [
      evt.name || evt.email || evt.userId || 'Usuario',
      evt.email ?? '-',
      eventLabel(evt),
      formatDateTime(evt.createdAt),
    ]);
    autoTable.default(doc, {
      head: [['Nombre', 'Mail', 'Tipo', 'Fecha']],
      body: eventRows,
      startY: afterTop,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [243, 206, 214] },
    });
    doc.save(`auditoria-eventos-${Date.now()}.pdf`);
  };

  return (
    <section className="space-y-6 rounded-3xl border border-neutral-200 bg-pastel-cream p-6 shadow-xl">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-neutral-500">Autenticacion</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 shadow-md">
              <ShieldCheck className="h-6 w-6 text-neutral-800" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Eventos de acceso
              </h2>
              <p className="text-sm text-neutral-600">
                Rastrea logins, logouts y cambios recientes.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => onDateChange(e.target.value, filters.to)}
                className="w-36"
              />
              <span className="text-neutral-500">-</span>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => onDateChange(filters.from, e.target.value)}
                className="w-36"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="bg-pastel-blue text-black hover:bg-blue-400"
              onClick={onReload}
              disabled={loading || summaryLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refrescar
            </Button>
            <Button
              type="button"
              className="bg-pastel-yellow text-black hover:bg-yellow-400"
              onClick={handleExportPdf}
              disabled={loading || summaryLoading}
            >
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <CardStat
          label="Eventos totales"
          value={summaryLoading ? '...' : totals?.events ?? events.length}
          icon={<Activity className="h-5 w-5" />}
        />
        <CardStat
          label="Logins"
          value={summaryLoading ? '...' : totals?.logins ?? '-'}
          icon={<Clock4 className="h-5 w-5" />}
        />
        <CardStat
          label="Logouts"
          value={summaryLoading ? '...' : totals?.logouts ?? '-'}
          icon={<Clock4 className="h-5 w-5" />}
        />
        <CardStat
          label="Usuarios unicos"
          value={summaryLoading ? '...' : uniqueUsers ?? 'n/d'}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Actividad por dia</h3>
            <span className="text-xs text-neutral-500">
              {summary?.range?.startDate && summary?.range?.endDate
                ? `${summary.range.startDate?.slice(0, 10)} - ${summary.range.endDate?.slice(0, 10)}`
                : 'Ultimos registros'}
            </span>
          </div>
          <div className="space-y-2">
            {timelineSlice.length ? (
              timelineSlice.map((item) => {
                const count =
                  Number(item.total ?? item.logins ?? item.logouts ?? item.signups ?? 0) ||
                  0;
                const width = maxTimeline ? Math.max(8, (count / maxTimeline) * 100) : 0;
                return (
                  <div key={item.date} className="flex items-center gap-3">
                    <div className="w-20 text-xs font-medium text-neutral-700">
                      {item.date}
                    </div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-pastel-cream">
                        <div
                          className="h-3 rounded-full bg-pastel-blue transition-all"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs text-neutral-500">{count}</div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-neutral-500">Sin datos de timeline.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">
              Pagina {timelinePage} de {timelineTotalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-pastel-blue text-black hover:bg-blue-400"
                onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
                disabled={timelinePage <= 1}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-pastel-blue text-black hover:bg-blue-400"
                onClick={() => setTimelinePage((p) => Math.min(timelineTotalPages, p + 1))}
                disabled={timelinePage >= timelineTotalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-900">Top usuarios</h3>
          </div>
          {topUsersList.length ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {topUsersList.map((user, index) => (
                <div
                  key={`${user.userId ?? user.email ?? index}`}
                  className="rounded-xl border border-neutral-100 bg-pastel-cream px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {index + 1}. {user.name || user.email || 'Usuario'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {user.email || user.userId || 'Sin email'}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-neutral-700">
                      {user.total ?? user.logins ?? 0} evt
                    </span>
                  </div>
                  {user.lastEventAt && (
                    <p className="mt-1 text-[11px] text-neutral-500">
                      Ultimo: {formatDateTime(user.lastEventAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Sin usuarios destacados.</p>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">Detalle de eventos</h3>
            <p className="text-sm text-neutral-600">
              Solo Login y Logout (ordenados del mas reciente).
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="text-sm text-neutral-700">
              Tipo:
              <select
                value={filters.type}
                onChange={(e) => onTypeChange(e.target.value as 'all' | 'login' | 'logout')}
                className="ml-2 h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-800 shadow-sm focus:border-neutral-400 focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-pastel-beige text-neutral-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nombre</th>
                <th className="px-4 py-2 text-left font-medium">Mail</th>
                <th className="px-4 py-2 text-left font-medium">Tipo</th>
                <th className="px-4 py-2 text-left font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {events.map((evt) => {
                const label = eventLabel(evt);
                return (
                  <tr key={String(evt.id)}>
                    <td className="px-4 py-3 font-medium">
                      {evt.name || evt.email || evt.userId || 'Usuario'}
                    </td>
                    <td className="px-4 py-3">{evt.email ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${eventBadgeColor(
                          label,
                        )}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(evt.createdAt)}</td>
                  </tr>
                );
              })}
              {!events.length && !loading && (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-500" colSpan={4}>
                    No hay eventos para mostrar.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-500" colSpan={4}>
                    Cargando eventos...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-pastel-blue text-black hover:bg-blue-400"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-pastel-blue text-black hover:bg-blue-400"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormAuditoria;
