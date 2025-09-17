'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Chart from 'chart.js/auto';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart3, CalendarRange, PieChart, RefreshCw, ShoppingBag, TableProperties, TrendingUp, Users, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { debugFetch } from '@/lib/debugFetch';

type DashboardFilters = {
  fechaInicio: string;
  fechaFin: string;
  granularidad: 'day' | 'week' | 'month';
};

type DashboardResumen = {
  ingresosTotales: number;
  totalPedidos: number;
  ticketPromedio: number;
};

type RevenuePoint = {
  key: string;
  label: string;
  periodStart: string;
  ingresos: number;
  pedidos: number;
};

type PedidoEstado = {
  estado: string;
  cantidad: number;
};

type MateriaVariacion = {
  id_materiaprima: number;
  nombre: string;
  variacionPorcentual: number;
  precioInicial: number;
  precioFinal: number;
  fechaInicial: string;
  fechaFinal: string;
};


type ProductoTop = {
  id_torta: number;
  nombre: string;
  ingresos: number;
  cantidad: number;
};

type ProductoDetalle = {
  id: number;
  tipo: 'torta' | 'bandeja';
  nombre: string;
  cantidadVendida: number;
  ingresosTotales: number;
  precioPromedio: number;
};

type ClienteResumen = {
  id_cliente: number;
  nombre: string;
  email: string | null;
  totalGastado: number;
  cantidadPedidos: number;
};

type DashboardClientes = {
  top?: ClienteResumen[] | null;
};



type DashboardProductos = {
  topTortas?: ProductoTop[] | null;
  tablaProductos?: ProductoDetalle[] | null;
};

type DashboardVentas = {
  tendenciaIngresos?: {
    granularity: 'day' | 'week' | 'month';
    series: RevenuePoint[];
  } | null;
  pedidosPorEstado?: PedidoEstado[] | null;
  materiasPrimaMasCaras?: MateriaVariacion[] | null;
};

type DashboardResponse = {
  filtros: DashboardFilters;
  resumen: DashboardResumen;
  ventas?: DashboardVentas | null;
  productos?: DashboardProductos | null;
  clientes?: DashboardClientes | null;
};
type QuickRange = {
  id: string;
  label: string;
  days: number;
};


const QUICK_RANGES: QuickRange[] = [
  { id: '7', label: 'Ultimos 7 dias', days: 7 },
  { id: '14', label: 'Ultimos 14 dias', days: 14 },
  { id: '30', label: 'Ultimos 30 dias', days: 30 },
  { id: '90', label: 'Ultimos 90 dias', days: 90 },
];

const DASHBOARD_ENDPOINT = `${api}/dashboard`;

const formatDateForInput = (date: Date) => {
  const tzSafe = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return tzSafe.toISOString().slice(0, 10);
};

const formatDateLabel = (isoDate: string) => {
  try {
    return format(parseISO(isoDate), "d 'de' MMMM yyyy", { locale: es });
  } catch {
    return isoDate;
  }
};

