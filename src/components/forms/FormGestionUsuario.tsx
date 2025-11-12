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
import { UsuarioFormState } from '@/interfaces/usuarios';

interface FormGestionUsuarioProps {
  form: UsuarioFormState;
  isEditing: boolean;
  loading: boolean;
  onFieldChange: (field: keyof UsuarioFormState, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onGestionPermisos: () => void;
}

const FormGestionUsuario = ({
  form,
  isEditing,
  loading,
  onFieldChange,
  onSubmit,
  onCancel,
  onGestionPermisos,
}: FormGestionUsuarioProps) => {
  const showEmail = form.grupo === 'administrador';

  return (
    <section className="space-y-6 rounded-3xl border border-neutral-200 bg-pastel-cream p-6 shadow-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Gestion de Usuarios
          </h1>
          
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
          onClick={onGestionPermisos}
          disabled
        >
          Gestionar permisos
        </Button>
      </div>
      <p className="text-lg font-semibold text-neutral-900">Nuevo usuario</p>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="flex-1">
          <label className="block mb-1 font-medium">
            Nombre Completo
          </label>
        <Input
          placeholder="Ej: Juan Perez"
          value={form.nombre}
          onChange={(e) => onFieldChange('nombre', e.target.value)}
        />
        </div>
        <div className="flex-1">
          <label className="block mb-1 font-medium">
            DNI
          </label>
          <Input
            placeholder="Ej: 12345678"
            value={form.dni}
            onChange={(e) => onFieldChange('dni', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block mb-1 font-medium">
            Telefono
          </label>
          <Input
            placeholder="Ej: 123456789"
            value={form.telefono}
            onChange={(e) => onFieldChange('telefono', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block mb-1 font-medium">
            Direccion
          </label>
          <Input
            placeholder="Ej: Calle Falsa 123"
            value={form.direccion}
            onChange={(e) => onFieldChange('direccion', e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="flex-1">
          <label className="block mb-1 font-medium">
            Grupo
          </label>
          <div>
            <Select
              value={form.grupo}
              onValueChange={(value) =>
                onFieldChange('grupo', value as UsuarioFormState['grupo'])
              }
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {showEmail && (
          <div className="md:col-span-3">
            <label className="block mb-1 font-medium">Email</label>
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              disabled={isEditing}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            className="bg-pastel-yellow hover:bg-yellow-400"
            onClick={onCancel}
            disabled={loading}
          >
            Limpiar
          </Button>
        )}
        <Button
          type="button"
          className="bg-pastel-blue px-8 text-neutral-900 hover:bg-blue-400"
          onClick={onSubmit}
          disabled={loading}
        >
          {isEditing ? 'Guardar cambios' : 'Agregar'}
        </Button>
      </div>
    </section>
  );
};

export default FormGestionUsuario;
