'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EstadoPedidoModalProps {
  open: boolean;
  estadoActual: string;
  onClose: () => void;
  onSubmit: (nuevoEstado: string) => Promise<void> | void;
}

const ESTADOS = ['pendiente', 'confirmado', 'cerrado', 'cancelado'] as const;

export default function EstadoPedidoModal({ open, estadoActual, onClose, onSubmit }: EstadoPedidoModalProps) {
  const [estado, setEstado] = useState<string>(estadoActual || 'pendiente');
  useEffect(() => {
    if (open) setEstado(estadoActual || 'pendiente');
  }, [open, estadoActual]);

  const handleAccept = async () => {
    await onSubmit(estado);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[420px] bg-pastel-beige p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block text-sm font-medium">Nuevo estado</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm bg-white"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600">Actual: <strong>{estadoActual || '—'}</strong></p>
        </div>
        <DialogFooter>
          <Button type="button" onClick={onClose} className="bg-pastel-blue">Cancelar</Button>
          <Button type="button" onClick={handleAccept} className="bg-pastel-green">Aceptar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

