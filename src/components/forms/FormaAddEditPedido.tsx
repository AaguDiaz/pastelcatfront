'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePedidoOrEventoData } from '@/hooks/usePedidoOrEventoData';
import { Cliente, Producto, ItemPedido, PedidoPayload, ProductoTipo } from '@/interfaces/pedidos';
import ClienteModal from '../modals/cliente';
import ProductosModal from '../modals/producto';
import ModalError from '../modals/error';

interface AddEditPedidosProps {
  items: ItemPedido[];
  onAddItem: (item: Producto) => void;
  onUpdateItemQuantity: (key: string, qty: number) => void;
  onRemoveItem: (key: string) => void;
  onClearItems: () => void;
  onReplaceItems?: (items: ItemPedido[]) => void;
  mode?: 'pedido' | 'evento';
  contextLabel?: string;
  allowedProductTypes?: ProductoTipo[];
}

const DEFAULT_TYPES: Record<'pedido' | 'evento', ProductoTipo[]> = {
  pedido: ['torta', 'bandeja'],
  evento: ['torta', 'bandeja', 'articulo'],
};

export default function AddEditPedidos({
  items,
  onAddItem,
  onUpdateItemQuantity,
  onRemoveItem,
  onClearItems,
  onReplaceItems,
  mode = 'pedido',
  contextLabel,
  allowedProductTypes,
}: AddEditPedidosProps) {
  const dataContext = usePedidoOrEventoData(mode);
  const {
    clienteSearch,
    setClienteSearch,
    clientes,
    nextClientes,
    prevClientes,
    clientePage,
    hasMoreClientes,
    productoSearch,
    setProductoSearch,
    tipoProducto,
    setTipoProducto,
    productos,
    nextProductos,
    prevProductos,
    productoPage,
    hasMoreProductos,
    confirmarPedido,
    updatePedido,
    clearEdit,
    isEditing,
    editDraft,
  } = dataContext;

  const label = contextLabel ?? (mode === 'evento' ? 'Evento' : 'Pedido');
  const labelLower = label.toLowerCase();
  const allowedTypes = allowedProductTypes ?? DEFAULT_TYPES[mode];
  const allowArticulos = allowedTypes.includes('articulo');

  const [clienteModal, setClienteModal] = useState(false);
  const [productoModal, setProductoModal] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [descuento, setDescuento] = useState('0');
  type TipoEntrega =
    '' | 'retiro' | 'envio_casa_cliente' | 'envio_otra_direccion';
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );
  const descuentoNumber = Math.min(Math.max(0, Number(descuento) || 0), subtotal);
  const total = Math.max(subtotal - descuentoNumber, 0);

  const handleAddCliente = (c: Cliente) => {
    setCliente(c);
    setClienteModal(false);
  };

  const toDatetimeLocal = (value?: string | null): string => {
    if (!value) return '';
    const candidate = value.includes('T') ? value : value.replace(' ', 'T');
    const d = new Date(candidate);
    if (Number.isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return local;
  };

  const initDraftIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isEditing || !editDraft) return;
    if (initDraftIdRef.current === editDraft.id) return;
    initDraftIdRef.current = editDraft.id;
    setCliente(editDraft.cliente);
    setFechaEntrega(toDatetimeLocal(editDraft.fecha_entrega) || '');
    setTipoEntrega(editDraft.tipo_entrega || '');
    setDireccionEntrega(editDraft.direccion_entrega || '');
    setObservaciones(editDraft.observaciones || '');
    setDescuento(String(editDraft.total_descuento ?? 0));
    if (onReplaceItems) {
      onReplaceItems(editDraft.items);
    }
  }, [isEditing, editDraft, onReplaceItems]);

  useEffect(() => {
    if (!isEditing) {
      initDraftIdRef.current = null;
      setDescuento('0');
    }
  }, [isEditing]);

  const handleAddProducto = (p: Producto) => {
    onAddItem(p);
    setProductoModal(false);
  };

  const handleConfirm = async () => {
    if (!cliente) return setErrorMsg(`Seleccione un cliente`);
    if (!fechaEntrega) return setErrorMsg(`Seleccione la fecha de entrega`);
    if (!tipoEntrega) return setErrorMsg(`Seleccione el método de entrega`);
    if (items.length === 0) return setErrorMsg(`Agregue al menos un producto`);

    const perfilId = Number(cliente.id_perfil ?? cliente.id ?? 0);
    if (!perfilId) return setErrorMsg('El cliente seleccionado no tiene un perfil válido');

    const tortas = items
      .filter((i) => i.tipo === 'torta')
      .map((i) => ({
        id_torta: Number(i.productoId ?? i.id),
        cantidad: i.cantidad,
        precio_unitario: i.precio,
      }));

    const bandejas = items
      .filter((i) => i.tipo === 'bandeja')
      .map((i) => ({
        id_bandeja: Number(i.productoId ?? i.id),
        cantidad: i.cantidad,
        precio_unitario: i.precio,
      }));

    const articulos = items
      .filter((i) => i.tipo === 'articulo')
      .map((i) => ({
        id_articulo: Number(i.productoId ?? i.id),
        cantidad: i.cantidad,
        precio_unitario: i.precio,
      }));

    const payload: PedidoPayload = {
      id_perfil: perfilId,
      fecha_entrega: fechaEntrega,
      tipo_entrega: tipoEntrega,
      direccion_entrega: direccionEntrega || null,
      observaciones: observaciones || null,
      tortas,
      bandejas,
      articulos,
      descuento: descuentoNumber,
    };

    try {
      if (isEditing && editDraft) {
        await updatePedido(editDraft.id, payload);
      } else {
        await confirmarPedido(payload);
      }

      onClearItems();
      clearEdit();
      setCliente(null);
      setFechaEntrega('');
      setDireccionEntrega('');
      setObservaciones('');
      setTipoEntrega('');
      setDescuento('0');
    } catch {
      setErrorMsg(
        isEditing
          ? `Error al editar el ${labelLower}. Intente nuevamente.`
          : `Error al confirmar el ${labelLower}. Intente nuevamente.`,
      );
    }
  };

  return (
    <div className="p-6 bg-pastel-cream rounded-2xl shadow-2xl space-y-6">
      <h2 className="text-2xl font-semibold mb-4">
        {isEditing ? `Editar ${labelLower}` : `Agregar ${label}`}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Cliente</label>
            <Input placeholder="Ej: Juan Pérez" readOnly value={cliente?.nombre ?? ''} />
          </div>
          <div className="flex mt-5">
            <Button
              type="button"
              onClick={() => setClienteModal(true)}
              className="bg-pastel-blue hover:bg-blue-400"
            >
              Buscar cliente
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Fecha de entrega</label>
          <Input
            type="datetime-local"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Método de entrega</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={tipoEntrega}
            onChange={(e) => setTipoEntrega(e.target.value as TipoEntrega)}
          >
            <option value="">Seleccionar...</option>
            <option value="retiro">Retiro</option>
            <option value="envio_casa_cliente">Envío a casa del cliente</option>
            <option value="envio_otra_direccion">Envío a otra dirección</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {tipoEntrega !== 'retiro' && (
          <div>
            <label className="block text-sm font-medium">Dirección de entrega</label>
            <Input
              type="text"
              value={direccionEntrega}
              onChange={(e) => setDireccionEntrega(e.target.value)}
              placeholder="Ej: Calle Falsa 123, Ciudad"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Observaciones</label>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder={`Notas adicionales sobre el ${labelLower}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Descuento</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            placeholder="Ej: 100"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            className="bg-pastel-blue hover:bg-blue-400"
            onClick={() => setProductoModal(true)}
          >
            Agregar productos
          </Button>
        </div>
      </div>
      <h3 className="text-lg font-semibold mt-6 mb-2">Productos en {labelLower}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Nombre</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Precio</th>
              <th className="p-2">Cantidad</th>
              <th className="p-2">Subtotal</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key} className="border-t">
                <td className="p-2">{item.nombre}</td>
                <td className="p-2 capitalize">{item.tipo}</td>
                <td className="p-2">${item.precio.toFixed(2)}</td>
                <td className="p-2">
                  <Input
                    type="number"
                    min={1}
                    max={item.stockDisponible ?? undefined}
                    value={item.cantidad}
                    onChange={(e) =>
                      onUpdateItemQuantity(
                        item.key,
                        Math.max(1, parseInt(e.target.value, 10) || 1),
                      )
                    }
                    className="w-20"
                  />
                </td>
                <td className="p-2">${(item.precio * item.cantidad).toFixed(2)}</td>
                <td className="p-2">
                  <Button
                    type="button"
                    className="bg-pastel-red hover:bg-red-400"
                    onClick={() => onRemoveItem(item.key)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-right space-y-1">
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          <div>Descuento: -${descuentoNumber.toFixed(2)}</div>
          <div className="font-semibold">Total: ${total.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" onClick={handleConfirm} className="bg-pastel-blue hover:bg-blue-400">
          {isEditing ? `Editar ${labelLower}` : `Confirmar ${labelLower}`}
        </Button>
        <Button onClick={onClearItems} className="bg-pastel-yellow hover:bg-yellow-400">
          Limpiar tabla
        </Button>
      </div>

      <ClienteModal
        open={clienteModal}
        onClose={() => setClienteModal(false)}
        clientes={clientes}
        search={clienteSearch}
        setSearch={setClienteSearch}
        page={clientePage}
        next={nextClientes}
        prev={prevClientes}
        hasMore={hasMoreClientes}
        onSelect={handleAddCliente}
      />

      <ProductosModal
        open={productoModal}
        onClose={() => setProductoModal(false)}
        productos={productos.filter((p) => allowedTypes.includes(p.tipo))}
        search={productoSearch}
        setSearch={setProductoSearch}
        tipo={tipoProducto}
        setTipo={setTipoProducto}
        page={productoPage}
        next={nextProductos}
        prev={prevProductos}
        hasMore={hasMoreProductos}
        onAdd={handleAddProducto}
        allowArticulos={allowArticulos}
      />

      {errorMsg && (
        <ModalError
          titulo="Error"
          mensaje={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}
    </div>
  );
}
