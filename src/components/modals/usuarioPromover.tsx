'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UsuarioPromoverModalProps {
  open: boolean;
  loading: boolean;
  usuarioNombre: string;
  email: string;
  dni: string;
  requireDni: boolean;
  onEmailChange: (value: string) => void;
  onDniChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const UsuarioPromoverModal = ({
  open,
  loading,
  usuarioNombre,
  email,
  dni,
  requireDni,
  onEmailChange,
  onDniChange,
  onConfirm,
  onClose,
}: UsuarioPromoverModalProps) => {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-lg rounded-3xl bg-pastel-cream p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-neutral-900">
            Promover a administrador
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-600">
          Completá los siguientes datos para habilitar a &quot;{usuarioNombre}&quot; como
          usuario logueable. Se creará una cuenta y se enviará un link para
          definir su contraseña.
        </p>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">
              Email *
            </label>
            <Input
              type="email"
              placeholder="usuario@dominio.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">
              DNI {requireDni ? '*' : ''}
            </label>
            <Input
              placeholder="Ej: 30123456"
              value={dni}
              onChange={(e) => onDniChange(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="bg-pastel-yellow text-neutral-900 hover:bg-yellow-400"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-pastel-blue text-neutral-900 hover:bg-blue-400"
            onClick={onConfirm}
            disabled={loading}
          >
            Confirmar promoción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsuarioPromoverModal;
