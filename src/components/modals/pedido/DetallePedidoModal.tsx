'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePedidoOrEventoData } from '@/hooks/usePedidoOrEventoData';

interface DetallePedidoModalProps {
  open: boolean;
  pedidoId: number | null;
  onClose: () => void;
  mode?: 'pedido' | 'evento';
  contextLabel?: string;
}

interface ModalItem {
  key: string;
  productoId: number;
  id: number;
  tipo: 'torta' | 'bandeja' | 'articulo';
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  tamanio?: string;
  stockDisponible?: number;
  stockTotal?: number;
  categoriaNombre?: string | null;
}

interface PedidoCompletoView {
  id: number;
  cliente: { id: number; nombre: string };
  fecha_entrega: string;
  tipo_entrega: string;
  fecha_creacion: string | null;
  direccion_entrega: string | null;
  observaciones: string | null;
  estado: string;
  total_items: number;
  total_final: number;
  total_descuento: number;
  items: ModalItem[];
}

export default function DetallePedidoModal({
  open,
  pedidoId,
  onClose,
  mode = 'pedido',
  contextLabel,
}: DetallePedidoModalProps) {
  const dataContext = usePedidoOrEventoData(mode);
  const { getPedidoCompleto } = dataContext;
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState<PedidoCompletoView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 3;
  const label = contextLabel ?? (mode === 'evento' ? 'Evento' : 'Pedido');
  const labelLower = label.toLowerCase();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!open || !pedidoId) return;
      setLoading(true);
      setError(null);
      try {
        const d = await getPedidoCompleto(pedidoId);
        if (!cancelled) setDetalle(d as PedidoCompletoView);
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
            ? (e as { message: string }).message
            : 'Error al cargar detalles';
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, pedidoId, getPedidoCompleto]);

  useEffect(() => {
    if (open) setPage(1);
  }, [open, detalle?.id]);

  const totalPages = useMemo(() => {
    const len = Array.isArray(detalle?.items) ? detalle.items.length : 0;
    return Math.max(1, Math.ceil(len / PAGE_SIZE));
  }, [detalle]);

  const paginatedItems = useMemo(() => {
    const items = Array.isArray(detalle?.items) ? detalle.items : [];
    const current = Math.min(page, Math.max(1, Math.ceil(items.length / PAGE_SIZE) || 1));
    const start = (current - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [detalle, page]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[85vw] lg:max-w-[70vw] xl:max-w-[60vw] mx-4 bg-pastel-cream text-gray-800 p-6 rounded-lg shadow-2xl border-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg leading-none font-semibold">Detalle del {labelLower}</DialogTitle>
        </DialogHeader>
        {loading && <div className="py-6">Cargando…</div>}
        {error && <div className="py-6 text-red-600">{error}</div>}
        {!loading && !error && detalle && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p><strong>ID:</strong> {detalle.id}</p>
                <p><strong>Cliente:</strong> {detalle.cliente?.nombre ?? ''}</p>
                <p><strong>Estado:</strong> {detalle.estado}</p>
                <p><strong>Fecha creación:</strong> {detalle.fecha_creacion ? new Date(detalle.fecha_creacion).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p><strong>Fecha entrega:</strong> {new Date(detalle.fecha_entrega).toLocaleString()}</p>
                <p><strong>Método:</strong> {detalle.tipo_entrega}</p>
                <p><strong>Dirección:</strong> {detalle.direccion_entrega ?? '-'}</p>
              </div>
            </div>
            <div>
              <p><strong>Observaciones:</strong> {detalle.observaciones ?? '-'}</p>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-xl font-semibold mb-2">Productos</h3>
              {paginatedItems.filter((it) => it.tipo === 'articulo').length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white mb-4">
                  <table className="min-w-full divide-y divide-neutral-100 text-sm">
                    <thead className="bg-pastel-beige text-neutral-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Artículo</th>
                        <th className="px-3 py-2 text-left font-medium">Categoría</th>
                        <th className="px-3 py-2 text-left font-medium">Stock disp.</th>
                        <th className="px-3 py-2 text-left font-medium">Cantidad</th>
                        <th className="px-3 py-2 text-left font-medium">Precio</th>
                        <th className="px-3 py-2 text-left font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700">
                      {paginatedItems
                        .filter((it) => it.tipo === 'articulo')
                        .map((it) => (
                          <tr key={it.key}>
                            <td className="px-3 py-3 font-medium">{it.nombre}</td>
                            <td className="px-3 py-3">{it.categoriaNombre ?? '-'}</td>
                            <td className="px-3 py-3">
                              {typeof it.stockDisponible === 'number'
                                ? `${it.stockDisponible}${
                                    typeof it.stockTotal === 'number' ? ` / ${it.stockTotal}` : ''
                                  }`
                                : '-'}
                            </td>
                            <td className="px-3 py-3">{it.cantidad}</td>
                            <td className="px-3 py-3">${Number(it.precio).toFixed(2)}</td>
                            <td className="px-3 py-3">
                              ${(Number(it.precio) * Number(it.cantidad)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {paginatedItems.filter((it) => it.tipo !== 'articulo').length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedItems
                    .filter((it) => it.tipo !== 'articulo')
                    .map((it) => (
                  <div key={it.key} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                    <div className="relative w-full h-40 md:h-36 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.imagen || '/cupcake.jpg'}
                        alt={it.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/cupcake.jpg'; }}
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="text-xs uppercase text-gray-500">{it.tipo}</div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{it.nombre}</h3>
                      <p className="text-md font-bold text-green-600 mb-2">${Number(it.precio).toFixed(2)}</p>
                      {it.tamanio && (
                        <p className="text-sm text-gray-500 mb-2">Tamaño: {it.tamanio}</p>
                      )}
                      <div className="mt-auto pt-3 border-t border-gray-200 grid grid-cols-2 text-sm">
                        <span className="text-gray-600">Cant: {it.cantidad}</span>
                        <span className="text-right font-semibold">Subt: ${(Number(it.precio) * Number(it.cantidad)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
              {paginatedItems.length === 0 && (
                <p className="text-sm text-neutral-500">No se encontraron productos para mostrar.</p>
              )}
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button
                  size="sm"
                  className="bg-pastel-blue hover:bg-blue-400"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm">Página {page} de {totalPages}</span>
                <Button
                  size="sm"
                  className="bg-pastel-blue hover:bg-blue-400"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-6 border-t pt-4 text-sm">
              <div><strong>Items:</strong> {detalle.total_items}</div>
              <div><strong>Descuento:</strong> ${Number(detalle.total_descuento || 0).toFixed(2)}</div>
              <div className="font-semibold"><strong>Total:</strong> ${Number(detalle.total_final).toFixed(2)}</div>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} className="bg-pastel-blue">Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
