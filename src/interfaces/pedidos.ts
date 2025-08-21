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
  tipo: ProductoTipo;          
  nombre: string;
  precio: number;
  cantidad: number;
}