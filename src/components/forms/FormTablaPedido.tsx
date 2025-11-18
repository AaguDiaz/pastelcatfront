'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, RefreshCcw, Eye, Trash2 } from 'lucide-react';
import { usePedidoOrEventoData } from '@/hooks/usePedidoOrEventoData';
import EstadoPedidoModal from '@/components/modals/pedido/EstadoPedidoModal';
import DetallePedidoModal from '@/components/modals/pedido/DetallePedidoModal';
import EliminarModal from '@/components/modals/eliminar';
import ModalError from '@/components/modals/error';
import ModalExito from '@/components/modals/exito';

interface FormTablaPedidoProps {
  mode?: 'pedido' | 'evento';
  contextLabel?: string;
}

export default function FormTablaPedido({
  mode = 'pedido',
  contextLabel,
}: FormTablaPedidoProps) {
  const dataContext = usePedidoOrEventoData(mode);
  const {
    pedidos,
    startEditPedido,
    loadPedidos,
    updatePedidoEstado,
    deletePedido,
    pedidosTotalPages,
    pedidosCurrentPage,
  } = dataContext;

  const label = contextLabel ?? (mode === 'evento' ? 'Evento' : 'Pedido');
  const labelLower = label.toLowerCase();
  const labelPlural = `${labelLower}${labelLower.endsWith('o') ? 's' : ''}`;
  const labelPluralTitle = labelPlural.charAt(0).toUpperCase() + labelPlural.slice(1);

  const [searchId, setSearchId] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [estadoModalFor, setEstadoModalFor] = useState<{ id: number; estado: string } | null>(null);
  const [detalleModalFor, setDetalleModalFor] = useState<number | null>(null);
  const [eliminarModalFor, setEliminarModalFor] = useState<{ id: number; nombre: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPedidos({ page: 1, estado: null });
  }, [loadPedidos]);

  useEffect(() => {
    const estado = estadoFilter === 'todos' ? null : estadoFilter;
    loadPedidos({ page, estado });
  }, [page, estadoFilter, loadPedidos]);

  const filtered = useMemo(() => {
    return pedidos.filter((p) => {
      const matchId = searchId ? p.id.toString().includes(searchId) : true;
      return matchId;
    });
  }, [pedidos, searchId]);

  const totalPages = Math.max(1, Number(pedidosTotalPages || 1));
  const currentPage = Math.max(1, Number(pedidosCurrentPage || page));
  const paginated = filtered;

  const handleEdit = async (id: number) => {
    await startEditPedido(id);
  };
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error?.message) return parsed.error.message as string;
        if (typeof parsed?.error === 'string') return parsed.error;
      } catch {
        // ignore parse errors
      }
      return err.message;
    }
    if (typeof err === 'string') return err;
    return 'Ocurrió un error. Intente nuevamente.';
  };

  const handleChangeEstado = (id: number, estado: string) => {
    const current = String(estado || '').toLowerCase();
    if (mode === 'evento' && current === 'cerrado') {
      setErrorMsg('No se puede modificar un evento cerrado.');
      return;
    }
    setEstadoModalFor({ id, estado });
  };
  const handleVerDetalles = (id: number) => {
    setDetalleModalFor(id);
  };
  const handleEliminar = (id: number, nombre: string) => {
    setEliminarModalFor({ id, nombre });
  };

  return (
    <div className="bg-pastel-cream text-black p-6 rounded-2xl shadow-2xl mt-6">
      <h2 className="text-2xl font-semibold mb-4">Tabla de {labelPluralTitle}</h2>

      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={`Buscar por ID de ${labelLower}...`}
            value={searchId}
            onChange={(e) => { setSearchId(e.target.value); setPage(1); }}
            className="max-w-sm"
          />
        </div>
        <div>
          <select
            value={estadoFilter}
            onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
            className="border rounded-md p-2 bg-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cerrado">Cerrado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="border-b">
              <th className="py-2">ID</th>
              <th className="py-2">Cliente</th>
              <th className="py-2">Fecha de entrega</th>
              <th className="py-2">Total</th>
              <th className="py-2">Observaciones</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-3">{p.id}</td>
                  <td className="py-3">{p.cliente.nombre}</td>
                  <td className="py-3">{new Date(p.fecha_entrega).toLocaleDateString()}</td>
                  <td className="py-3">${p.total.toFixed(2)}</td>
                  <td className="py-3">{p.observaciones ?? '-'}</td>
                  <td className="py-3 capitalize">{String(p.estado)}</td>
                  <td className="py-3 flex flex-wrap gap-2">
                    <Button
                      title={`Editar ${labelLower}`}
                      size="sm"
                      className="bg-pastel-blue hover:bg-blue-400"
                      onClick={() => handleEdit(p.id)}
                      disabled={String(p.estado).toLowerCase() !== 'pendiente'}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button
                      title="Cambiar estado"
                      size="sm"
                      className="bg-pastel-green hover:bg-emerald-300 text-black"
                      onClick={() => handleChangeEstado(p.id, String(p.estado))}
                    >
                      <RefreshCcw className="h-4 w-4 mr-1" /> Estado
                    </Button>
                    <Button
                      title="Ver detalle"
                      size="sm"
                      className="bg-pastel-yellow hover:bg-yellow-300 text-black"
                      onClick={() => handleVerDetalles(p.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver detalle
                    </Button>
                    <Button
                      title={`Eliminar ${labelLower}`}
                      size="sm"
                      className="bg-pastel-red hover:bg-red-400"
                      onClick={() => handleEliminar(p.id, p.cliente.nombre)}
                      disabled={String(p.estado).toLowerCase() !== 'pendiente'}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-neutral-500">
                  No se encontraron {labelPlural}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
        <p className="text-sm text-neutral-500">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="bg-pastel-blue text-black hover:bg-blue-400"
            onClick={() => setPage((prevPage) => Math.max(1, prevPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bg-pastel-blue text-black hover:bg-blue-400"
            onClick={() => setPage((prevPage) => Math.min(totalPages, prevPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {estadoModalFor && (
        <EstadoPedidoModal
          open
          estadoActual={estadoModalFor.estado}
          onClose={() => setEstadoModalFor(null)}
          onSubmit={async (nuevoEstado) => {
            const mapLabelToId: Record<string, number> = {
              pendiente: 1,
              confirmado: 2,
              cerrado: 3,
              cancelado: 4,
            };
            const idEstado = mapLabelToId[nuevoEstado as keyof typeof mapLabelToId];
            if (!idEstado) {
              setErrorMsg('Estado inválido');
              return;
            }
            try {
              await updatePedidoEstado(estadoModalFor.id, idEstado);
              setSuccessMsg(`El estado del ${labelLower} se actualizó correctamente.`);
              setEstadoModalFor(null);
            } catch (err) {
              setErrorMsg(getErrorMessage(err));
            }
          }}
        />
      )}

      {detalleModalFor && (
        <DetallePedidoModal
          open
          mode={mode}
          contextLabel={label}
          pedidoId={detalleModalFor}
          onClose={() => setDetalleModalFor(null)}
        />
      )}

      {eliminarModalFor && (
        <EliminarModal
          nombre={eliminarModalFor.nombre}
          contexto={labelPlural}
          mensaje={`Esta acción eliminará el ${labelLower}. ¿Desea continuar?`}
          onClose={async (respuesta) => {
            if (respuesta) {
              try {
                await deletePedido(eliminarModalFor.id);
                setSuccessMsg(`El ${labelLower} se eliminó correctamente.`);
              } catch (err) {
                setErrorMsg(getErrorMessage(err));
              }
            }
            setEliminarModalFor(null);
          }}
        />
      )}

      {errorMsg && (
        <ModalError
          titulo="Error"
          mensaje={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}
      {successMsg && (
        <ModalExito
          titulo="Operación exitosa"
          mensaje={successMsg}
          onClose={() => setSuccessMsg(null)}
        />
      )}
    </div>
  );
}
