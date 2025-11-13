'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { usePermisosData } from '@/hooks/usePermisosData';
import { Grupo, Permiso } from '@/interfaces/permisos';

type GrupoStateProps = ReturnType<typeof usePermisosData>['grupoState'];

interface FormGestionGruposProps {
  state: GrupoStateProps;
}

const FormGestionGrupos = ({ state }: FormGestionGruposProps) => {
  const {
    form,
    mode,
    readOnly,
    loading,
    saving,
    search,
    setSearch,
    page,
    totalPages,
    changePage,
    list,
    moduloOptions,
    permisoFilter,
    setPermisoFilter,
    selectedPermisoId,
    setSelectedPermisoId,
    permisosOptions,
    permisosOptionsLoading,
    onFieldChange,
    onAddPermiso,
    onRemovePermiso,
    onReset,
    onSubmit,
    onVerDetalle,
    onEditar,
    onEliminar,
  } = state;

  const titulo =
    mode === 'nuevo'
      ? 'Nuevo Grupo'
      : mode === 'detalle'
        ? `Detalle de "${form.nombre || 'grupo'}"`
        : `Editar "${form.nombre || 'grupo'}"`;

  const handlePageChange = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1;
    changePage(page + delta);
  };

  const handleAddPermiso = () => {
    onAddPermiso();
  };

  const handleRemovePermiso = (permiso: Permiso) => {
    onRemovePermiso(permiso.id_permiso);
  };

  const handleVerDetalle = (grupo: Grupo) => {
    onVerDetalle(grupo);
  };

  const handleEditar = (grupo: Grupo) => {
    onEditar(grupo);
  };

  const handleEliminar = (grupo: Grupo) => {
    onEliminar(grupo);
  };

  const handleConfirmar = () => {
    onSubmit();
  };

  const handleLimpiar = () => {
    onReset();
  };

  return (
    <section className="space-y-4 rounded-3xl border border-neutral-200 bg-pastel-cream p-6 shadow-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-neutral-900">
          Gestion de Grupos
        </h2>
      </div>

      <div className="space-y-4 rounded-2xl border border-neutral-100 bg-pastel-cream p-4">
        <p className="text-lg font-semibold text-neutral-900">{titulo}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-medium">Nombre</label>
            <Input
              value={form.nombre}
              onChange={(e) => onFieldChange('nombre', e.target.value)}
              placeholder="Ej: Administrador"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Descripcion</label>
            <Textarea
              value={form.descripcion}
              onChange={(e) => onFieldChange('descripcion', e.target.value)}
              placeholder="Ej: Acceso a todos los modulos del sistema."
              rows={2}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <label className="mb-1 block font-medium">Permisos</label>
            <Select
              value={selectedPermisoId || undefined}
              onValueChange={setSelectedPermisoId}
              disabled={readOnly || permisosOptionsLoading}
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
            {permisosOptionsLoading && (
              <p className="mt-1 text-xs text-neutral-500">
                Cargando permisos...
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block font-medium">
              Filtro para buscar permisos
            </label>
            <Select
              value={permisoFilter}
              onValueChange={setPermisoFilter}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {moduloOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full bg-pastel-blue text-neutral-900 hover:bg-blue-400"
              onClick={handleAddPermiso}
              disabled={readOnly || !selectedPermisoId || saving}
            >
              Agregar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-pastel-beige text-neutral-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Permiso</th>
                <th className="px-4 py-2 text-left font-medium">Slug</th>
                <th className="px-4 py-2 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {form.permisos.map((permiso) => (
                <tr key={permiso.id_permiso}>
                  <td className="px-4 py-3">
                    {permiso.modulo} - {permiso.accion}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {permiso.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="destructive"
                      className="bg-pastel-red text-black hover:bg-red-400"
                      onClick={() => handleRemovePermiso(permiso)}
                      disabled={readOnly}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {!form.permisos.length && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-neutral-500"
                    colSpan={3}
                  >
                    No hay permisos seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="bg-pastel-yellow text-black hover:bg-yellow-400"
            onClick={handleLimpiar}
            disabled={saving}
          >
            Limpiar
          </Button>
          <Button
            type="button"
            className="bg-pastel-blue px-8 text-neutral-900 hover:bg-blue-400"
            onClick={handleConfirmar}
            disabled={readOnly || saving}
          >
            Confirmar grupo
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-neutral-100 bg-pastel-cream p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-lg font-semibold text-neutral-900">
            Buscar Grupos
          </p>
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-pastel-beige text-neutral-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nombre</th>
                <th className="px-4 py-2 text-left font-medium">
                  Descripcion
                </th>
                <th className="px-4 py-2 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {list.map((grupo) => (
                <tr key={grupo.id_grupo}>
                  <td className="px-4 py-3 font-medium">{grupo.nombre}</td>
                  <td className="px-4 py-3">
                    {grupo.descripcion ?? 'Sin descripcion'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="bg-pastel-yellow text-black hover:bg-yellow-400"
                        onClick={() => handleVerDetalle(grupo)}
                      >
                        Ver detalle
                      </Button>
                      <Button
                        type="button"
                        className="bg-pastel-blue text-black hover:bg-blue-400"
                        onClick={() => handleEditar(grupo)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="bg-pastel-red text-black hover:bg-red-400"
                        onClick={() => handleEliminar(grupo)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && !loading && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-neutral-500"
                    colSpan={3}
                  >
                    No se encontraron grupos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <p className="text-center text-sm text-neutral-500">
            Cargando grupos...
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-600">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-pastel-blue text-black hover:bg-blue-400"
              onClick={() => handlePageChange('prev')}
              disabled={page <= 1}
            >
              Atras
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-pastel-blue text-black hover:bg-blue-400"
              onClick={() => handlePageChange('next')}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormGestionGrupos;
