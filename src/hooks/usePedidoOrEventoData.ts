import { useContext } from 'react';
import { PedidoDataContext } from '@/context/PedidoDataContext';
import { EventoDataContext } from '@/context/EventoDataContext';

type Mode = 'pedido' | 'evento';

export function usePedidoOrEventoData(mode: Mode = 'pedido') {
  const pedidoCtx = useContext(PedidoDataContext);
  const eventoCtx = useContext(EventoDataContext);

  if (mode === 'evento') {
    if (!eventoCtx) {
      throw new Error('El contexto de eventos no está disponible. Envuelve el componente con <EventoDataProvider>.');
    }
    return eventoCtx;
  }

  if (!pedidoCtx) {
    throw new Error('El contexto de pedidos no está disponible. Envuelve el componente con <PedidoDataProvider>.');
  }
  return pedidoCtx;
}
