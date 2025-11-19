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

export interface ApiPerfil {
  id?: string | null; // user_id (uuid) si tiene cuenta
  id_perfil?: number;
  nombre?: string;
  telefono?: string | null;
  direccion?: string | null;
  dni?: string | null;
  is_active?: boolean;
}

export interface ApiPedido {
  id?: number;
  id_pedido?: number;
  id_perfil?: number;
  nombre?: string; // nombre del cliente aplanado
  cliente?: { id?: number; nombre?: string } | string;
  cliente_nombre?: string;
  perfil?: ApiPerfil | null;
  fecha_entrega?: string;
  total?: number;
  total_final?: number;
  descuento?: number;
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

export interface ApiPedidoCompleto extends ApiPedido {
  cliente?: { id?: number; nombre?: string };
  fecha_creacion?: string;
  created_at?: string;
  total_items?: number;
  total_descuento?: number;
  total_final?: number;
  tipo_entrega?: string;
  direccion_entrega?: string | null;
  pedido_detalles?: ApiPedidoDetalle[];
}
