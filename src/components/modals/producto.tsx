'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Producto } from '@/interfaces/pedidos';
import ProductCard from '../ui/productocard';
import Detallestorta from './detallestorta';
import DetallesBandeja from './detallebandeja';
import { Bandeja } from '@/interfaces/bandejas';
import {Torta} from '@/interfaces/tortas';
import {api} from '@/lib/api';

interface ProductosModalProps {
  open: boolean;
  onClose: () => void;
  productos: Producto[];
  search: string;
  setSearch: (s: string) => void;
  tipo: 'torta' | 'bandeja';
  setTipo: (t: 'torta' | 'bandeja') => void;
  page: number;
  next: () => void;
  prev: () => void;
    hasMore: boolean;
  onAdd: (p: Producto) => void;
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
}: ProductosModalProps) {
  const [tortaDetalles, setTortaDetalles] = useState<Torta | null>(null);
  const [bandejaDetalles, setBandejaDetalles] = useState<Bandeja | null>(null);
  const API_BASE_URL = api

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
    if (producto.tipo === 'torta') {
      const torta: Torta = {
        id_torta: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        tamaño: producto.tamanio || '',
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
  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-5xl bg-pastel-beige p-4 sm:p-6 rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex h-full flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Agregar productos</DialogTitle>
              <DialogDescription>
                Buscá tortas o bandejas y agregalas al pedido.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={tipo === 'torta' ? 'outline' : 'default'}
                  onClick={() => { setTipo('torta'); page = 1; }}
                  className={tipo === 'torta' ? 'bg-pastel-blue hover:bg-blue-200' : 'bg-transparent hover:bg-gray-100'}
                >
                  Tortas
                </Button>
                <Button
                  variant={tipo === 'bandeja' ? 'outline' : 'default'}
                  onClick={() => { setTipo('bandeja'); page = 1; }}
                  className={tipo === 'bandeja' ? 'bg-pastel-blue hover:bg-blue-200' : 'bg-transparent hover:bg-gray-100'}
                >
                  Bandejas
                </Button>
              </div>
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:max-w-xs"
              />
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productos.map((p) => (
                  <ProductCard
                    key={`${p.tipo}-${p.id}`}
                    producto={p}
                    onAdd={onAdd}
                    onDetails={handleDetails}
                  />
                ))}
                {!productos.length && (
                  <p className="text-center text-sm text-neutral-500 col-span-full">
                    No se encontraron productos para la búsqueda.
                  </p>
                )}
              </div>
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
