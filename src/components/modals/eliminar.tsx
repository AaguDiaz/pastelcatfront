'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EliminarModalProps {
  nombre: string;
  contexto: string;
  onClose: (confirmed: boolean) => void;
  mensaje?: string;
}

export default function EliminarModal({
  nombre,
  contexto,
  onClose,
  mensaje,
}: EliminarModalProps) {
  const [open, setOpen] = useState(true);
  const closingRef = useRef(false);

  const handleClose = (confirmed: boolean) => {
    closingRef.current = true;
    setOpen(false);
    onClose(confirmed);
  };

  const bodyText =
    mensaje ??
    `Estas seguro de que deseas eliminar a ${nombre} de ${contexto}? Esta accion no se puede deshacer.`;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (!closingRef.current) {
        onClose(false);
      }
      closingRef.current = false;
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-lg bg-pastel-beige p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle>Confirmar</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">{bodyText}</p>
        </div>
        <DialogFooter>
          <Button
            onClick={() => handleClose(false)}
            className="bg-pastel-blue text-black hover:bg-blue-400"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleClose(true)}
            className="bg-pastel-red text-black hover:bg-red-400"
          >
            Dar de baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
