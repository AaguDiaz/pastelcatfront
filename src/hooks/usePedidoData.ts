import { useState, useEffect, useCallback } from 'react';
import { Cliente, Producto, Pedido, PedidoPayload, ItemPedido, ProductoTipo } from '@/interfaces/pedidos';
import { ApiPedido as ApiPedidoFromBackend, ApiPedidoCompleto, ApiPedidoDetalle, ApiPerfil } from '@/interfaces/api';
import { debugFetch } from '@/lib/debugFetch';
import {api} from '@/lib/api';

const API_BASE_URL = api;

const usePedidoData = () => {
  // Pedidos list (tabla pedidos)
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosTotalPages, setPedidosTotalPages] = useState(1);
  const [pedidosCurrentPage, setPedidosCurrentPage] = useState(1);
  // Modo edición de un pedido
  type TipoEntrega = '' | 'retiro' | 'envio_casa_cliente' | 'envio_otra_direccion';
  interface PedidoEditDraft {
    id: number;
    cliente: Cliente;
    fecha_entrega: string;
    tipo_entrega: TipoEntrega;
    direccion_entrega: string | null;
    observaciones: string | null;
    items: ItemPedido[];
    total_descuento?: number;
  }
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<PedidoEditDraft | null>(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientePage, setClientePage] = useState(1);
  const [productoPage, setProductoPage] = useState(1);
  const [hasMoreClientes, setHasMoreClientes] = useState(false);
  const [hasMoreProductos, setHasMoreProductos] = useState(false);

  const [tipoProductoState, setTipoProductoState] = useState<'torta' | 'bandeja'>('torta');
  const setTipoProducto = useCallback((tipo: ProductoTipo) => {
    if (tipo === 'articulo') return;
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
  const normalizeEstado = useCallback((rawEstado: ApiPedidoFromBackend['estado']): string => {
    if (typeof rawEstado === 'string') return rawEstado;
    if (rawEstado && typeof rawEstado === 'object') {
      const anyEstado = (rawEstado as Record<string, unknown>)['estado'];
      if (typeof anyEstado === 'string') return anyEstado;
    }
    return 'pendiente';
  }, []);

  const buildClienteFromPedido = useCallback((p: ApiPedidoFromBackend | ApiPedidoCompleto): Cliente => {
    const perfil = (p as ApiPedidoCompleto)?.perfil as ApiPerfil | null | undefined;
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

  const normalizePedido = useCallback((p: ApiPedidoFromBackend): Pedido => {
    const cliente = buildClienteFromPedido(p);
    const total = p.total_final ?? p.total;
    return {
      id: Number(p.id_pedido ?? p.id ?? 0),
      cliente,
      fecha_entrega: p.fecha_entrega || '',
      total: Number(total ?? 0),
      observaciones: (p.observaciones ?? null) as string | null,
      estado: normalizeEstado(p.estado),
    };
  }, [normalizeEstado, buildClienteFromPedido]);

  const loadPedidos = useCallback(
    async (opts?: { page?: number; estado?: string | null }) => {
      try {
        const page = opts?.page ?? 1;
        const estado = opts?.estado ?? null;
        const url = `${API_BASE_URL}/pedidos?page=${encodeURIComponent(page)}${estado ? `&estado=${encodeURIComponent(estado)}` : ''}`;
        const root = await fetchWithAuth<{ data?: ApiPedidoFromBackend[]; totalPages?: number; currentPage?: number }>(url);
        // Backend esperado: { data: [...], totalPages, currentPage }
        const arr: ApiPedidoFromBackend[] = Array.isArray(root?.data) ? root.data as ApiPedidoFromBackend[] : [];
        const normalized = arr.map(normalizePedido);
        setPedidos(normalized);
        setPedidosTotalPages(Number(root?.totalPages ?? 1));
        setPedidosCurrentPage(Number(root?.currentPage ?? page));
      } catch (e) {
        console.error('Error al cargar pedidos', e);
        setPedidos([]);
        setPedidosTotalPages(1);
        setPedidosCurrentPage(1);
      }
    },
    [fetchWithAuth, normalizePedido]
  );

  // Cargar detalle de un pedido y preparar el borrador de edición
  const startEditPedido = useCallback(async (id: number) => {
    try {
      // Usamos el endpoint completo para obtener pedido_detalles
      const p = await fetchWithAuth<ApiPedidoCompleto>(`${API_BASE_URL}/pedidos/${id}/completo`);

      const cliente = buildClienteFromPedido(p);

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
      const detalles: ApiPedidoDetalle[] = Array.isArray(p.pedido_detalles) ? p.pedido_detalles : [];
      const items: ItemPedido[] = detalles.map((d) => {
        const idT = Number(d.id_torta ?? d.torta?.id ?? 0);
        const idB = Number(d.id_bandeja ?? d.bandeja?.id ?? 0);
        const isTorta = !!idT && !idB;
        const tipo: 'torta' | 'bandeja' = isTorta ? 'torta' : 'bandeja';
        const productoId = isTorta ? idT : idB;
        const nombre = d.nombre ?? (isTorta ? d.torta?.nombre : d.bandeja?.nombre) ?? (isTorta ? `Torta ${productoId}` : `Bandeja ${productoId}`);
        const precio = Number(d.precio_unitario ?? (isTorta ? d.torta?.precio : d.bandeja?.precio) ?? d.precio ?? 0);
        const cantidad = Number(d.cantidad ?? 1);
        return {
          key: `${tipo}-${productoId}`,
          productoId,
          id: productoId,
          tipo,
          nombre,
          precio,
          cantidad,
        };
      });

      const draft: PedidoEditDraft = {
        id: Number(p.id ?? id),
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
      console.error('Error al cargar detalle de pedido', e);
      setEditDraft(null);
      setIsEditing(false);
    }
  }, [fetchWithAuth, buildClienteFromPedido]);

  // Obtener pedido completo (para ver detalles) sin activar modo edición
  const getPedidoCompleto = useCallback(async (id: number) => {
    try {
      const p = await fetchWithAuth<ApiPedidoCompleto>(`${API_BASE_URL}/pedidos/${id}/completo`);

      const cliente = buildClienteFromPedido(p);
      // Normalizar items igual que en startEditPedido
      const detalles: ApiPedidoDetalle[] = Array.isArray(p.pedido_detalles) ? p.pedido_detalles : [];
      const items = detalles.map((d) => {
        const idT = Number(d.id_torta ?? d.torta?.id ?? 0);
        const idB = Number(d.id_bandeja ?? d.bandeja?.id ?? 0);
        const isTorta = !!idT && !idB;
        const tipo: 'torta' | 'bandeja' = isTorta ? 'torta' : 'bandeja';
        const productoId = isTorta ? idT : idB;
        const nombre = d.nombre ?? (isTorta ? d.torta?.nombre : d.bandeja?.nombre) ?? (isTorta ? `Torta ${productoId}` : `Bandeja ${productoId}`);
        const precio = Number(d.precio_unitario ?? (isTorta ? d.torta?.precio : d.bandeja?.precio) ?? d.precio ?? 0);
        const cantidad = Number(d.cantidad ?? 1);
        return {
          key: `${tipo}-${productoId}`,
          productoId,
          id: productoId,
          tipo,
          nombre,
          precio,
          cantidad,
          imagen: (isTorta ? d.torta?.imagen : d.bandeja?.imagen) ?? undefined,
          tamanio: (isTorta ? d.torta?.tamanio : d.bandeja?.tamanio) ?? undefined,
        };
      });

      return {
        id: Number(p.id ?? id),
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
      console.error('Error al obtener pedido completo', e);
      throw e;
    }
  }, [fetchWithAuth, normalizeEstado, buildClienteFromPedido]);

  const clearEdit = useCallback(() => {
    setEditDraft(null);
    setIsEditing(false);
  }, []);

  interface PedidoUpdateBody {
    id_perfil?: number;
    fecha_entrega: string;
    tipo_entrega: string;
    direccion_entrega: string | null;
    observaciones: string | null;
    tortas: { id_torta: number; cantidad: number; precio_unitario?: number }[];
    bandejas: { id_bandeja: number; cantidad: number; precio_unitario?: number }[];
    articulos?: { id_articulo: number; cantidad: number; precio_unitario?: number }[];
    descuento?: number;
  }
  const updatePedido = useCallback(async (id: number, body: PedidoUpdateBody) => {
    await fetchWithAuth(`${API_BASE_URL}/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    await loadPedidos();
  }, [fetchWithAuth, loadPedidos]);
  // Cambiar estado y eliminar (genérico; ajustar si el backend usa rutas específicas)
  const updatePedidoEstado = useCallback(async (id: number, idEstado: number) => {
    await fetchWithAuth(`${API_BASE_URL}/pedidos/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ id_estado: idEstado }),
    });
    await loadPedidos();
  }, [fetchWithAuth, loadPedidos]);

  const deletePedido = useCallback(async (id: number) => {
    await fetchWithAuth(`${API_BASE_URL}/pedidos/${id}`, {
      method: 'DELETE',
    });
    await loadPedidos();
  }, [fetchWithAuth, loadPedidos]);

  type Tipo = 'torta' | 'bandeja';

 interface RawProducto {
    id?: number;
    id_torta?: number;
    id_bandeja?: number;
    id_producto?: number;
    nombre: string;
    precio: number;
    imagen?: string;
    tamanio?: string;
  }

  const normalizeProducto = useCallback((x: RawProducto, tipo: Tipo): Producto => {
    const rawId = x.id ?? x.id_torta ?? x.id_bandeja ?? x.id_producto;
    return {
      id: Number(rawId),
      nombre: x.nombre,
      precio: Number(x.precio),
      imagen: x.imagen,
      tamanio: x.tamanio,
      tipo,
      categoriaId: undefined,
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
        const result = await fetchWithAuth<{ data?: RawProducto[] }>(
        `${API_BASE_URL}/productos?tipo=${tipoProducto}&page=${productoPage}&pageSize=6&search=${encodeURIComponent(productoSearch)}`
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
    async (pedido: PedidoPayload) => {
      try {
         
        return await fetchWithAuth(`${API_BASE_URL}/pedidos`, {
          method: 'POST',
          body: JSON.stringify(pedido),
        });
      } catch (e) {
        console.error('Error al confirmar pedido', e);
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

export default usePedidoData;
