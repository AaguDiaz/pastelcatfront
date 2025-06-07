'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react'; // Importamos un ícono de alerta/error

interface ModalErrorProps {
  titulo: string;
  mensaje: string;
  onClose: () => void;
}

export default function ModalError({ titulo, mensaje, onClose }: ModalErrorProps) {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-pastel-beige p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={24} />
            {titulo}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-700">
            {mensaje}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} className="bg-pastel-red hover:bg-red-500 hover:scale-105 transition-transform">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}