'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EliminarModalProps {
  nombre: string; // Nombre del elemento a eliminar (antes era nombreTorta)
  contexto: string; // Contexto de donde se está eliminando (ej: "tortas", "cupcakes")
  onClose: (confirmed: boolean) => void;
}

export default function EliminarModal({ nombre, contexto, onClose }: EliminarModalProps) {
  const [open, setOpen] = useState(true);

  const handleConfirm = () => {
    setOpen(false);
    onClose(true); // Confirmar eliminación
  };

  const handleCancel = () => {
    setOpen(false);
    onClose(false); // Cancelar eliminación
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-pastel-beige p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar a <strong>{nombre}</strong> de <strong>{contexto}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleCancel} className="bg-pastel-blue hover:scale-105 transition-transform">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} className="bg-pastel-red hover:scale-105 transition-transform">
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}