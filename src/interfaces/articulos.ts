export interface Categoria {
  id_categoria: number;
  nombre: string;
}

export interface Articulo {
  id_articulo: number;
  nombre: string;
  id_categoria: number;
  reutilizable: boolean;
  color: string | null;
  tamanio: string | null;
  stock_total: number;
  stock_disponible: number;
  costo_unitario: string;
  precio_alquiler: number;
}

export interface ArticuloFormState {
  nombre: string;
  color: string;
  tamanio: string;
  id_categoria: string;
  reutilizable: 'si' | 'no' | '';
  costo_unitario: string;
  precio_alquiler: string;
  stock_total: string;
  stock_disponible: string;
}
