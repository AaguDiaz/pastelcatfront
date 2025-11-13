export interface Permiso {
  id_permiso: number;
  modulo: string;
  accion: string;
  slug: string;
  created_at?: string | null;
}

export interface Grupo {
  id_grupo: number;
  nombre: string;
  descripcion: string | null;
  created_at?: string | null;
  permisos?: Permiso[];
}

export interface PermisoFormState {
  modulo: string;
  accion: string;
}

export interface GrupoFormState {
  nombre: string;
  descripcion: string;
  permisos: Permiso[];
}

export const PERMISO_MODULOS = [
  { label: 'Usuario', value: 'Usuario' },
  { label: 'Pedidos', value: 'Pedidos' },
  { label: 'Tortas', value: 'Tortas' },
  { label: 'Bandejas', value: 'Bandejas' },
  { label: 'Recetas', value: 'Recetas' },
  { label: 'Materia Prima', value: 'Materia Prima' },
  { label: 'Eventos', value: 'Eventos' },
  { label: 'Articulos', value: 'Articulos' },
  { label: 'Reportes', value: 'Reportes' },
  { label: 'Auditoria', value: 'Auditoria' },
] as const;

export const PERMISO_ACCIONES = [
  { label: 'Ver', value: 'Ver' },
  { label: 'Agregar', value: 'Agregar' },
  { label: 'Modificar', value: 'Modificar' },
  { label: 'Eliminar', value: 'Eliminar' },
] as const;

export type PermisoModuloValue = (typeof PERMISO_MODULOS)[number]['value'];
export type PermisoAccionValue = (typeof PERMISO_ACCIONES)[number]['value'];
