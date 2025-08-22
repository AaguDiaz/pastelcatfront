import { useState, useEffect, useCallback } from 'react';
import { Cliente, Producto, PedidoPayload} from '@/interfaces/pedidos';
import { debugFetch } from '@/lib/debugFetch';

const API_BASE_URL = 'http://localhost:5000' //'https://pastelcatback.onrender.com';

const usePedidoData = () => {
  const [clienteSearch, setClienteSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [tipoProducto, setTipoProducto] = useState<'torta' | 'bandeja'>('torta');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientePage, setClientePage] = useState(1);
  const [productoPage, setProductoPage] = useState(1);
  const [hasMoreClientes, setHasMoreClientes] = useState(false);
  const [hasMoreProductos, setHasMoreProductos] = useState(false);


  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
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
        const text = await res.text();
        const errorText = await res.text();
        console.error('[HTTP ERROR BODY]', errorText);
        throw new Error(text || 'Error al cargar datos');
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return res.json();
      }
      return {};
    },
    []
  );
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
    };
  }, []);

  interface RawCliente {
    id?: number;
    id_cliente?: number;
    nombre: string;
  }

  const normalizeCliente = useCallback((c: RawCliente): Cliente => ({
    id: Number(c.id ?? c.id_cliente),
    nombre: c.nombre,
  }), []);

  const loadClientes = useCallback(async () => {
    try {
      const result = await fetchWithAuth(
        `${API_BASE_URL}/clientes?activo=true&page=${clientePage}&pageSize=10&search=${encodeURIComponent(clienteSearch)}`
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
        const result = await fetchWithAuth(
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
  }, [productoSearch, tipoProducto]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  const nextClientes = () => setClientePage((p) => p + 1);
  const prevClientes = () => setClientePage((p) => Math.max(1, p - 1));
  const nextProductos = () => setProductoPage((p) => p + 1);
  const prevProductos = () => setProductoPage((p) => Math.max(1, p - 1));

  const confirmarPedido = useCallback(
    async (pedido: PedidoPayload) => {
      try {
         console.log('[PEDIDOS] Enviando payload a /pedidos =>', pedido, JSON.stringify(pedido, null, 2));
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