'use client';

import { Beaker, TrendingUp } from 'lucide-react';
import type { jsPDF as JsPDFType } from 'jspdf';
import { MateriaHistorialItem, MateriaResumenItem } from '@/interfaces/auditoria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FormHistorialMateriaPrimaProps = {
  resumen: MateriaResumenItem[];
  historial: MateriaHistorialItem[];
  loadingResumen?: boolean;
  loadingHistorial?: boolean;
  page: number;
  totalPages: number;
  filters: { materiaId: string; search: string; from: string; to: string };
  materiaOptions: { id: number; nombre: string }[];
  onMateriaChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onDateChange: (from: string, to: string) => void;
  onPageChange: (page: number) => void;
};

const formatNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

const FormHistorialMateriaPrima = ({
  resumen,
  historial,
  loadingResumen,
  loadingHistorial,
  page,
  totalPages,
  filters,
  materiaOptions,
  onMateriaChange,
  onSearchChange,
  onDateChange,
  onPageChange,
}: FormHistorialMateriaPrimaProps) => {
  const topChanges = resumen.slice(0, 3);
  const filtersLabel = `${filters.from || '-'} a ${filters.to || '-'}`;
  type JsPDFWithAutoTable = JsPDFType & { lastAutoTable?: { finalY: number } };

  const handleExportPdf = async () => {
    const [{ default: jsPDF }, autoTable] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc: JsPDFWithAutoTable = new jsPDF() as JsPDFWithAutoTable;
    let y = 14;
    doc.setFontSize(16);
    doc.text('Historial de Materia Prima', 14, y);
    doc.setFontSize(10);
    y += 8;
    doc.text(`Rango: ${filtersLabel}`, 14, y);
    y += 8;

    if (topChanges.length) {
      autoTable.default(doc, {
        head: [['Materia', 'Precio ant.', 'Precio act.', 'Variacion', '%', 'Cambios']],
        body: topChanges.map((item) => [
          item.materia ?? `ID ${item.id_materiaprima}`,
          formatNumber(item.precioAnterior),
          formatNumber(item.precioActual),
          formatNumber(item.variacionAbsoluta),
          `${formatNumber(item.variacionPorcentual)}%`,
          item.cambios ?? 0,
        ]),
        startY: y,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [244, 241, 235] },
      });
      y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 8;
    }

    autoTable.default(doc, {
      head: [['Materia', 'Fecha', 'Cantidad', 'Precio ant.', 'Precio act.', 'Unidad']],
      body: historial.map((item) => [
        item.materia ?? `ID ${item.id_materiaprima}`,
        formatDate(item.fechacambio),
        formatNumber(item.cantidad),
        formatNumber(item.precio_anterior),
        formatNumber(item.precio_actual),
        item.unidadmedida || '-',
      ]),
      startY: y,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [243, 206, 214] },
    });

    doc.save(`auditoria-materias-${Date.now()}.pdf`);
  };

  return (
    <section className="space-y-6 rounded-3xl border border-neutral-200 bg-pastel-cream p-6 shadow-xl">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-neutral-500">Materia prima</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 shadow-md">
              <Beaker className="h-6 w-6 text-neutral-800" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Historial de cambios
              </h2>
              <p className="text-sm text-neutral-600">
                Variaciones de precio y cantidad, con filtros por fecha y materia.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {topChanges.length ? (
          topChanges.map((item, idx) => (
            <div
              key={item.id_materiaprima}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">#{idx + 1} mas cambiada</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {item.materia ?? `ID ${item.id_materiaprima}`}
                  </p>
                </div>
                <div className="rounded-full bg-pastel-cream p-2 text-neutral-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                Precio anterior: ${formatNumber(item.precioAnterior)}
              </p>
              <p className="text-sm text-neutral-600">
                Precio actual: ${formatNumber(item.precioActual)}
              </p>
              <p className="text-sm text-neutral-600">
                Variacion precio: {formatNumber(item.variacionAbsoluta)} ({formatNumber(item.variacionPorcentual)}%)
              </p>
              <p className="text-xs text-neutral-500">Cambios: {item.cambios ?? 0}</p>
            </div>
          ))
        ) : (
          <div className="md:col-span-3 rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-neutral-500">
            {loadingResumen ? 'Cargando resumen...' : 'Sin datos de resumen disponibles.'}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">Movimientos</h3>
            <p className="text-sm text-neutral-600">
              Registro de actualizaciones de stock y precio.
            </p>
          </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select value={filters.materiaId} onValueChange={onMateriaChange}>
              <SelectTrigger className="md:w-64">
                <SelectValue placeholder="Todas las materias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {materiaOptions.map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    {opt.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Buscar por nombre..."
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="md:w-64"
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => onDateChange(e.target.value, filters.to)}
                className="w-36"
              />
              <span className="text-neutral-500">-</span>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => onDateChange(filters.from, e.target.value)}
                className="w-36"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-pastel-beige text-neutral-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Materia</th>
                <th className="px-4 py-2 text-left font-medium">Fecha</th>
                <th className="px-4 py-2 text-left font-medium">Cantidad</th>
                <th className="px-4 py-2 text-left font-medium">Precio anterior</th>
                <th className="px-4 py-2 text-left font-medium">Precio actual</th>
                <th className="px-4 py-2 text-left font-medium">Unidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {historial.map((item) => (
                <tr key={`${item.id}-${item.fechacambio}`}>
                  <td className="px-4 py-3 font-medium">
                    {item.materia ?? `ID ${item.id_materiaprima}`}
                  </td>
                  <td className="px-4 py-3">{formatDate(item.fechacambio)}</td>
                  <td className="px-4 py-3">{formatNumber(item.cantidad)}</td>
                  <td className="px-4 py-3">${formatNumber(item.precio_anterior)}</td>
                  <td className="px-4 py-3">${formatNumber(item.precio_actual)}</td>
                  <td className="px-4 py-3">{item.unidadmedida}</td>
                </tr>
              ))}
              {!historial.length && !loadingHistorial && (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-500" colSpan={6}>
                    No hay movimientos registrados.
                  </td>
                </tr>
              )}
              {loadingHistorial && (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-500" colSpan={6}>
                    Cargando historial...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-pastel-blue text-black hover:bg-blue-400"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
            <Button
              type="button"
              className="bg-pastel-yellow text-black hover:bg-yellow-400"
              onClick={handleExportPdf}
              disabled={loadingHistorial && !historial.length}
            >
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      
    </section>
  );
};

export default FormHistorialMateriaPrima;
