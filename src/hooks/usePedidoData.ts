import { useState, useEffect, useCallback } from 'react';
import { Cliente, Producto } from '@/interfaces/pedidos';

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

      const res = await fetch(url, { ...options, headers });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('No autorizado');
      }

      if (!res.ok) {
        const text = await res.text();
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

    const normalizeProducto = (x: any, tipo: Tipo): Producto => {
        const rawId = x.id ?? x.id_torta ?? x.id_bandeja ?? x.id_producto;
        return {
            id: Number(rawId),                 // aseguro número
            nombre: x.nombre,
            precio: Number(x.precio),
            imagen: x.imagen,
            tamanio: x.tamanio,
            tipo,                              // <- viene del filtro actual
        };
    };

  const loadClientes = useCallback(async () => {
    try {
      const result = await fetchWithAuth(
        `${API_BASE_URL}/clientes?activo=true&page=${clientePage}&pageSize=10&search=${encodeURIComponent(clienteSearch)}`
      );
      setClientes(result.data || []);
      setHasMoreClientes(result.data.length === 10);
    } catch (e) {
      console.error('Error al cargar clientes', e);
      setClientes([]);
        setHasMoreClientes(false);
    }
  }, [fetchWithAuth, clientePage, clienteSearch]);

  const loadProductos = useCallback(async () => {
    try {
        const result = await fetchWithAuth(
        `${API_BASE_URL}/productos?tipo=${tipoProducto}&page=${productoPage}&pageSize=6&search=${encodeURIComponent(productoSearch)}`
        );

        const raw = result?.data ?? [];
        const normalized: Producto[] = raw.map((x: any) => normalizeProducto(x, tipoProducto));

        setProductos(normalized);
        setHasMoreProductos(raw.length === 6);
    } catch (e) {
        console.error('Error al cargar productos', e);
        setProductos([]);
        setHasMoreProductos(false);
    }
   }, [fetchWithAuth, tipoProducto, productoPage, productoSearch]);

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
    async (pedido: unknown) => {
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