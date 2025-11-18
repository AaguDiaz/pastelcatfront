'use client';

import { useMemo } from 'react';
import { Articulo, Categoria } from '@/interfaces/articulos';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { CATEGORY_INACTIVE_ID } from '@/hooks/useArticuloData';

interface FormTablaArticulosProps {
  articulos: Articulo[];
  categorias: Categoria[];
  search: string;
  categoriaFilter: string;
  page: number;
  totalPages: number;
  loading: boolean;
  pageControls: { prevDisabled: boolean; nextDisabled: boolean };
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (articulo: Articulo) => void;
  onDelete: (articulo: Articulo) => void;
  onReactivate?: (articulo: Articulo) => void;
}

const formatCurrency = (value: number | string | null | undefined) => {
  const numeric =
    typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : null;
  if (!Number.isFinite(numeric)) {
    return '-';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(numeric as number);
};

const FormTablaArticulos = ({
  articulos,
  categorias,
  search,
  categoriaFilter,
  page,
  totalPages,
  loading,
  pageControls,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onEdit,
  onDelete,
  onReactivate,
}: FormTablaArticulosProps) => {
  const categoriaMap = useMemo(() => {
    const map = new Map<number, string>();
    categorias.forEach((categoria) =>
      map.set(categoria.id_categoria, categoria.nombre),
    );
    return map;
  }, [categorias]);

  return (
    <section className="space-y-4 rounded-3xl border border-neutral-200 bg-pastel-cream p-6 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-xl font-semibold text-neutral-900">Buscar Articulo</h3>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select
            value={categoriaFilter}
            onValueChange={onFilterChange}
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Seleccionar Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem
                  key={categoria.id_categoria}
                  value={String(categoria.id_categoria)}
                >
                  {categoria.nombre}
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
              <th className="px-4 py-2 text-left font-medium">Categoria</th>
              <th className="px-4 py-2 text-left font-medium">Reutilizable</th>
              <th className="px-4 py-2 text-left font-medium">Color</th>
              <th className="px-4 py-2 text-left font-medium">Tamaño</th>
              <th className="px-4 py-2 text-left font-medium">Stock Total</th>
              <th className="px-4 py-2 text-left font-medium">Stock Disponible</th>
              <th className="px-4 py-2 text-left font-medium">Costo unitario</th>
              <th className="px-4 py-2 text-left font-medium">Precio alquiler</th>
              <th className="px-4 py-2 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {articulos.map((articulo) => (
              <tr key={articulo.id_articulo}>
                <td className="px-4 py-3 font-medium">{articulo.nombre}</td>
                <td className="px-4 py-3">
                  {categoriaMap.get(articulo.id_categoria) ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      articulo.reutilizable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {articulo.reutilizable ? 'Si' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">{articulo.color || '-'}</td>
                <td className="px-4 py-3">{articulo.tamanio || '-'}</td>
                <td className="px-4 py-3">{articulo.stock_total}</td>
                <td className="px-4 py-3">{articulo.stock_disponible}</td>
                <td className="px-4 py-3">{formatCurrency(articulo.costo_unitario)}</td>
                <td className="px-4 py-3">{formatCurrency(articulo.precio_alquiler)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-pastel-blue text-black hover:bg-blue-400"
                      onClick={() => onEdit(articulo)}
                    >
                      <Pencil size={16} /> Editar
                    </Button>
                    {articulo.id_categoria === CATEGORY_INACTIVE_ID ? (
                      <Button
                        type="button"
                        className="bg-pastel-green text-black hover:bg-green-400"
                        onClick={() => onReactivate?.(articulo)}
                      >
                        Dar de alta
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        className="bg-pastel-red text-black hover:bg-red-400"
                        onClick={() => onDelete(articulo)}
                      >
                        Dar de baja
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!articulos.length && !loading && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-neutral-500"
                  colSpan={10}
                >
                  No se encontraron articulos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && (
        <p className="text-center text-sm text-neutral-500">
          Cargando articulos...
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-500">
          Pagina {page} de {Math.max(totalPages, 1)}
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

export default FormTablaArticulos;
