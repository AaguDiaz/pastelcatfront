import type { Pedido, PedidoPayload, ItemPedido } from './pedidos';
import type { ApiPedido, ApiPedidoDetalle } from './api';

export interface Evento extends Pedido {
  id_evento?: number;
}

export interface EventoPayload extends PedidoPayload {
  id_evento?: number;
}

export interface EventoItem extends ItemPedido {
  id_evento_detalle?: number;
}

export interface ApiEventoArticulo {
  id?: number;
  id_articulo?: number;
  nombre?: string;
  precio?: number;
  precio_alquiler?: number;
  costo_unitario?: number;
  imagen?: string | null;
  tamanio?: string | null;
  color?: string | null;
  stock_total?: number | null;
  stock_disponible?: number | null;
  id_categoria?: number | null;
  categoria_nombre?: string | null;
}

export interface ApiEventoDetalle extends ApiPedidoDetalle {
  id_articulo?: number;
  articulo?: ApiEventoArticulo;
}

export interface ApiEvento extends ApiPedido {
  id_evento?: number;
  lista_evento?: ApiEventoDetalle[];
}

export interface ApiEventoCompleto extends ApiEvento {
  lista_evento?: ApiEventoDetalle[];
}