const CorePedidos = () => {
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => formatDateForInput(addDays(today, -29)));
  const [endDate, setEndDate] = useState(() => formatDateForInput(today));
  const [activePreset, setActivePreset] = useState<string>('30');

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const initialFetchDone = useRef(false);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }),
    []
  );
  const numberFormatter = useMemo(() => new Intl.NumberFormat('es-AR'), []);

  const fetchDashboard = useCallback(
    async (range: { start: string; end: string }, opts?: { silent?: boolean }) => {
      const { start, end } = range;
      const silent = opts?.silent ?? false;
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const url = new URL(DASHBOARD_ENDPOINT);
        if (start) url.searchParams.set('startDate', start);
        if (end) url.searchParams.set('endDate', end);

        const response = await debugFetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          const msg = await response.text();
          throw new Error(msg || 'No se pudo cargar el dashboard');
        }

        const body = (await response.json()) as DashboardResponse;
        setData(body);
      } catch (err) {
        console.error('Dashboard fetch error', err);
        setError(err instanceof Error ? err.message : 'Error inesperado al cargar el dashboard');
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (initialFetchDone.current) {
      return;
    }
    initialFetchDone.current = true;
    fetchDashboard({ start: startDate, end: endDate });
  }, [fetchDashboard, startDate, endDate]);

  const handleApplyFilters = () => {
    setActivePreset('custom');
    fetchDashboard({ start: startDate, end: endDate }, { silent: Boolean(data) });
  };

  const handlePresetClick = (preset: QuickRange) => {
    const end = new Date();
    const start = addDays(end, -(preset.days - 1));
    const formattedStart = formatDateForInput(start);
    const formattedEnd = formatDateForInput(end);
    setStartDate(formattedStart);
    setEndDate(formattedEnd);
    setActivePreset(preset.id);
    fetchDashboard({ start: formattedStart, end: formattedEnd }, { silent: Boolean(data) });
  };

  const filtros = data?.filtros;
  const resumen = data?.resumen;
  const ventas = data?.ventas;
  const productos = data?.productos;
  const clientes = data?.clientes;
  const revenueSeries: RevenuePoint[] = ventas?.tendenciaIngresos?.series ?? [];
  const revenueChartData = useMemo(() => {
    if (!revenueSeries.length) return null;
    return {
      labels: revenueSeries.map((point) => point.label || point.key),
      values: revenueSeries.map((point) => Number(point.ingresos) || 0),
    };
  }, [revenueSeries]);

  const statusSeries: PedidoEstado[] = ventas?.pedidosPorEstado ?? [];
  const statusChartData = useMemo(() => {
    if (!statusSeries.length) return null;
    const labels = statusSeries.map((item) => item.estado || 'Sin estado');
    const values = statusSeries.map((item) => Number(item.cantidad) || 0);
    const palette = ['#6ab2fa', '#f3ced6', '#a8e6cf', '#f9e79f', '#ff9f80', '#c3a6ff'];
    const colors = labels.map((_, index) => palette[index % palette.length]);
    return { labels, values, colors };
  }, [statusSeries]);

  const materiaSeries: MateriaVariacion[] = ventas?.materiasPrimaMasCaras ?? [];
  const materiasChartData = useMemo(() => {
    if (!materiaSeries.length) return null;
    const labels = materiaSeries.map((item) => item.nombre || `Materia ${item.id_materiaprima}`);
    const values = materiaSeries.map((item) => Number(item.variacionPorcentual) || 0);
    return { labels, values };
  }, [materiaSeries]);

  const topTortasSeries: ProductoTop[] = productos?.topTortas ?? [];
  const topTortasChartData = useMemo(() => {
    if (!topTortasSeries.length) return null;
    const labels = topTortasSeries.map((item) => item.nombre || `Torta ${item.id_torta}`);
    const values = topTortasSeries.map((item) => Number(item.ingresos) || 0);
    return { labels, values };
  }, [topTortasSeries]);

  const productosTabla: ProductoDetalle[] = productos?.tablaProductos ?? [];
  const clientesTop: ClienteResumen[] = clientes?.top ?? [];
  const clientesTablaData = useMemo<Array<{ rank: number } & ClienteResumen>>(() => {
    if (!clientesTop.length) return [];
    return clientesTop.map((cliente, index) => ({
      rank: index + 1,
      ...cliente,
    }));
  }, [clientesTop]);


  const isInitialLoading = loading && !data;
  const isRefreshing = refreshing && Boolean(data);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Dashboard de ventas</h1>
        <p className="text-sm text-neutral-600">Analiza el rendimiento de tus pedidos filtrando por rango de fechas.</p>
      </header>

      <div className="rounded-2xl border border-pastel-brown/20 bg-pastel-cream p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-4 sm:grid-cols-2 md:max-w-xl">
            <div className="flex flex-col gap-2">
              <label htmlFor="start-date" className="text-sm font-medium text-neutral-700">
                Desde
              </label>
              <Input
                id="start-date"
                type="date"
                max={endDate}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="bg-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="end-date" className="text-sm font-medium text-neutral-700">
                Hasta
              </label>
              <Input
                id="end-date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-pastel-blue/15 px-3 py-1 text-xs font-medium text-pastel-blue">
              <CalendarRange size={16} />
              {filtros ? `${formatDateLabel(filtros.fechaInicio)} - ${formatDateLabel(filtros.fechaFin)}` : 'Rango seleccionado'}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchDashboard({ start: startDate, end: endDate }, { silent: Boolean(data) })}
              disabled={loading || refreshing}
              className="bg-pastel-yellow/70 text-neutral-800 hover:bg-pastel-yellow"
            >
              <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
              Actualizar
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              disabled={loading || refreshing}
              className="bg-pastel-blue text-white hover:bg-pastel-blue/90"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {QUICK_RANGES.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="ghost"
              onClick={() => handlePresetClick(preset)}
              disabled={loading && !data}
              className={`border border-transparent bg-white/60 text-neutral-700 shadow-sm hover:border-pastel-blue hover:bg-white ${activePreset === preset.id ? 'border-pastel-blue bg-white' : ''}`}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <section aria-labelledby="section-resumen" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="section-resumen" className="text-xl font-semibold text-neutral-900">
              Seccion A - Resumen general
            </h2>
            <p className="text-sm text-neutral-600">Indicadores claves de ventas para el periodo seleccionado.</p>
          </div>
          {filtros && (
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              Granularidad sugerida: {filtros.granularidad === 'day' ? 'Diaria' : filtros.granularidad === 'week' ? 'Semanal' : 'Mensual'}
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            loading={isInitialLoading}
            icon={<TrendingUp className="text-pastel-blue" size={28} />}
            label="Ingresos totales"
            value={resumen ? currencyFormatter.format(resumen.ingresosTotales) : '--'}
            accent="bg-pastel-blue/10"
          />
          <KpiCard
            loading={isInitialLoading}
            icon={<ShoppingBag className="text-pastel-pink" size={28} />}
            label="Total de pedidos"
            value={resumen ? numberFormatter.format(resumen.totalPedidos) : '--'}
            accent="bg-pastel-pink/20"
          />
          <KpiCard
            loading={isInitialLoading}
            icon={<Wallet className="text-pastel-green" size={28} />}
            label="Ticket promedio"
            value={resumen ? currencyFormatter.format(resumen.ticketPromedio) : '--'}
            accent="bg-pastel-green/20"
          />
        </div>
      </section>

      <section aria-labelledby="section-ventas" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="section-ventas" className="text-xl font-semibold text-neutral-900">
              Seccion B - Ventas y tendencias
            </h2>
            <p className="text-sm text-neutral-600">Analiza como evolucionan las ventas y el estado operativo de los pedidos.</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartPanel
            title="Evolucion de ingresos"
            subtitle={ventas?.tendenciaIngresos?.granularity ? `Vista ${ventas.tendenciaIngresos.granularity}` : 'Sin granularidad sugerida'}
            icon={<TrendingUp className="text-pastel-blue" size={20} />}
            loading={isInitialLoading}
            refreshing={isRefreshing}
            empty={!isInitialLoading && (!revenueChartData || revenueChartData.labels.length === 0)}
            className="xl:col-span-2"
            emptyMessage="No hay datos de ingresos para el rango seleccionado."
          >
            <div className="h-72">
              <LineChart data={revenueChartData} />
            </div>
          </ChartPanel>

          <ChartPanel
            title="Pedidos por estado"
            subtitle="Distribucion actual"
            icon={<PieChart className="text-pastel-pink" size={20} />}
            loading={isInitialLoading}
            refreshing={isRefreshing}
            empty={!isInitialLoading && (!statusChartData || statusChartData.labels.length === 0)}
            emptyMessage="No hay pedidos en los estados consultados."
          >
            <div className="h-72">
              <DonutChart data={statusChartData} />
            </div>
          </ChartPanel>
        </div>

        <ChartPanel
          title="Materias primas con mayor aumento"
          subtitle="Variacion porcentual"
          icon={<BarChart3 className="text-pastel-yellow" size={20} />}
          loading={isInitialLoading}
          refreshing={isRefreshing}
          empty={!isInitialLoading && (!materiasChartData || materiasChartData.labels.length === 0)}
          emptyMessage="No se registraron aumentos en el periodo seleccionado."
        >
          <div className="h-72">
            <HorizontalBarChart data={materiasChartData} />
          </div>
        </ChartPanel>
      </section>
      <section aria-labelledby="section-productos" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="section-productos" className="text-xl font-semibold text-neutral-900">
              Seccion C - Rendimiento de productos
            </h2>
            <p className="text-sm text-neutral-600">Explora los productos que impulsan los ingresos y detecta oportunidades.</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-5">
          <ChartPanel
            title="Top 10 tortas por ingresos"
            subtitle="Ingresos acumulados"
            icon={<BarChart3 className="text-pastel-blue" size={20} />}
            loading={isInitialLoading}
            refreshing={isRefreshing}
            empty={!isInitialLoading && (!topTortasChartData || topTortasChartData.labels.length === 0)}
            emptyMessage="No se registran ventas de tortas en el periodo."
            className="xl:col-span-2"
          >
            <div className="h-72">
              <HorizontalBarChart data={topTortasChartData} />
            </div>
          </ChartPanel>

          <ChartPanel
            title="Detalle de productos"
            subtitle="Ingresos, cantidades y promedios"
            icon={<TableProperties className="text-pastel-brown" size={20} />}
            loading={isInitialLoading}
            refreshing={isRefreshing}
            empty={!isInitialLoading && productosTabla.length === 0}
            emptyMessage="No hay datos de productos para mostrar."
            className="xl:col-span-3"
          >
            <ProductsTable
              items={productosTabla}
              currencyFormatter={currencyFormatter}
              numberFormatter={numberFormatter}
            />
          </ChartPanel>
        </div>
      </section>

      <section aria-labelledby="section-clientes" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="section-clientes" className="text-xl font-semibold text-neutral-900">
              Seccion D - Analisis de clientes
            </h2>
            <p className="text-sm text-neutral-600">Detecta tus clientes VIP segun sus compras y frecuencia.</p>
          </div>
        </div>

        <ChartPanel
          title="Top 10 clientes por monto"
          subtitle="Importe acumulado y numero de pedidos"
          icon={<Users className="text-pastel-blue" size={20} />}
          loading={isInitialLoading}
          refreshing={isRefreshing}
          empty={!isInitialLoading && clientesTablaData.length === 0}
          emptyMessage="No se registran clientes destacados en este periodo."
        >
          <ClientsTable
            items={clientesTablaData}
            currencyFormatter={currencyFormatter}
            numberFormatter={numberFormatter}
          />
        </ChartPanel>
      </section>
    </section>
  );
};

type KpiCardProps = {
  loading: boolean;
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
};

const KpiCard = ({ loading, icon, label, value, accent }: KpiCardProps) => (
  <div className="rounded-2xl border border-pastel-brown/10 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <span className={`flex size-12 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </span>
      <span className="text-sm font-medium text-neutral-500">{label}</span>
    </div>
    {loading ? (
      <div className="h-8 w-24 animate-pulse rounded bg-pastel-blue/20" />
    ) : (
      <p className="text-3xl font-semibold text-neutral-900">{value}</p>
    )}
  </div>
);

type ChartPanelProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  loading: boolean;
  refreshing: boolean;
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
  className?: string;
};

