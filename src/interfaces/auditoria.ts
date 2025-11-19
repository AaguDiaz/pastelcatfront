export type AuthEventKind =
  | 'LOGIN'
  | 'USER_LOGOUT'
  | 'SIGNUP'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED'
  | 'MFA_CHALLENGE'
  | 'login'
  | 'logout'
  | string;

export interface AuthEvent {
  id: string | number;
  type?: AuthEventKind;
  createdAt?: string;
  userId?: string | number | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  ip?: string | null;
  location?: string | null;
  userAgent?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuthUsageSummary {
  range?: { startDate?: string; endDate?: string };
  totals?: {
    events?: number;
    logins?: number;
    logouts?: number;
    scannedEvents?: number;
    maxEvents?: number;
  };
  uniqueUsers?: number;
  timeline?: {
    date: string;
    total?: number;
    logins?: number;
    logouts?: number;
    signups?: number;
  }[];
  topUsers?: {
    userId?: string | number | null;
    perfilId?: number | null;
    name?: string | null;
    email?: string | null;
    logins?: number;
    logouts?: number;
    total?: number;
    firstEventAt?: string | null;
    lastEventAt?: string | null;
    isActive?: boolean;
  }[];
}

export interface MateriaHistorialItem {
  id: number;
  id_materiaprima: number;
  materia?: string | null;
  cantidad: number;
  precio_anterior: number;
  precio_actual?: number;
  unidadmedida: string;
  fechacambio: string;
}

export interface MateriaResumenItem {
  id_materiaprima: number;
  materia?: string | null;
  cambios: number;
  precioAnterior?: number;
  precioActual?: number;
  variacionAbsoluta?: number;
  variacionPorcentual?: number;
}

export interface PagedResult<T> {
  data?: T[];
  totalPages?: number;
  currentPage?: number;
  totalItems?: number;
}
