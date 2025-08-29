'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, RefreshCcw, Eye, Trash2 } from 'lucide-react';
import { usePedidoDataCtx } from '@/context/PedidoDataContext';
import EstadoPedidoModal from '@/components/modals/pedido/EstadoPedidoModal';
import DetallePedidoModal from '@/components/modals/pedido/DetallePedidoModal';
import EliminarModal from '@/components/modals/eliminar';
import ModalError from '@/components/modals/error';

export default function FormTablaPedido() {
  const { pedidos, startEditPedido, loadPedidos, updatePedidoEstado, deletePedido, pedidosTotalPages, pedidosCurrentPage } = usePedidoDataCtx();
  const [searchId, setSearchId] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [estadoModalFor, setEstadoModalFor] = useState<{ id: number; estado: string } | null>(null);
  const [detalleModalFor, setDetalleModalFor] = useState<number | null>(null);
  const [eliminarModalFor, setEliminarModalFor] = useState<{ id: number; nombre: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Asegura que se carguen los pedidos al montar la tabla
  useEffect(() => {
    loadPedidos({ page: 1, estado: null });
  }, [loadPedidos]);

  // Re-cargar cuando cambian página o estado
  useEffect(() => {
    const estado = estadoFilter === 'todos' ? null : estadoFilter;
    loadPedidos({ page, estado });
  }, [page, estadoFilter, loadPedidos]);

  const filtered = useMemo(() => {
    return pedidos.filter(p => {
      const matchId = searchId ? p.id.toString().includes(searchId) : true;
      return matchId; // estado ya viene filtrado por backend
    });
  }, [pedidos, searchId]);

  const totalPages = Math.max(1, Number(pedidosTotalPages || 1));
  const currentPage = Math.max(1, Number(pedidosCurrentPage || page));
  const paginated = filtered; // ya viene paginado desde backend

  const handleEdit = async (id: number) => {
    await startEditPedido(id);
  };
  const handleChangeEstado = (id: number, estado: string) => {
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
      <h2 className="text-2xl font-semibold mb-4">Tabla de pedidos</h2>

      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar por ID de pedido..."
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
            <option value="confirmar">Confirmar</option>
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
                    {p.estado === 'pendiente' && (
                      <>
                        <Button title="Editar pedido" size="sm" className="bg-pastel-blue hover:bg-blue-400" onClick={() => handleEdit(p.id)}>
                          <Pencil size={16} /> Editar
                        </Button>
                        <Button title="Cambiar estado" size="sm" className="bg-pastel-green hover:bg-green-400" onClick={() => handleChangeEstado(p.id, p.estado)}>
                          <RefreshCcw size={16} /> Cambiar estado
                        </Button>
                        <Button title="Ver detalles" size="sm" className="bg-pastel-yellow hover:bg-yellow-400" onClick={() => handleVerDetalles(p.id)}>
                          <Eye size={16} /> Ver detalles
                        </Button>
                        <Button title="Eliminar" size="sm" className="bg-pastel-red hover:bg-red-400" onClick={() => handleEliminar(p.id, p.cliente.nombre || `Pedido #${p.id}`)}>
                          <Trash2 size={16} /> Eliminar
                        </Button>
                      </>
                    )}
                    {(p.estado === 'confirmar' || p.estado === 'confirmado') && (
                      <>
                        <Button title="Ver detalles" size="sm" className="bg-pastel-yellow hover:bg-yellow-400" onClick={() => handleVerDetalles(p.id)}>
                          <Eye size={16} /> Ver detalles
                        </Button>
                        <Button title="Cambiar estado" size="sm" className="bg-pastel-green hover:bg-green-400" onClick={() => handleChangeEstado(p.id, p.estado)}>
                          <RefreshCcw size={16} /> Cambiar estado
                        </Button>
                      </>
                    )}
                    {p.estado !== 'pendiente' && p.estado !== 'confirmar' && p.estado !== 'confirmado' && (
                      <Button title="Ver detalles" size="sm" className="bg-pastel-yellow hover:bg-yellow-400" onClick={() => handleVerDetalles(p.id)}>
                        <Eye size={16} /> Ver detalles
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No se encontraron pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center gap-4 mt-4">
        <Button
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="bg-pastel-blue hover:bg-blue-400"
        >
          Anterior
        </Button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <Button
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="bg-pastel-blue hover:bg-blue-400"
        >
          Siguiente
        </Button>
      </div>
      {/* Modales */}
    {estadoModalFor && (
      <EstadoPedidoModal
        open={true}
        estadoActual={estadoModalFor.estado}
        onClose={() => setEstadoModalFor(null)}
        onSubmit={async (nuevo) => {
          try {
            const map: Record<string, number> = { pendiente: 1, confirmado: 2, cerrado: 3, cancelado: 4 };
            const idEstado = map[String(nuevo).toLowerCase().trim()] ?? 1;
            await updatePedidoEstado(estadoModalFor.id, idEstado);
            await loadPedidos({ page, estado: estadoFilter === 'todos' ? null : estadoFilter });
          } catch (e: unknown) {
            // Muestra el error al usuario en lugar de romper la UI
            try {
              let msg = 'Error al cambiar estado';
              if (
                typeof e === 'object' &&
                e !== null &&
                'message' in e &&
                typeof (e as { message?: unknown }).message === 'string'
              ) {
                const message = (e as { message: string }).message;
                try {
                  msg = JSON.parse(message)?.error || message;
                } catch {
                  msg = message;
                }
              }
              setErrorMsg(msg);
            } catch {
              setErrorMsg('Error al cambiar estado');
            }
            throw e; // mantiene la promesa rechazada para que el modal no cierre
          }
        }}
      />
    )}
    {detalleModalFor !== null && (
      <DetallePedidoModal
        open={true}
        pedidoId={detalleModalFor}
        onClose={() => setDetalleModalFor(null)}
      />
    )}
    {errorMsg && (
      <ModalError titulo="Error" mensaje={errorMsg} onClose={() => setErrorMsg(null)} />
    )}
    {eliminarModalFor && (
      <EliminarModal
        nombre={eliminarModalFor.nombre}
        contexto={'pedidos'}
        onClose={async (confirmed) => {
          setEliminarModalFor(null);
          if (confirmed) {
            await deletePedido(eliminarModalFor.id);
            await loadPedidos({ page, estado: estadoFilter === 'todos' ? null : estadoFilter });
          }
        }}
      />
    )}
    </div>
    
    );
  }
