export type UsuarioGrupo = 'administrador' | 'cliente';

export interface Usuario {
  id_perfil: number;
  user_id: string | null;
  nombre: string;
  dni: string;
  telefono?: string | null;
  direccion?: string | null;
  email?: string | null;
  is_active: boolean;
  has_account: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UsuarioFormState {
  nombre: string;
  dni: string;
  telefono: string;
  direccion: string;
  email: string;
  grupo: UsuarioGrupo;
}

export type UsuarioFilter = 'activos' | 'inactivos' | 'todos';
