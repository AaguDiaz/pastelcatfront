'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react'; // Importamos un ícono de éxito

interface ModalExitoProps {
  titulo: string;
  mensaje: string;
  onClose: () => void; // Función que se ejecuta al cerrar
}

export default function ModalExito({ titulo, mensaje, onClose }: ModalExitoProps) {
  const [open, setOpen] = useState(true);

  // Función para manejar el cierre del modal
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  
  // Usamos onOpenChange para que el modal se cierre también si el usuario hace clic fuera
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-pastel-beige p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle size={24} />
            {titulo}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-700">
            {mensaje}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} className="bg-pastel-blue hover:bg-blue-400 hover:scale-105 transition-transform">
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}