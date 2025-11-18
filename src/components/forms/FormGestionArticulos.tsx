'use client';

import { ArticuloFormState, Categoria } from '@/interfaces/articulos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormGestionArticulosProps {
  form: ArticuloFormState;
  categoriaOptions: Categoria[];
  isEditing: boolean;
  loading: boolean;
  requireCategorySelection: boolean;
  onFieldChange: (field: keyof ArticuloFormState, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  onOpenCategoriaModal: () => void;
}

const FormGestionArticulos = ({
  form,
  categoriaOptions,
  isEditing,
  loading,
  requireCategorySelection,
  onFieldChange,
  onSubmit,
  onReset,
  onOpenCategoriaModal,
}: FormGestionArticulosProps) => {
  return (
    <section className="space-y-6 rounded-3xl border border-neutral-200 bg-pastel-cream p-6 shadow-xl">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">
          Gestion de Articulos
        </h2>
        <p className="text-lg font-medium text-neutral-800">
          Nuevo articulo
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block font-medium">Nombre</label>
          <Input
            placeholder="Ej: Plato"
            value={form.nombre}
            onChange={(e) => onFieldChange('nombre', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block font-medium">Color</label>
          <Input
            placeholder="Ej: Rojo"
            value={form.color}
            onChange={(e) => onFieldChange('color', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block font-medium">Tamaño</label>
          <Input
            placeholder="Ej: Chico"
            value={form.tamanio}
            onChange={(e) => onFieldChange('tamanio', e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block font-medium">Es reutilizable?</label>
          <Select
            value={form.reutilizable}
            onValueChange={(value) =>
              onFieldChange('reutilizable', value as ArticuloFormState['reutilizable'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Si</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block font-medium">Categoria</label>
          <div className="flex gap-2">
            <Select
              value={form.id_categoria}
              onValueChange={(value) => onFieldChange('id_categoria', value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {categoriaOptions.map((categoria) => (
                  <SelectItem
                    key={categoria.id_categoria}
                    value={String(categoria.id_categoria)}
                  >
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="bg-pastel-blue text-black hover:bg-blue-400"
              onClick={onOpenCategoriaModal}
            >
              Nueva categoria
            </Button>
          </div>
          {requireCategorySelection && (
            <p className="text-sm text-red-600">
              Este artículo estaba dado de baja. Seleccioná una categoría para volver a habilitarlo.
            </p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-medium">Costo unitario</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 1000"
              value={form.costo_unitario}
              onChange={(e) => onFieldChange('costo_unitario', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Precio alquiler</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 500"
              value={form.precio_alquiler}
              onChange={(e) => onFieldChange('precio_alquiler', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block font-medium">Stock total</label>
          <Input
            type="number"
            min="0"
            placeholder="Ej: 100"
            value={form.stock_total}
            onChange={(e) => onFieldChange('stock_total', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block font-medium">Stock disponible</label>
          <Input
            type="number"
            min="0"
            placeholder="Ej: 50"
            value={form.stock_disponible}
            onChange={(e) => onFieldChange('stock_disponible', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          className="bg-pastel-yellow text-black hover:bg-yellow-400"
          onClick={onReset}
          disabled={loading}
        >
          Limpiar
        </Button>
        <Button
          type="button"
          className="bg-pastel-blue text-black hover:bg-blue-400"
          onClick={onSubmit}
          disabled={loading}
        >
          {isEditing ? 'Guardar cambios' : 'Agregar Articulo'}
        </Button>
      </div>
    </section>
  );
};

export default FormGestionArticulos;
