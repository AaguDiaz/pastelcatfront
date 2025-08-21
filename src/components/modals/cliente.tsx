'use client';

import { Cliente } from '@/interfaces/pedidos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ClienteModalProps {
  open: boolean;
  onClose: () => void;
  clientes: Cliente[];
  search: string;
  setSearch: (s: string) => void;
  page: number;
  next: () => void;
  prev: () => void;
  hasMore: boolean;
  onSelect: (c: Cliente) => void;
}

export default function ClienteModal({
  open,
  onClose,
  clientes,
  search,
  setSearch,
  page,
  next,
  prev,
  hasMore,
  onSelect,
}: ClienteModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[425px] bg-pastel-beige p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>Seleccionar cliente</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.nombre}</td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      className="bg-pastel-blue hover:bg-blue-200"
                      onClick={() => {
                        onSelect(c);
                        onClose();
                      }}
                    >
                      Seleccionar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
