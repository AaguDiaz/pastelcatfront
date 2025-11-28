import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarClock,
  Cake,
  CheckCircle2,
  ClipboardList,
  Boxes,
  Package,
  PartyPopper,
  ShieldCheck,
  Users,
  Wheat,
} from 'lucide-react';

type Shortcut = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const shortcuts: Shortcut[] = [
  { title: 'Pedidos', description: 'Organiza entregas y estados.', href: '/pedido', icon: ClipboardList },
  { title: 'Eventos', description: 'Coordina catering y montajes.', href: '/evento', icon: PartyPopper },
  { title: 'Calendario', description: 'Ve tu agenda semanal.', href: '/calendario', icon: CalendarClock },
  { title: 'Notificaciones', description: 'Alertas y novedades del equipo.', href: '/notificaciones', icon: Bell },
  { title: 'Tortas', description: 'Recetas y decoracion especial.', href: '/torta', icon: Cake },
  { title: 'Bandejas', description: 'Controla stock y armado.', href: '/bandeja', icon: Boxes },
  { title: 'Recetas', description: 'Versiona y escala preparaciones.', href: '/recetas', icon: BookOpenCheck },
  { title: 'Materia prima', description: 'Insumos, costos y alertas.', href: '/materia-prima', icon: Wheat },
  { title: 'Articulos', description: 'Utensilios y equipos.', href: '/articulos', icon: Package },
  { title: 'Reportes', description: 'Tableros y rendimiento.', href: '/dashboard', icon: BarChart3 },
  { title: 'Auditoria', description: 'Historial de cambios.', href: '/auditoria', icon: ShieldCheck },
  { title: 'Usuarios', description: 'Roles y accesos.', href: '/usuarios', icon: Users },
];

const checklist = [
  { title: 'Confirma pedidos de hoy', description: 'Revisa entregas prioritarias y estados de pago.' },
  { title: 'Valida stock critico', description: 'Chequea materia prima y bandejas en preparacion.' },
  { title: 'Coordina eventos de la semana', description: 'Cierra horarios y requerimientos especiales.' },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fff4eb] via-[#fff9f3] to-[#f1e9d9] text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-10 h-56 w-56 rounded-full bg-pastel-blue/25 blur-3xl" />
        <div className="absolute -right-14 top-10 h-72 w-72 rounded-full bg-pastel-pink/25 blur-3xl" />
        <div className="absolute bottom-0 left-20 h-40 w-40 rounded-full bg-pastel-yellow/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12 space-y-10">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-black/5 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-pastel-blue" />
              <span>Centro de control</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Bienvenido a PastelCat</h1>
              <p className="max-w-2xl text-lg text-slate-700">
                Organiza pedidos, eventos y stock desde un mismo lugar. Usa los accesos directos para entrar a cada
                modulo sin perder tiempo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pedido"
                className="rounded-xl bg-pastel-blue px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Nuevo pedido
              </Link>
              <Link
                href="/calendario"
                className="rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Ver calendario
              </Link>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-black/5 bg-white/80 p-5 shadow-xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Checklist rapido</p>
                <p className="text-xs text-slate-500">Acciones sugeridas para iniciar el dia</p>
              </div>
              <span className="rounded-full bg-pastel-blue/20 px-3 py-1 text-xs font-semibold text-slate-800">Hoy</span>
            </div>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl border border-black/5 bg-pastel-cream/70 px-3 py-3 shadow-sm"
                >
                  <CheckCircle2 className="mt-1 h-5 w-5 text-pastel-blue" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-2xl backdrop-blur">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Accesos directos</p>
              <h2 className="text-2xl font-semibold text-slate-900">Modulos clave de PastelCat</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="h-2 w-2 rounded-full bg-pastel-yellow" />
              <span>Atajos listos para usar</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              const card = (
                <div
                  className={`group relative h-full rounded-2xl border border-black/5 bg-pastel-cream/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    shortcut.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 ring-1 ring-black/5">
                        <Icon className="h-6 w-6 text-slate-800" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{shortcut.title}</p>
                        <p className="text-sm text-slate-600">{shortcut.description}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        shortcut.disabled ? 'bg-slate-200 text-slate-700' : 'bg-pastel-blue/20 text-slate-800'
                      }`}
                    >
                      {shortcut.disabled ? 'Proximo' : 'Activo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="h-px w-8 bg-slate-400/70" />
                    <span>{shortcut.disabled ? 'Pronto disponible' : 'Ir al modulo'}</span>
                  </div>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 via-white/0 to-white/30 opacity-0 transition group-hover:opacity-100" />
                </div>
              );

              return shortcut.disabled ? (
                <div key={shortcut.title} className="h-full">
                  {card}
                </div>
              ) : (
                <Link key={shortcut.title} href={shortcut.href} className="block h-full">
                  {card}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
