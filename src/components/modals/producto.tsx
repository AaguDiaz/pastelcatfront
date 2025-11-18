'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Producto, ProductoTipo } from '@/interfaces/pedidos';
import ProductCard from '../ui/productocard';
import Detallestorta from './detallestorta';
import DetallesBandeja from './detallebandeja';
import { Bandeja } from '@/interfaces/bandejas';
import { Torta } from '@/interfaces/tortas';
import { api } from '@/lib/api';

interface ProductosModalProps {
  open: boolean;
  onClose: () => void;
  productos: Producto[];
  search: string;
  setSearch: (s: string) => void;
  tipo: ProductoTipo;
  setTipo: (t: ProductoTipo) => void;
  page: number;
  next: () => void;
  prev: () => void;
  hasMore: boolean;
  onAdd: (p: Producto) => void;
  allowArticulos?: boolean;
}

export default function ProductosModal({
  open,
  onClose,
  productos,
  search,
  setSearch,
  tipo,
  setTipo,
  page,
  next,
  prev,
  hasMore,
  onAdd,
  allowArticulos = false,
}: ProductosModalProps) {
  const [tortaDetalles, setTortaDetalles] = useState<Torta | null>(null);
  const [bandejaDetalles, setBandejaDetalles] = useState<Bandeja | null>(null);
  const API_BASE_URL = api;
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2,
      }),
    [],
  );
  const formatCurrency = useCallback(
    (value?: number) => {
      if (typeof value !== 'number' || Number.isNaN(value)) return '-';
      return currencyFormatter.format(value);
    },
    [currencyFormatter],
  );

  const fetchRecetaDetails = async (tortaId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/receta/detalles/torta/${tortaId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Error al obtener los detalles de la torta');
      return await res.json();
    } catch (err) {
      console.error('Error al cargar detalles de la torta', err);
      return null;
    }
  };

  const handleDetails = async (producto: Producto) => {
    if (producto.tipo === 'articulo') {
      return;
    }

    if (producto.tipo === 'torta') {
      const torta: Torta = {
        id_torta: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        tamanio: producto.tamanio || '',
        imagen: producto.imagen || null,
      };
      setTortaDetalles(torta);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/bandejas/${producto.id}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });
      if (res.status === 404) return;
      if (!res.ok) throw new Error('Error al obtener detalles de la bandeja');
      const data = await res.json();
      setBandejaDetalles(data);
    } catch (err) {
      console.error('Error al cargar detalles de la bandeja', err);
    }
  };

  const description = allowArticulos
    ? 'Buscá tortas, bandejas o artículos disponibles y agregalos al evento.'
    : 'Buscá tortas o bandejas disponibles y agregalas al pedido.';

  const tabs: { label: string; value: ProductoTipo }[] = [
    { label: 'Tortas', value: 'torta' },
    { label: 'Bandejas', value: 'bandeja' },
    ...(allowArticulos ? [{ label: 'Artículos', value: 'articulo' as ProductoTipo }] : []),
  ];

  const visibleProductos = useMemo(
    () =>
      allowArticulos
        ? productos.filter((p) => !(p.tipo === 'articulo' && p.categoriaId === 1))
        : productos,
    [allowArticulos, productos],
  );
  const isArticuloView = allowArticulos && tipo === 'articulo';
  const articuloProductos = useMemo(
    () => visibleProductos.filter((p) => p.tipo === 'articulo'),
    [visibleProductos],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-5xl bg-pastel-beige p-4 sm:p-6 rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex h-full flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Agregar productos</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={tipo === tab.value ? 'outline' : 'default'}
                    onClick={() => {
                      if (tipo !== tab.value) {
                        setTipo(tab.value);
                      }
                    }}
                    className={
                      tipo === tab.value
                        ? 'bg-pastel-blue hover:bg-blue-200'
                        : 'bg-transparent hover:bg-gray-100'
                    }
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:max-w-xs"
              />
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              {isArticuloView ? (
                articuloProductos.length ? (
                  <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
                    <table className="min-w-full divide-y divide-neutral-100 text-sm">
                      <thead className="bg-pastel-beige text-neutral-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Nombre</th>
                          <th className="px-3 py-2 text-left font-medium">Categoría</th>
                          <th className="px-3 py-2 text-left font-medium">Color</th>
                          <th className="px-3 py-2 text-left font-medium">Tamaño</th>
                          <th className="px-3 py-2 text-left font-medium">Reutilizable</th>
                          <th className="px-3 py-2 text-left font-medium">Stock disp.</th>
                          <th className="px-3 py-2 text-left font-medium">Costo unit.</th>
                          <th className="px-3 py-2 text-left font-medium">Precio alquiler</th>
                          <th className="px-3 py-2 text-left font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        {articuloProductos.map((p) => (
                          <tr key={`articulo-${p.id}`}>
                            <td className="px-3 py-3 font-medium">{p.nombre}</td>
                            <td className="px-3 py-3">{p.categoriaNombre ?? (p.categoriaId ? `#${p.categoriaId}` : '-')}</td>
                            <td className="px-3 py-3">{p.color ?? '-'}</td>
                            <td className="px-3 py-3">{p.tamanio ?? '-'}</td>
                            <td className="px-3 py-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  p.reutilizable
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-neutral-200 text-neutral-600'
                                }`}
                              >
                                {p.reutilizable ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {typeof p.stockDisponible === 'number' && typeof p.stockTotal === 'number'
                                ? `${p.stockDisponible}/${p.stockTotal}`
                                : p.stockDisponible ?? '-'}
                            </td>
                            <td className="px-3 py-3">{formatCurrency(p.costoUnitario)}</td>
                            <td className="px-3 py-3">{formatCurrency(p.precioAlquiler ?? p.precio)}</td>
                            <td className="px-3 py-3">
                              <Button
                                size="sm"
                                className="bg-pastel-blue text-black hover:bg-blue-200"
                                onClick={() => onAdd(p)}
                              >
                                Agregar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-sm text-neutral-500">
                    No se encontraron artículos para la búsqueda.
                  </p>
                )
              ) : visibleProductos.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleProductos.map((p) => (
                    <ProductCard
                      key={`${p.tipo}-${p.id}`}
                      producto={p}
                      onAdd={onAdd}
                      onDetails={p.tipo === 'articulo' ? undefined : handleDetails}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-neutral-500">
                  No se encontraron productos para la búsqueda.
                </p>
              )}
            </div>
            <DialogFooter>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-neutral-500">Página {page}</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={prev} disabled={page === 1}>
                    Anterior
                  </Button>
                  <Button variant="outline" onClick={next} disabled={!hasMore}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {tortaDetalles && (
        <Detallestorta
          torta={tortaDetalles}
          onClose={() => setTortaDetalles(null)}
          fetchRecetaDetails={fetchRecetaDetails}
        />
      )}
      {bandejaDetalles && (
        <DetallesBandeja bandeja={bandejaDetalles} onClose={() => setBandejaDetalles(null)} />
      )}
    </>
  );
}
