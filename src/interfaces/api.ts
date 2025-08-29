export interface ApiTorta {
    id_torta: number;
    nombre: string;
    tamanio: string;
}

export interface ApiIngrediente {
    id_materiaprima: number;
    nombre: string;
}

export interface ApiReceta {
    id_receta: number;
    torta: ApiTorta;
    porciones: number;
}

export interface ApiRecetaIngrediente {
    id: number;
    ingrediente: string;
    cantidad: number;
    unidad: string;
    precio: number;
}

export interface ApiPedido {
    id?: number;
    id_pedido?: number;
    nombre?: string; // nombre del cliente aplanado
    cliente?: { id?: number; nombre?: string } | string;
    cliente_nombre?: string;
    fecha_entrega?: string;
    total?: number;
    total_final?: number;
    observaciones?: string | null;
    estado?: string | { estado: string };
    [key: string]: unknown;
}

export interface ApiTortaExtended extends ApiTorta {
  id?: number;
  precio?: number;
  imagen?: string | null;
}

export interface ApiBandeja {
  id?: number;
  id_bandeja?: number;
  nombre?: string;
  precio?: number;
  imagen?: string | null;
  tamanio?: string;
}

export interface ApiPedidoDetalle {
  id_torta?: number;
  id_bandeja?: number;
  cantidad?: number;
  precio_unitario?: number;
  precio?: number;
  nombre?: string;
  torta?: ApiTortaExtended;
  bandeja?: ApiBandeja;
}

export interface ApiPedidoCompleto {
  id?: number;
  id_pedido?: number;
  id_cliente?: number;
  cliente?: { id?: number; nombre?: string };
  nombre?: string;
  fecha_entrega?: string;
  fecha_creacion?: string;
  created_at?: string;
  total_items?: number;
  total_descuento?: number;
  total_final?: number;
  observaciones?: string | null;
  tipo_entrega?: string;
  direccion_entrega?: string | null;
  estado?: string | { estado: string };
  pedido_detalles?: ApiPedidoDetalle[];
}