const ChartPanel = ({ title, subtitle, icon, loading, refreshing, empty, emptyMessage, children, className }: ChartPanelProps) => (
  <div className={`rounded-2xl border border-pastel-brown/10 bg-white p-6 shadow-sm ${className ?? ''}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-neutral-900">
          {icon}
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {subtitle ? <p className="text-xs text-neutral-500">{subtitle}</p> : null}
      </div>
      {refreshing ? (
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
          <RefreshCw className="animate-spin" size={14} />
          Actualizando
        </span>
      ) : null}
    </div>

    {loading ? (
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-pastel-blue/10" />
    ) : empty ? (
      <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-dashed border-pastel-brown/20 bg-neutral-50 text-sm text-neutral-500">
        {emptyMessage}
      </div>
    ) : (
      <div className="mt-6">{children}</div>
    )}
  </div>
);

type ProductsTableProps = {
  items: ProductoDetalle[];
  currencyFormatter: Intl.NumberFormat;
  numberFormatter: Intl.NumberFormat;
};

const ProductsTable = ({ items, currencyFormatter, numberFormatter }: ProductsTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[28rem] divide-y divide-pastel-brown/20 text-sm">
      <thead className="bg-pastel-cream/70 text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-3 py-2 text-left font-semibold">Producto</th>
          <th className="px-3 py-2 text-left font-semibold">Tipo</th>
          <th className="px-3 py-2 text-right font-semibold">Cantidad</th>
          <th className="px-3 py-2 text-right font-semibold">Ingresos</th>
          <th className="px-3 py-2 text-right font-semibold">Precio promedio</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-pastel-brown/10">
        {items.map((item) => (
          <tr key={`${item.tipo}-${item.id}`} className="odd:bg-pastel-cream/30">
            <td className="px-3 py-2 font-medium text-neutral-800">{item.nombre}</td>
            <td className="px-3 py-2 text-neutral-600">{item.tipo === 'torta' ? 'Torta' : 'Bandeja'}</td>
            <td className="px-3 py-2 text-right text-neutral-700">{numberFormatter.format(item.cantidadVendida)}</td>
            <td className="px-3 py-2 text-right text-neutral-700">{currencyFormatter.format(item.ingresosTotales)}</td>
            <td className="px-3 py-2 text-right text-neutral-700">{currencyFormatter.format(item.precioPromedio)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

type LineChartProps = {
  data: { labels: string[]; values: number[] } | null;
};

const LineChart = ({ data }: LineChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!data || data.labels.length === 0) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    if (chartRef.current) {
      chartRef.current.data.labels = data.labels;
      chartRef.current.data.datasets[0].data = data.values;
      chartRef.current.update();
      return;
    }

    chartRef.current = new Chart(context, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            borderColor: '#6ab2fa',
            backgroundColor: 'rgba(106, 178, 250, 0.18)',
            pointBackgroundColor: '#6ab2fa',
            pointBorderColor: '#ffffff',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: '#6b7280' },
            grid: { display: false },
          },
          y: {
            ticks: { color: '#6b7280' },
            grid: { color: 'rgba(148, 163, 184, 0.25)' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f8f8f8',
            bodyColor: '#f8f8f8',
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
                return formatter.format(value);
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  useEffect(() => () => {
    chartRef.current?.destroy();
    chartRef.current = null;
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
};

type DonutChartData = {
  labels: string[];
  values: number[];
  colors: string[];
};

type DonutChartProps = {
  data: DonutChartData | null;
};

const DonutChart = ({ data }: DonutChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!data || data.labels.length === 0) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    if (chartRef.current) {
      chartRef.current.data.labels = data.labels;
      chartRef.current.data.datasets[0].data = data.values;
      chartRef.current.data.datasets[0].backgroundColor = data.colors;
      chartRef.current.update();
      return;
    }

    chartRef.current = new Chart(context, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: data.colors,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 14,
              color: '#4b5563',
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  useEffect(() => () => {
    chartRef.current?.destroy();
    chartRef.current = null;
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
};

type HorizontalBarChartData = {
  labels: string[];
  values: number[];
};

type HorizontalBarChartProps = {
  data: HorizontalBarChartData | null;
};

const HorizontalBarChart = ({ data }: HorizontalBarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!data || data.labels.length === 0) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    if (chartRef.current) {
      chartRef.current.data.labels = data.labels;
      chartRef.current.data.datasets[0].data = data.values;
      chartRef.current.update();
      return;
    }

    chartRef.current = new Chart(context, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: '#f9e79f',
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: '#6b7280', callback: (value) => `${value}%` },
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
          },
          y: {
            ticks: { color: '#6b7280' },
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.x ?? 0}%`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  useEffect(() => () => {
    chartRef.current?.destroy();
    chartRef.current = null;
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
};

export default CorePedidos;









type ClientsTableProps = {
  items: Array<{ rank: number } & ClienteResumen>;
  currencyFormatter: Intl.NumberFormat;
  numberFormatter: Intl.NumberFormat;
};

const ClientsTable = ({ items, currencyFormatter, numberFormatter }: ClientsTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[28rem] divide-y divide-pastel-brown/20 text-sm">
      <thead className="bg-pastel-cream/70 text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-3 py-2 text-left font-semibold">#</th>
          <th className="px-3 py-2 text-left font-semibold">Cliente</th>
          <th className="px-3 py-2 text-left font-semibold">Email</th>
          <th className="px-3 py-2 text-right font-semibold">Total gastado</th>
          <th className="px-3 py-2 text-right font-semibold">Pedidos</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-pastel-brown/10">
        {items.map((cliente) => (
          <tr key={cliente.id_cliente} className="odd:bg-pastel-cream/30">
            <td className="px-3 py-2 text-neutral-600">{cliente.rank}</td>
            <td className="px-3 py-2 font-medium text-neutral-800">{cliente.nombre}</td>
            <td className="px-3 py-2 text-neutral-600">{cliente.email || "Sin email"}</td>
            <td className="px-3 py-2 text-right text-neutral-700">{currencyFormatter.format(cliente.totalGastado)}</td>
            <td className="px-3 py-2 text-right text-neutral-700">{numberFormatter.format(cliente.cantidadPedidos)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

