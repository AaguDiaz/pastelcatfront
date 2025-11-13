'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PERMISO_MODULOS, Grupo, Permiso } from '@/interfaces/permisos';

type AssignmentType = 'grupo' | 'permiso';

interface UsuarioPermisosModalProps {
  open: boolean;
  loading: boolean;
  usuarioNombre: string;
  gruposOptions: Grupo[];
  permisosOptions: Permiso[];
  moduloFilter: string;
  onModuloFilterChange: (value: string) => void;
  selectedGrupoId: string;
  onSelectGrupo: (value: string) => void;
  selectedPermisoId: string;
  onSelectPermiso: (value: string) => void;
  assignedGrupos: Grupo[];
  assignedPermisos: Permiso[];
  onAddGrupo: () => void;
  onAddPermiso: () => void;
  onRemoveGrupo: (id: number) => void;
  onRemovePermiso: (id: number) => void;
  onClearSelections: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

const UsuarioPermisosModal = ({
  open,
  loading,
  usuarioNombre,
  gruposOptions,
  permisosOptions,
  moduloFilter,
  onModuloFilterChange,
  selectedGrupoId,
  onSelectGrupo,
  selectedPermisoId,
  onSelectPermiso,
  assignedGrupos,
  assignedPermisos,
  onAddGrupo,
  onAddPermiso,
  onRemoveGrupo,
  onRemovePermiso,
  onClearSelections,
  onConfirm,
  onClose,
}: UsuarioPermisosModalProps) => {
  const selectedGrupo = gruposOptions.find(
    (grupo) => String(grupo.id_grupo) === selectedGrupoId,
  );

  const selectedGrupoDescripcion =
    selectedGrupo?.descripcion ?? 'Selecciona un grupo';

  const combinedAssignments: Array<{
    id: number;
    label: string;
    type: AssignmentType;
  }> = [
    ...assignedGrupos.map((grupo) => ({
      id: grupo.id_grupo,
      label: `Grupo: ${grupo.nombre}`,
      type: 'grupo' as const,
    })),
    ...assignedPermisos.map((permiso) => ({
      id: permiso.id_permiso,
      label: `Permiso: ${permiso.modulo} - ${permiso.accion}`,
      type: 'permiso' as const,
    })),
  ];

  const handleRemove = (item: { id: number; type: AssignmentType }) => {
    if (item.type === 'grupo') {
      onRemoveGrupo(item.id);
    } else {
      onRemovePermiso(item.id);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[90vw] max-w-5xl sm:max-w-5xl rounded-3xl bg-pastel-cream p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-neutral-900">
            Gestion de permisos al usuario &quot;{usuarioNombre}&quot;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            <div className="flex-1">
              <p className="mb-1 font-medium text-neutral-900">
                Grupos de permisos
              </p>
              <Select
                value={selectedGrupoId || undefined}
                onValueChange={onSelectGrupo}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {gruposOptions.map((grupo) => (
                    <SelectItem
                      key={grupo.id_grupo}
                      value={String(grupo.id_grupo)}
                    >
                      {grupo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <p className="mb-1 font-medium text-neutral-900">Descripcion</p>
              <Input
                value={selectedGrupoDescripcion}
                readOnly
                className="bg-neutral-100 text-neutral-700"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full bg-pastel-blue text-neutral-900 hover:bg-blue-400"
                disabled={!selectedGrupoId || loading}
                onClick={onAddGrupo}
              >
                Agregar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
            <div className="flex-1">
              <p className="mb-1 font-medium text-neutral-900">
                Permisos Individuales
              </p>
              <Select
                value={selectedPermisoId || undefined}
                onValueChange={onSelectPermiso}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {permisosOptions.map((permiso) => (
                    <SelectItem
                      key={permiso.id_permiso}
                      value={String(permiso.id_permiso)}
                    >
                      {permiso.modulo} - {permiso.accion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <p className="mb-1 font-medium text-neutral-900">
                Filtro para buscar permisos
              </p>
              <Select
                value={moduloFilter}
                onValueChange={onModuloFilterChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {PERMISO_MODULOS.map((modulo) => (
                    <SelectItem key={modulo.value} value={modulo.value}>
                      {modulo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full bg-pastel-blue text-neutral-900 hover:bg-blue-400"
                disabled={!selectedPermisoId || loading}
                onClick={onAddPermiso}
              >
                Agregar
              </Button>
            </div>
          </div>

          <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-2xl border border-neutral-200 bg-white/80">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-pastel-beige text-neutral-700">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">
                    Grupo / Permiso
                  </th>
                  <th className="px-4 py-2 text-left font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {combinedAssignments.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td className="px-4 py-3">{item.label}</td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="destructive"
                        className="bg-pastel-red text-neutral-900 hover:bg-red-400"
                        disabled={loading}
                        onClick={() => handleRemove(item)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
                {!combinedAssignments.length && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-neutral-500"
                      colSpan={2}
                    >
                      No hay grupos ni permisos asignados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="bg-pastel-yellow text-neutral-900 hover:bg-yellow-400"
            onClick={onClearSelections}
            disabled={loading}
          >
            Limpiar
          </Button>
          <Button
            type="button"
            className="bg-pastel-blue text-neutral-900 hover:bg-blue-400"
            onClick={onConfirm}
            disabled={loading}
          >
            Confirmar permisos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsuarioPermisosModal;
