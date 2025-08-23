'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import usePedidoData from '@/hooks/usePedidoData';
import { Cliente, Producto, ItemPedido, PedidoPayload } from '@/interfaces/pedidos';
import ClienteModal from '../modals/cliente';
import ProductosModal from '../modals/producto';
import ModalError from '../modals/error';

interface AddEditPedidosProps {
  items: ItemPedido[];
  onAddItem: (item: Producto) => void;
  onUpdateItemQuantity: (key: string, qty: number) => void; // <- antes id:number
  onRemoveItem: (key: string) => void;                      // <- antes id:number
  onClearItems: () => void;
}

export default function AddEditPedidos({
  items,
  onAddItem,
  onUpdateItemQuantity,
  onRemoveItem,
  onClearItems,
}: AddEditPedidosProps) {
  const [clienteModal, setClienteModal] = useState(false);
  const [productoModal, setProductoModal] = useState(false);

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
  } = usePedidoData();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [observaciones, setObservaciones] = useState('');
  type TipoEntrega =
      | ''
      | 'retiro'
      | 'envio_casa_cliente'
      | 'envio_otra_direccion';
    const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = items.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  );

  const handleAddCliente = (c: Cliente) => {
    setCliente(c);
    setClienteModal(false);
  };

   const handleAddProducto = (p: Producto) => {
    onAddItem(p);
    setProductoModal(false);
  };

  const handleConfirm = async () => {
  if (!cliente) return setErrorMsg('Seleccione un cliente');
  if (!fechaEntrega) return setErrorMsg('Seleccione la fecha de entrega');
  if (!tipoEntrega) return setErrorMsg('Seleccione el método de entrega');
  if (items.length === 0) return setErrorMsg('Agregue al menos un producto');

   const tortas = items
      .filter((i) => i.tipo === 'torta')
      .map((i) => {
        const id = Number(i.productoId ?? i.id);
        if (!id) {
        }
        return {
          id_torta: id,
          cantidad: i.cantidad,
          precio_unitario: i.precio,
        };
      });

    const bandejas = items
      .filter((i) => i.tipo === 'bandeja')
      .map((i) => {
        const id = Number(i.productoId ?? i.id);
        if (!id) {
        }
        return {
          id_bandeja: id,
          cantidad: i.cantidad,
          precio_unitario: i.precio,
        };
      });

    const payload: PedidoPayload = {
      id_cliente: cliente.id,
      fecha_entrega: fechaEntrega,
      tipo_entrega: tipoEntrega,
      direccion_entrega: direccionEntrega || null,
      observaciones: observaciones || null,
      tortas,
      bandejas,
    };
  try {
    await confirmarPedido(payload);
    onClearItems();
    setCliente(null);
    setFechaEntrega('');
    setDireccionEntrega('');
    setObservaciones('');
    setTipoEntrega('retiro');
  } catch (e) {
    setErrorMsg('Error al confirmar el pedido. Intente nuevamente.');
  }
};

  return (
    <div className="p-6 bg-pastel-cream rounded-2xl shadow-2xl space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Agregar Pedido</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">
              Cliente
            </label>
            <Input placeholder='Ej: Juan Perez' readOnly value={cliente?.nombre ?? ''} />
          </div>
          <div className='flex mt-5'>
            <Button
                type="button"
                onClick={() => setClienteModal(true)}
                className="bg-pastel-blue hover:bg-blue-400 "
                >
                Buscar cliente
            </Button>
           </div>
        </div>
        <div>
          <label className="block text-sm font-medium">
            Fecha de entrega
          </label>
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
            onChange={(e) => {
              const val = e.target.value as TipoEntrega;
              setTipoEntrega(val);
              if (val !== 'envio_otra_direccion') {
                setDireccionEntrega('');
              }
            }}
          >
            <option value="">Seleccionar…</option>
            <option value="retiro">Retiro</option>
            <option value="envio_casa_cliente">Envío - Casa cliente</option>
            <option value="envio_otra_direccion">Envío - Otra dirección</option>
          </select>
        </div>
        {tipoEntrega === 'envio_otra_direccion' && (
          <div>
            <label className="block text-sm font-medium">
              Dirección de entrega
            </label>
            <Input
              type="text"
              value={direccionEntrega}
              onChange={(e) => setDireccionEntrega(e.target.value)}
              placeholder='Ej: Calle Falsa 123, Ciudad'
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">
            Observaciones
          </label>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales sobre el pedido"
          />
        </div>
          <Button
            type="button"
            className="bg-pastel-blue hover:bg-blue-400 mt-5"
            onClick={() => setProductoModal(true)}
            >
            Agregar tortas o bandejas
          </Button>
      </div>  
      <h3 className="text-lg font-semibold mt-6 mb-2">Productos en pedido</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2 ">Nombre</th>
              <th className="p-2">Precio</th>
              <th className="p-2 ">Cantidad</th>
              <th className="p-2">Subtotal</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
            <tbody>
                {items.map((item) => (
                    <tr key={item.key} className="border-t">
                    <td className="p-2">{item.nombre}</td>
                    <td className="p-2">${item.precio.toFixed(2)}</td>
                    <td className="p-2">
                        <Input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) =>
                            onUpdateItemQuantity(
                            item.key,
                            Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                        }
                        className="w-20"
                        />
                    </td>
                    <td className="p-2">${(item.precio * item.cantidad).toFixed(2)}</td>
                    <td className="p-2">
                        <Button
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
        <div className="mt-2 text-right font-semibold">
          Total: ${total.toFixed(2)}
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleConfirm} className="bg-pastel-blue hover:bg-blue-400">
          Confirmar pedido
        </Button>
        <Button onClick={onClearItems} className="bg-pastel-yellow hover:bg-yellow-400">
          Limpiar tabla
        </Button>
      </div>

      {/* Modal Cliente */}
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
        productos={productos}
        search={productoSearch}
        setSearch={setProductoSearch}
        tipo={tipoProducto}
        setTipo={setTipoProducto}
        page={productoPage}
        next={nextProductos}
        prev={prevProductos}
        hasMore={hasMoreProductos}
        onAdd={handleAddProducto}
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