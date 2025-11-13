'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Usuario, UsuarioFilter } from '@/interfaces/usuarios';
import { Pencil } from 'lucide-react';

interface FormTablaUsuarioProps {
  usuarios: Usuario[];
  loading: boolean;
  search: string;
  filter: UsuarioFilter;
  page: number;
  totalPages: number;
  pageControls: { prevDisabled: boolean; nextDisabled: boolean };
  onSearchChange: (value: string) => void;
  onFilterChange: (value: UsuarioFilter) => void;
  onPageChange: (page: number) => void;
  onEdit: (usuario: Usuario) => void;
  onToggleActivo: (usuario: Usuario) => void;
  onModificarPermisos: (usuario: Usuario) => void;
  onChangePassword: (usuario: Usuario) => void;
}

const filterOptions: { label: string; value: UsuarioFilter }[] = [
  { label: 'Usuarios de Alta', value: 'activos' },
  { label: 'Usuarios de Baja', value: 'inactivos' },
  { label: 'Todos', value: 'todos' },
];

const FormTablaUsuario = ({
  usuarios,
  loading,
  search,
  filter,
  page,
  totalPages,
  pageControls,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onEdit,
  onToggleActivo,
  onModificarPermisos,
  onChangePassword,
}: FormTablaUsuarioProps) => {
  return (
    <section className="space-y-4 rounded-3xl border border-neutral-200 bg-pastel-cream p-6 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">
          Buscar Usuario
        </h2>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select
            value={filter}
            onValueChange={(value) =>
              onFilterChange(value as UsuarioFilter)
            }
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Filtro" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-100">
        <table className="min-w-full divide-y divide-neutral-100 text-sm">
          <thead className="bg-pastel-beige text-neutral-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Nombre</th>
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">DNI</th>
              <th className="px-4 py-2 text-left font-medium">Telefono</th>
              <th className="px-4 py-2 text-left font-medium">Direccion</th>
              <th className="px-4 py-2 text-left font-medium">Estado</th>
              <th className="px-4 py-2 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {usuarios.map((usuario) => (
              <tr key={usuario.id_perfil}>
                <td className="px-4 py-3 font-medium">{usuario.nombre}</td>
                <td className="px-4 py-3">{usuario.email ?? '-'}</td>
                <td className="px-4 py-3">{usuario.dni}</td>
                <td className="px-4 py-3">{usuario.telefono ?? '-'}</td>
                <td className="px-4 py-3">{usuario.direccion ?? '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      usuario.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {usuario.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-pastel-blue text-black hover:bg-blue-400"
                      onClick={() => onEdit(usuario)}
                    >
                      <Pencil size={16} /> Editar
                    </Button>
                    <Button
                      type="button"
                      variant={usuario.is_active ? 'destructive' : 'default'}
                      className={
                        usuario.is_active
                          ? 'bg-pastel-red text-black hover:bg-red-400'
                          : 'bg-green-200 text-black hover:bg-green-400'
                      }
                      onClick={() => onToggleActivo(usuario)}
                    >
                      {usuario.is_active ? 'Dar de baja' : 'Dar de alta'}
                    </Button>
                    <Button
                      type="button"
                      className="bg-pastel-yellow text-black hover:bg-yellow-400"
                      onClick={() => onModificarPermisos(usuario)}
                    >
                      <Pencil size={16} /> Modificar permisos
                    </Button>
                    <Button
                      type="button"
                      className="bg-pastel-blue text-black hover:bg-blue-400"
                      onClick={() => onChangePassword(usuario)}
                      disabled={!usuario.has_account}
                    >
                      Cambio de contrasena
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!usuarios.length && !loading && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-neutral-500"
                  colSpan={7}
                >
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && (
        <p className="text-center text-sm text-neutral-500">
          Cargando usuarios...
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-500">
          Pagina {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="bg-pastel-blue text-black hover:bg-blue-400"
            onClick={() => onPageChange(page - 1)}
            disabled={pageControls.prevDisabled}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bg-pastel-blue text-black hover:bg-blue-400"
            onClick={() => onPageChange(page + 1)}
            disabled={pageControls.nextDisabled}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FormTablaUsuario;

