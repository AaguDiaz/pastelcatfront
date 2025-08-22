export type ProductoTipo = 'torta' | 'bandeja';

export interface Cliente {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen?: string;
  tamanio?: string;
  tipo: ProductoTipo;          
}

export interface ItemPedido {
  key: string;
  id: number;
  tipo: ProductoTipo;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface PedidoPayload {
  clienteId: number;
  fechaEntrega: string;
  direccionEntrega: string;
  observaciones: string;
  items: {
    productoId: number;
    cantidad: number;
    precio: number;
  }[];
  total: number;
}