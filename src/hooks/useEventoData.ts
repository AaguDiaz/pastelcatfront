import { useState, useEffect, useCallback } from 'react';
import { Cliente, Producto, ProductoTipo } from '@/interfaces/pedidos';
import {
  Evento,
  EventoPayload,
  EventoItem,
  ApiEvento,
  ApiEventoCompleto,
  ApiEventoDetalle,
} from '@/interfaces/eventos';
import { ApiPerfil } from '@/interfaces/api';
import { debugFetch } from '@/lib/debugFetch';
import {api} from '@/lib/api';

const API_BASE_URL = api;

const useEventoData = () => {
  // Pedidos list (tabla pedidos)
  const [pedidos, setPedidos] = useState<Evento[]>([]);
  const [pedidosTotalPages, setPedidosTotalPages] = useState(1);
  const [pedidosCurrentPage, setPedidosCurrentPage] = useState(1);
  // Modo edición de un pedido
  type TipoEntrega = '' | 'retiro' | 'envio_casa_cliente' | 'envio_otra_direccion';
  interface EventoEditDraft {
    id: number;
    cliente: Cliente;
    fecha_entrega: string;
    tipo_entrega: TipoEntrega;
    direccion_entrega: string | null;
    observaciones: string | null;
    items: EventoItem[];
    total_descuento?: number;
  }
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<EventoEditDraft | null>(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientePage, setClientePage] = useState(1);
  const [productoPage, setProductoPage] = useState(1);
  const [hasMoreClientes, setHasMoreClientes] = useState(false);
  const [hasMoreProductos, setHasMoreProductos] = useState(false);

  const [tipoProductoState, setTipoProductoState] = useState<ProductoTipo>('torta');
    const setTipoProducto = useCallback((tipo: ProductoTipo) => {
      setProductoPage(1);
      setTipoProductoState(tipo);
    }, []);
    
  const tipoProducto = tipoProductoState;
  const fetchWithAuth = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await debugFetch(url, { ...options, headers });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('No autorizado');
      }

      if (!res.ok) {
        throw new Error(await res.text() || 'Error al cargar datos');
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return res.json() as Promise<T>;
      }
      return {} as T;
    },
    []
  );

  // --- Helpers para normalizar Pedidos recibidos del backend ---
  const normalizeEstado = useCallback((rawEstado: ApiEvento['estado']): string => {
    if (typeof rawEstado === 'string') return rawEstado;
    if (rawEstado && typeof rawEstado === 'object') {
      const anyEstado = (rawEstado as Record<string, unknown>)['estado'];
      if (typeof anyEstado === 'string') return anyEstado;
    }
    return 'pendiente';
  }, []);

  const buildClienteFromEvento = useCallback((p: ApiEvento | ApiEventoCompleto): Cliente => {
    const perfil = (p as ApiEventoCompleto)?.perfil as ApiPerfil | null | undefined;
    const nestedCliente = typeof p.cliente === 'object' && p.cliente !== null ? p.cliente : undefined;
    const legacyId = (p as { id_cliente?: number }).id_cliente;
    const rawId = p.id_perfil ?? perfil?.id_perfil ?? legacyId ?? nestedCliente?.id ?? 0;
    const idPerfil = Number(rawId) || 0;
    const nombreCliente =
      p.nombre ??
      p.cliente_nombre ??
      nestedCliente?.nombre ??
      perfil?.nombre ??
      '';

    return {
      id: idPerfil,
      id_perfil: idPerfil,
      nombre: nombreCliente,
      telefono: perfil?.telefono ?? null,
      direccion: perfil?.direccion ?? null,
      dni: perfil?.dni ?? null,
      is_active: typeof perfil?.is_active === 'boolean' ? perfil.is_active : undefined,
      user_id: perfil?.id ?? null,
    };
  }, []);

  const normalizeEvento = useCallback((p: ApiEvento): Evento => {
    const cliente = buildClienteFromEvento(p);
    const total = p.total_final ?? p.total;
    return {
      id: Number(p.id_evento ?? p.id ?? 0),
      cliente,
      fecha_entrega: p.fecha_entrega || '',
      total: Number(total ?? 0),
      observaciones: (p.observaciones ?? null) as string | null,
      estado: normalizeEstado(p.estado),
    };
  }, [normalizeEstado, buildClienteFromEvento]);

  const loadPedidos = useCallback(
    async (opts?: { page?: number; estado?: string | null }) => {
      try {
        const page = opts?.page ?? 1;
        const estado = opts?.estado ?? null;
        const url = `${API_BASE_URL}/eventos?page=${encodeURIComponent(page)}${estado ? `&estado=${encodeURIComponent(estado)}` : ''}`;
        const root = await fetchWithAuth<{ data?: ApiEvento[]; totalPages?: number; currentPage?: number }>(url);
        // Backend esperado: { data: [...], totalPages, currentPage }
        const arr: ApiEvento[] = Array.isArray(root?.data) ? (root.data as ApiEvento[]) : [];
        const normalized = arr.map(normalizeEvento);
        setPedidos(normalized);
        setPedidosTotalPages(Number(root?.totalPages ?? 1));
        setPedidosCurrentPage(Number(root?.currentPage ?? page));
      } catch (e) {
        console.error('Error al cargar eventos', e);
        setPedidos([]);
        setPedidosTotalPages(1);
        setPedidosCurrentPage(1);
      }
    },
    [fetchWithAuth, normalizeEvento]
  );

  // Cargar detalle de un pedido y preparar el borrador de edición
  const startEditPedido = useCallback(async (id: number) => {
    try {
      // Usamos el endpoint completo para obtener la lista de productos del evento
      const p = await fetchWithAuth<ApiEventoCompleto>(`${API_BASE_URL}/eventos/${id}/completo`);

      const cliente = buildClienteFromEvento(p);

      const tipoEntregaRaw = String(p.tipo_entrega ?? '').toLowerCase().trim();
      const mapEntrega = (raw: string): TipoEntrega => {
        if (!raw) return '';
        if (['retiro','pickup','retirar'].includes(raw)) return 'retiro';
        if (['envio_casa_cliente','envío_casa_cliente','envio domicilio','envio_domicilio','domicilio','casa_cliente','envio','envío'].includes(raw)) return 'envio_casa_cliente';
        if (['envio_otra_direccion','envío_otra_dirección','otra_direccion','otra direccion'].includes(raw)) return 'envio_otra_direccion';
        return '';
      };
      const tipo_entrega: TipoEntrega = mapEntrega(tipoEntregaRaw);

      // Normalizar detalles (incluyendo datos anidados de torta/bandeja)
      const detalles: ApiEventoDetalle[] = Array.isArray(p.lista_evento) ? p.lista_evento : [];
      const items: EventoItem[] = detalles.map((d) => {
        const idT = Number(d.id_torta ?? d.torta?.id ?? 0);
        const idB = Number(d.id_bandeja ?? d.bandeja?.id ?? 0);
        const idA = Number(d.id_articulo ?? d.articulo?.id ?? d.articulo?.id_articulo ?? 0);
        const isTorta = !!idT && !idB && !idA;
        const isBandeja = !isTorta && !!idB;
        const tipo: ProductoTipo = isTorta ? 'torta' : isBandeja ? 'bandeja' : 'articulo';
        const productoId = isTorta ? idT : isBandeja ? idB : idA;
        const nombre =
          d.nombre ??
          (tipo === 'torta'
            ? d.torta?.nombre
            : tipo === 'bandeja'
              ? d.bandeja?.nombre
              : d.articulo?.nombre) ??
          (tipo === 'torta'
            ? `Torta ${productoId}`
            : tipo === 'bandeja'
              ? `Bandeja ${productoId}`
              : `Artículo ${productoId}`);
        const precio = Number(
          d.precio_unitario ??
            (tipo === 'torta'
              ? d.torta?.precio
              : tipo === 'bandeja'
                ? d.bandeja?.precio
                : d.articulo?.precio_alquiler ?? d.articulo?.costo_unitario) ??
            d.precio ??
            0,
        );
        const cantidad = Number(d.cantidad ?? 1);
        const rawStockDisponible = tipo === 'articulo'
          ? Number(d.articulo?.stock_disponible ?? d.articulo?.stock_disponible ?? NaN)
          : NaN;
        const rawStockTotal = tipo === 'articulo'
          ? Number(d.articulo?.stock_total ?? NaN)
          : NaN;
        const categoriaNombre =
          tipo === 'articulo'
            ? d.articulo?.categoria_nombre ??
              (typeof d.articulo?.id_categoria === 'number' ? `#${d.articulo?.id_categoria}` : undefined)
            : undefined;
        return {
          key: `${tipo}-${productoId}`,
          productoId,
          id: productoId,
          tipo,
          nombre,
          precio,
          cantidad,
          stockDisponible: Number.isFinite(rawStockDisponible) ? rawStockDisponible : undefined,
          stockTotal: Number.isFinite(rawStockTotal) ? rawStockTotal : undefined,
          categoriaNombre,
        };
      });

      const draft: EventoEditDraft = {
        id: Number(p.id_evento ?? p.id ?? id),
        cliente,
        fecha_entrega: p.fecha_entrega ?? '',
        tipo_entrega,
        direccion_entrega: (p.direccion_entrega ?? null) as string | null,
        observaciones: (p.observaciones ?? null) as string | null,
        items,
        total_descuento: Number(p.total_descuento ?? 0),
      };

      setEditDraft(draft);
      setIsEditing(true);
    } catch (e) {
      console.error('Error al cargar detalle de evento', e);
      setEditDraft(null);
      setIsEditing(false);
    }
  }, [fetchWithAuth, buildClienteFromEvento]);

  // Obtener evento completo (para ver detalles) sin activar modo edición
  const getPedidoCompleto = useCallback(async (id: number) => {
    try {
      const p = await fetchWithAuth<ApiEventoCompleto>(`${API_BASE_URL}/eventos/${id}/completo`);

      const cliente = buildClienteFromEvento(p);
      // Normalizar items igual que en startEditPedido
      const detalles: ApiEventoDetalle[] = Array.isArray(p.lista_evento) ? p.lista_evento : [];
      const items = detalles.map((d) => {
        const idT = Number(d.id_torta ?? d.torta?.id ?? 0);
        const idB = Number(d.id_bandeja ?? d.bandeja?.id ?? 0);
        const idA = Number(d.id_articulo ?? d.articulo?.id ?? d.articulo?.id_articulo ?? 0);
        const isTorta = !!idT && !idB && !idA;
        const isBandeja = !isTorta && !!idB;
        const tipo: ProductoTipo = isTorta ? 'torta' : isBandeja ? 'bandeja' : 'articulo';
        const productoId = isTorta ? idT : isBandeja ? idB : idA;
        const nombre =
          d.nombre ??
          (tipo === 'torta'
            ? d.torta?.nombre
            : tipo === 'bandeja'
              ? d.bandeja?.nombre
              : d.articulo?.nombre) ??
          (tipo === 'torta'
            ? `Torta ${productoId}`
            : tipo === 'bandeja'
              ? `Bandeja ${productoId}`
              : `Artículo ${productoId}`);
        const precio = Number(
          d.precio_unitario ??
            (tipo === 'torta'
              ? d.torta?.precio
              : tipo === 'bandeja'
                ? d.bandeja?.precio
                : d.articulo?.precio_alquiler ?? d.articulo?.costo_unitario) ??
            d.precio ??
            0,
        );
        const cantidad = Number(d.cantidad ?? 1);
        const rawStockDisponible = tipo === 'articulo'
          ? Number(d.articulo?.stock_disponible ?? d.articulo?.stock_disponible ?? NaN)
          : NaN;
        const rawStockTotal = tipo === 'articulo'
          ? Number(d.articulo?.stock_total ?? NaN)
          : NaN;
        const categoriaNombre =
          tipo === 'articulo'
            ? d.articulo?.categoria_nombre ??
              (typeof d.articulo?.id_categoria === 'number' ? `#${d.articulo?.id_categoria}` : undefined)
            : undefined;
        return {
          key: `${tipo}-${productoId}`,
          productoId,
          id: productoId,
          tipo,
          nombre,
          precio,
          cantidad,
          imagen:
            (tipo === 'torta'
              ? d.torta?.imagen
              : tipo === 'bandeja'
                ? d.bandeja?.imagen
                : undefined) ?? undefined,
          tamanio:
            (tipo === 'torta'
              ? d.torta?.tamanio
              : tipo === 'bandeja'
                ? d.bandeja?.tamanio
                : undefined) ?? undefined,
          stockDisponible: Number.isFinite(rawStockDisponible) ? rawStockDisponible : undefined,
          stockTotal: Number.isFinite(rawStockTotal) ? rawStockTotal : undefined,
          categoriaNombre,
        };
      });

      return {
        id: Number(p.id_evento ?? p.id ?? id),
        cliente,
        fecha_entrega: p.fecha_entrega ?? '',
        tipo_entrega: String(p.tipo_entrega ?? ''),
        fecha_creacion: p.fecha_creacion ?? p.created_at ?? null,
        direccion_entrega: (p.direccion_entrega ?? null) as string | null,
        observaciones: (p.observaciones ?? null) as string | null,
        estado: normalizeEstado(p.estado),
        total_items: Number(p.total_items ?? items.reduce((s: number, it) => s + it.cantidad, 0)),
        total_final: Number(p.total_final ?? items.reduce((s: number, it) => s + it.cantidad * it.precio, 0)),
        total_descuento: Number(p.total_descuento ?? 0),
        items,
      };
    } catch (e) {
      console.error('Error al obtener evento completo', e);
      throw e;
    }
  }, [fetchWithAuth, normalizeEstado, buildClienteFromEvento]);

  const clearEdit = useCallback(() => {
    setEditDraft(null);
    setIsEditing(false);
  }, []);

  type EventoUpdateBody = Omit<EventoPayload, 'id_perfil'> & { id_perfil?: number };
  const updatePedido = useCallback(async (id: number, body: EventoUpdateBody) => {
    await fetchWithAuth(`${API_BASE_URL}/eventos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    await loadPedidos();
  }, [fetchWithAuth, loadPedidos]);
  // Cambiar estado y eliminar (genérico; ajustar si el backend usa rutas específicas)
  const updatePedidoEstado = useCallback(async (id: number, idEstado: number) => {
    await fetchWithAuth(`${API_BASE_URL}/eventos/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ id_estado: idEstado }),
    });
    await loadPedidos();
  }, [fetchWithAuth, loadPedidos]);

  const deletePedido = useCallback(async (id: number) => {
    await fetchWithAuth(`${API_BASE_URL}/eventos/${id}`, {
      method: 'DELETE',
    });
    await loadPedidos();
  }, [fetchWithAuth, loadPedidos]);

  interface RawProducto {
    id?: number;
    id_torta?: number;
    id_bandeja?: number;
    id_producto?: number;
    id_articulo?: number;
    id_categoria?: number;
    nombre: string;
    precio: number;
    imagen?: string;
    tamanio?: string;
    precio_alquiler?: number;
    costo_unitario?: number | string;
    color?: string | null;
    stock_total?: number;
    stock_disponible?: number;
    reutilizable?: boolean;
    categoria_nombre?: string;
  }

  const normalizeProducto = useCallback((x: RawProducto, tipo: ProductoTipo): Producto => {
    const rawId = x.id ?? x.id_torta ?? x.id_bandeja ?? x.id_producto ?? x.id_articulo;
    const isArticulo = tipo === 'articulo';
    const costoUnitarioValue =
      typeof x.costo_unitario === 'string'
        ? Number.parseFloat(x.costo_unitario)
        : typeof x.costo_unitario === 'number'
          ? x.costo_unitario
          : undefined;
    const basePrecio = isArticulo
      ? Number(
          x.precio_alquiler ??
            (Number.isFinite(costoUnitarioValue ?? NaN) ? costoUnitarioValue : x.precio ?? 0),
        )
      : Number(x.precio);
    return {
      id: Number(rawId),
      nombre: x.nombre,
      precio: basePrecio,
      imagen: isArticulo ? undefined : x.imagen,
      tamanio: x.tamanio,
      tipo,
      categoriaId: x.id_categoria,
      color: isArticulo ? (x.color ?? null) : undefined,
      stockTotal: isArticulo
        ? typeof x.stock_total === 'number'
          ? x.stock_total
          : undefined
        : undefined,
      stockDisponible: isArticulo
        ? typeof x.stock_disponible === 'number'
          ? x.stock_disponible
          : undefined
        : undefined,
      reutilizable: isArticulo ? Boolean(x.reutilizable) : undefined,
      costoUnitario: isArticulo
        ? Number.isFinite(costoUnitarioValue ?? NaN)
          ? (costoUnitarioValue as number)
          : undefined
        : undefined,
      precioAlquiler: isArticulo ? Number(x.precio_alquiler ?? basePrecio) : undefined,
      categoriaNombre: isArticulo ? x.categoria_nombre : undefined,
    };
  }, []);

  interface RawCliente {
    id?: number | string | null;
    id_cliente?: number;
    id_perfil?: number;
    nombre?: string;
    telefono?: string | null;
    direccion?: string | null;
    dni?: string | null;
    is_active?: boolean;
  }

  const normalizeCliente = useCallback((c: RawCliente): Cliente => {
    const numericIdSource =
      c.id_perfil ??
      c.id_cliente ??
      (typeof c.id === 'number' ? c.id : 0) ??
      0;
    const idPerfil = Number(numericIdSource) || 0;
    return {
      id: idPerfil,
      id_perfil: idPerfil,
      nombre: c.nombre ?? '',
      telefono: c.telefono ?? null,
      direccion: c.direccion ?? null,
      dni: c.dni ?? null,
      is_active: typeof c.is_active === 'boolean' ? c.is_active : undefined,
      user_id: typeof c.id === 'string' ? c.id : undefined,
    };
  }, []);

  const loadClientes = useCallback(async () => {
    try {
      const result = await fetchWithAuth<{ data?: RawCliente[] }>(
        `${API_BASE_URL}/clientes?is_active=true&page=${clientePage}&pageSize=10&search=${encodeURIComponent(clienteSearch)}`
      );
      const raw = (result.data ?? []) as RawCliente[];
      const normalized = raw.map(normalizeCliente);
      setClientes(normalized);
      setHasMoreClientes(raw.length === 10);
    } catch (e) {
      console.error('Error al cargar clientes', e);
      setClientes([]);
        setHasMoreClientes(false);
    }
  }, [fetchWithAuth, clientePage, clienteSearch, normalizeCliente]);

  const loadProductos = useCallback(async () => {
    try {
      if (tipoProducto === 'articulo') {
        const result = await fetchWithAuth<{ data?: RawProducto[] }>(
          `${API_BASE_URL}/articulos?page=${productoPage}&pageSize=6&search=${encodeURIComponent(productoSearch)}`,
        );
        const raw = (result?.data ?? []) as RawProducto[];
        const normalized = raw
          .map((x) => normalizeProducto(x, 'articulo'))
          .filter((p) => p.categoriaId !== 1);
        setProductos(normalized);
        setHasMoreProductos(raw.length === 6);
        return;
      }

      const result = await fetchWithAuth<{ data?: RawProducto[] }>(
        `${API_BASE_URL}/productos?tipo=${tipoProducto}&page=${productoPage}&pageSize=6&search=${encodeURIComponent(productoSearch)}`,
      );
      const raw = (result?.data ?? []) as RawProducto[];
      const normalized: Producto[] = raw.map((x) => normalizeProducto(x, tipoProducto));
      setProductos(normalized);
      setHasMoreProductos(raw.length === 6);
    } catch (e) {
      console.error('Error al cargar productos', e);
      setProductos([]);
      setHasMoreProductos(false);
    }
  }, [fetchWithAuth, tipoProducto, productoPage, productoSearch, normalizeProducto]);

  useEffect(() => {
    setClientePage(1);
  }, [clienteSearch]);

  useEffect(() => {
    setProductoPage(1);
  }, [productoSearch]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  // Cargar pedidos para la tabla al montar
  useEffect(() => {
    loadPedidos({ page: 1, estado: null });
  }, [loadPedidos]);

  const nextClientes = () => setClientePage((p) => p + 1);
  const prevClientes = () => setClientePage((p) => Math.max(1, p - 1));
  const nextProductos = () => setProductoPage((p) => p + 1);
  const prevProductos = () => setProductoPage((p) => Math.max(1, p - 1));

  const confirmarPedido = useCallback(
    async (pedido: EventoPayload) => {
      try {
         
        return await fetchWithAuth(`${API_BASE_URL}/eventos`, {
          method: 'POST',
          body: JSON.stringify(pedido),
        });
      } catch (e) {
        console.error('Error al confirmar evento', e);
        throw e;
      }
    },
    [fetchWithAuth]
  );

  return {
    pedidos,
    loadPedidos,
    pedidosTotalPages,
    pedidosCurrentPage,
    isEditing,
    editDraft,
    startEditPedido,
    clearEdit,
    getPedidoCompleto,
    updatePedido,
    updatePedidoEstado,
    deletePedido,
    clienteSearch,
    setClienteSearch,
    clientes,
    nextClientes,
    prevClientes,
    clientePage,
    productoSearch,
    setProductoSearch,
    tipoProducto,
    setTipoProducto,
    productos,
    nextProductos,
    prevProductos,
    productoPage,
    confirmarPedido,
    hasMoreClientes,
    hasMoreProductos,
  };
};

export default useEventoData;
