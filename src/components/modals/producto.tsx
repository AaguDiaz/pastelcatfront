'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
        <DialogContent className="w-full max-w-lg sm:max-w-3xl lg:max-w-6xl bg-pastel-beige p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>Agregar productos</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-2">
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
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {productos.map((p) => (
            <ProductCard
              key={`${p.tipo}-${p.id}`}
              producto={p}
              onAdd={onAdd}
              onDetails={handleDetails}
            />
          ))}
        </div>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={prev} disabled={page === 1}>
              Prev
            </Button>
            <Button variant="outline" onClick={next} disabled={!hasMore}>
              Next
            </Button>
          </div>
        </DialogFooter>
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