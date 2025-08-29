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
  productoId: number;
  id?: number;
  tipo: ProductoTipo;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface PedidoPayload {
  id_cliente: number;
  fecha_entrega: string;
  tipo_entrega: string;
  direccion_entrega: string | null;
  observaciones: string | null;
  tortas: {
    id_torta: number;
    cantidad: number;
  }[];
  bandejas: {
    id_bandeja: number;
    cantidad: number;
  }[];
}

export interface Pedido {
  id: number;
  cliente: Cliente;
  fecha_entrega: string;
  total: number;
  observaciones: string | null;
  estado: string;
}