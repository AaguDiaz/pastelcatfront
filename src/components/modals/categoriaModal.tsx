'use client';

import { Categoria } from '@/interfaces/articulos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CategoriaModalProps {
  open: boolean;
  categorias: Categoria[];
  nombre: string;
  isEditing: boolean;
  loading: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onEdit: (categoria: Categoria) => void;
  onDelete: (categoria: Categoria) => void;
}

const CategoriaModal = ({
  open,
  categorias,
  nombre,
  isEditing,
  loading,
  onClose,
  onNameChange,
  onSubmit,
  onEdit,
  onDelete,
}: CategoriaModalProps) => {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-[92vw] sm:max-w-2xl lg:max-w-3xl rounded-3xl bg-pastel-cream p-4 sm:p-6 shadow-xl max-h-[85vh] overflow-hidden">
        <div className="flex h-full flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-neutral-900">
              Categorias
            </DialogTitle>
            <DialogDescription>
              Creá o edita categorías y administrá las existentes desde aquí.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
              <div>
                <label className="mb-1 block font-medium">Nueva categoría</label>
                <Input
                  placeholder="Ej: Cubiertos"
                  value={nombre}
                  onChange={(e) => onNameChange(e.target.value)}
                />
              </div>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  className="w-full bg-pastel-blue text-black hover:bg-blue-400 sm:w-auto"
                  onClick={onSubmit}
                  disabled={loading}
                >
                  {isEditing ? 'Guardar categoria' : 'Agregar categoria'}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-100">
              <div className="max-h-[45vh] overflow-auto">
                <table className="min-w-full divide-y divide-neutral-100 text-sm">
                  <thead className="bg-pastel-beige text-neutral-600">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Categorías</th>
                      <th className="px-4 py-2 text-left font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {categorias.map((categoria) => {
                      const isProtected = categoria.id_categoria === 1;
                      return (
                        <tr key={categoria.id_categoria}>
                          <td className="px-4 py-3 font-medium">{categoria.nombre}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                className="bg-pastel-blue text-black hover:bg-blue-400"
                                onClick={() => onEdit(categoria)}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="bg-pastel-red text-black hover:bg-red-400"
                                onClick={() => onDelete(categoria)}
                                disabled={isProtected}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!categorias.length && (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-neutral-500"
                          colSpan={2}
                        >
                          Aún no hay categorías registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="bg-pastel-yellow text-black hover:bg-yellow-400"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoriaModal;
