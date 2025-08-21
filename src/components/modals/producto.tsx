'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Producto } from '@/interfaces/pedidos';
import ProductCard from '../ui/productocard';

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
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-full max-w-lg sm:max-w-3xl lg:max-w-6xl bg-pastel-beige p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>Agregar productos</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-2">
            <Button
              variant={tipo === 'torta' ? 'outline' : 'default'}
              onClick={() => setTipo('torta')}
              className={tipo === 'torta' ? 'bg-pastel-blue hover:bg-blue-200' : 'bg-transparent hover:bg-gray-100'}
            >
              Tortas
            </Button>
            <Button
              variant={tipo === 'bandeja' ? 'outline' : 'default'}
              onClick={() => setTipo('bandeja')}
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
            <ProductCard key={`${p.tipo}-${p.id}`} producto={p} onAdd={onAdd} />
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
  );
}