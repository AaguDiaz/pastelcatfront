export type DashboardGranularity = 'day' | 'week' | 'month';

export type DashboardFilters = {
  fechaInicio: string;
  fechaFin: string;
  granularidad: DashboardGranularity;
};

export type DashboardKPIGlobal = {
  ingresosTotales: number;
  totalOperaciones: number;
  totalPedidos: number;
  totalEventos: number;
  ticketPromedio: number;
  ticketPromedioPedidos: number;
  ticketPromedioEventos: number;
};

export type DashboardResumenes = {
  global: DashboardKPIGlobal;
  pedidos: {
    ingresosTotales: number;
    totalPedidos: number;
    ticketPromedio: number;
  };
  eventos: {
    ingresosTotales: number;
    totalEventos: number;
    ticketPromedio: number;
  };
};

export type RevenuePoint = {
  key: string;
  label: string;
  periodStart: string;
  ingresos: number;
  pedidos: number;
};

export type PedidoEstado = {
  estado: string;
  cantidad: number;
};

export type MateriaVariacion = {
  id_materiaprima: number;
  nombre: string;
  variacionPorcentual: number;
  precioInicial: number;
  precioFinal: number;
  fechaInicial: string;
  fechaFinal: string;
};

export type ProductoTop = {
  id_torta: number;
  id_bandeja?: number;
  nombre: string;
  ingresos: number;
  cantidad: number;
};

export type ProductoDetalle = {
  id: number;
  tipo: 'torta' | 'bandeja';
  nombre: string;
  cantidadVendida: number;
  ingresosTotales: number;
  precioPromedio: number;
};

export type ClienteResumen = {
  id_cliente?: number;
  id_perfil?: number;
  nombre: string;
  email: string | null;
  totalGastado: number;
  cantidadPedidos: number;
  cantidadEventos?: number;
  ingresosPedidos?: number;
  ingresosEventos?: number;
};

export type DashboardClientes = {
  top?: ClienteResumen[] | null;
  topPedidos?: ClienteResumen[] | null;
  topEventos?: ClienteResumen[] | null;
};

export type DashboardProductos = {
  topTortas?: ProductoTop[] | null;
  topBandejas?: ProductoTop[] | null;
  tablaProductos?: ProductoDetalle[] | null;
};

export type DashboardVentas = {
  tendenciaIngresos?: {
    granularity: DashboardGranularity;
    series: RevenuePoint[];
  } | null;
  tendenciaIngresosEventos?: {
    granularity: DashboardGranularity;
    series: RevenuePoint[];
  } | null;
  tendenciaIngresosTotal?: {
    granularity: DashboardGranularity;
    series: RevenuePoint[];
  } | null;
  pedidosPorEstado?: PedidoEstado[] | null;
  eventosPorEstado?: PedidoEstado[] | null;
  materiasPrimaMasCaras?: MateriaVariacion[] | null;
};

export type DashboardAgendaItem = {
  id?: number | null;
  fecha_entrega?: string | null;
  total_final?: number | null;
  cliente?: string | null;
  tipo?: string | null;
};

export type DashboardResponse = {
  filtros: DashboardFilters;
  resumen: DashboardKPIGlobal;
  resumenes?: DashboardResumenes | null;
  comparativo?: {
    actual: DashboardKPIGlobal;
    previo: DashboardKPIGlobal;
    variaciones: { ingresos: number | null; operaciones: number | null } | null;
    rangoPrevio: { fechaInicio: string; fechaFin: string };
  } | null;
  ventas?: DashboardVentas | null;
  productos?: DashboardProductos | null;
  clientes?: DashboardClientes | null;
  agenda?: {
    pedidos?: DashboardAgendaItem[];
    eventos?: DashboardAgendaItem[];
  } | null;
};
