'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AuthEvent,
  AuthUsageSummary,
  MateriaHistorialItem,
  MateriaResumenItem,
  PagedResult,
} from '@/interfaces/auditoria';
import { api } from '@/lib/api';
import { debugFetch } from '@/lib/debugFetch';

const API_BASE_URL = api;
const PAGE_SIZE = 10;

type AuthFilters = {
  from: string;
  to: string;
  type: 'all' | 'login' | 'logout';
  page: number;
  pageSize: number;
};

type MateriaFilters = {
  materiaId: string;
  search: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Ocurrio un error. Intenta nuevamente.';
};

const normalizeAuthEvent = (item: Record<string, unknown>): AuthEvent => {
  const metadata = (item.metadata as Record<string, unknown> | null) ?? null;
  const user = (item.user as Record<string, unknown> | null) ?? null;
  const perfil = (item.perfil as Record<string, unknown> | null) ?? null;
  const userMetadata = user?.user_metadata as Record<string, unknown> | undefined;
  const nameFromMetadata =
    typeof userMetadata?.nombre === 'string'
      ? (userMetadata.nombre as string)
      : typeof userMetadata?.name === 'string'
        ? (userMetadata.name as string)
        : undefined;

  const createdAt =
    (item.createdAt as string | undefined) ??
    (item.created_at as string | undefined) ??
    (item.created as string | undefined) ??
    (item.timestamp as string | undefined) ??
    '';

  const tipo =
    (item.eventType as string | undefined) ??
    (item.type as string | undefined) ??
    (item.event as string | undefined) ??
    (item.event_type as string | undefined) ??
    (metadata?.event_type as string | undefined) ??
    '';

  return {
    id:
      (item.id as string | number | undefined) ??
      (item.event_id as string | number | undefined) ??
      createdAt ??
      Math.random().toString(36).slice(2),
    createdAt,
    type: tipo as AuthEventKind,
    userId:
      (item.userId as string | number | undefined) ??
      (item.user_id as string | number | undefined) ??
      (metadata?.user_id as string | number | undefined) ??
      null,
    email:
      (item.email as string | undefined) ??
      (item.user_email as string | undefined) ??
      (user?.email as string | undefined) ??
      (perfil?.email as string | undefined) ??
      null,
    name:
      (item.userName as string | undefined) ??
      (item.name as string | undefined) ??
      (item.user_name as string | undefined) ??
      (perfil?.nombre as string | undefined) ??
      nameFromMetadata ??
      null,
    role:
      (item.role as string | undefined) ??
      (metadata?.role as string | undefined) ??
      (user?.role as string | undefined) ??
      null,
    ip: (item.ip as string | undefined) ?? (item.ip_address as string | undefined) ?? null,
    location: (item.geo as string | undefined) ?? null,
    userAgent:
      (item.user_agent as string | undefined) ??
      (metadata?.user_agent as string | undefined) ??
      null,
    status: (item.status as string | undefined) ?? null,
    metadata,
  };
};

const normalizeMateriaHistorial = (
  item: Record<string, unknown>,
): MateriaHistorialItem => {
  const materia =
    (item.materia as string | undefined) ??
    (item.nombre as string | undefined) ??
    (item.nombre_materia as string | undefined) ??
    null;

  return {
    id: Number(item.id ?? item.id_historial ?? Math.random() * 100000),
    id_materiaprima: Number(item.id_materiaprima ?? item.id_materia ?? 0),
    materia,
    cantidad: Number(item.cantidad ?? 0),
    precio_anterior: Number(item.precio_anterior ?? item.preciototal ?? item.precio_total ?? 0),
    precio_actual: Number(item.precio_actual ?? item.precioActual ?? item.preciototal ?? item.precio_total ?? 0),
    unidadmedida: String(item.unidadmedida ?? item.unidad ?? ''),
    fechacambio:
      (item.fechacambio as string | undefined) ??
      (item.created_at as string | undefined) ??
      (item.fecha as string | undefined) ??
      '',
  };
};

const normalizeMateriaResumen = (
  item: Record<string, unknown>,
): MateriaResumenItem => ({
  id_materiaprima: Number(item.id_materiaprima ?? item.id ?? 0),
  materia: (item.materia as string | undefined) ?? (item.nombre as string | undefined) ?? null,
  cambios: Number(item.cambios ?? item.total_cambios ?? 0),
  precioAnterior: Number(item.precioAnterior ?? item.precio_anterior ?? 0),
  precioActual: Number(item.precioActual ?? item.precio_actual ?? 0),
  variacionAbsoluta: Number(item.variacionAbsoluta ?? item.variacion_absoluta ?? item.variacion_precio ?? 0),
  variacionPorcentual: Number(item.variacionPorcentual ?? item.variacion_porcentual ?? item.variacion_porcentaje ?? 0),
});

export const useAuditoriaData = () => {
  const [authSummary, setAuthSummary] = useState<AuthUsageSummary | null>(null);
  const [authSummaryLoading, setAuthSummaryLoading] = useState(false);

  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);
  const [authEventsLoading, setAuthEventsLoading] = useState(false);
  const [authEventsTotalPages, setAuthEventsTotalPages] = useState(1);
  const [authEventsTotalItems, setAuthEventsTotalItems] = useState(0);
  const [authFilters, setAuthFilters] = useState<AuthFilters>({
    from: '',
    to: '',
    type: 'all',
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const [materiaHistorial, setMateriaHistorial] = useState<MateriaHistorialItem[]>([]);
  const [materiaHistorialLoading, setMateriaHistorialLoading] = useState(false);
  const [materiaHistorialTotalPages, setMateriaHistorialTotalPages] = useState(1);
  const [materiaResumen, setMateriaResumen] = useState<MateriaResumenItem[]>([]);
  const [materiaResumenLoading, setMateriaResumenLoading] = useState(false);
  const [materiaOptions, setMateriaOptions] = useState<{ id: number; nombre: string }[]>([]);
  const [materiaFilters, setMateriaFilters] = useState<MateriaFilters>({
    materiaId: 'all',
    search: '',
    from: '',
    to: '',
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchWithAuth = useCallback(
    async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await debugFetch(endpoint, { ...options, headers });

      if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Sesion expirada. Inicia sesion nuevamente.');
      }

      if (res.status === 204) {
        return {} as T;
      }

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error en la peticion.');
      }

      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return res.json() as Promise<T>;
      }
      return {} as T;
    },
    [],
  );

  const loadAuthSummary = useCallback(async () => {
    try {
      setAuthSummaryLoading(true);
      const params = new URLSearchParams();
      if (authFilters.from) params.set('startDate', authFilters.from);
      if (authFilters.to) params.set('endDate', authFilters.to);
      const qs = params.toString();
      const data = await fetchWithAuth<{
        range?: { startDate?: string; endDate?: string };
        totals?: AuthUsageSummary['totals'];
        timeline?: AuthUsageSummary['timeline'];
        topUsers?: {
          userId?: string | number | null;
          perfilId?: number | null;
          nombre?: string | null;
          email?: string | null;
          logins?: number;
          logouts?: number;
          total?: number;
          firstEventAt?: string | null;
          lastEventAt?: string | null;
          isActive?: boolean;
        }[];
      }>(`${API_BASE_URL}/auditoria/auth/summary${qs ? `?${qs}` : ''}`);

      const mappedTopUsers =
        data.topUsers?.map((item) => ({
          userId: item.userId,
          perfilId: item.perfilId,
          name: item.nombre ?? item.email ?? `Usuario ${item.userId ?? ''}`,
          email: item.email ?? null,
          logins: item.logins,
          logouts: item.logouts,
          total: item.total,
          firstEventAt: item.firstEventAt ?? null,
          lastEventAt: item.lastEventAt ?? null,
          isActive: item.isActive,
        })) ?? [];

      setAuthSummary({
        range: data.range,
        totals: data.totals,
        uniqueUsers: mappedTopUsers.length || undefined,
        timeline: data.timeline,
        topUsers: mappedTopUsers,
      });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setAuthSummaryLoading(false);
    }
  }, [authFilters.from, authFilters.to, fetchWithAuth]);

  const loadAuthEvents = useCallback(async () => {
    try {
      setAuthEventsLoading(true);
      const params = new URLSearchParams({
        page: String(authFilters.page),
        pageSize: String(authFilters.pageSize),
      });
      const eventTypes =
        authFilters.type === 'login'
          ? 'LOGIN'
          : authFilters.type === 'logout'
            ? 'USER_LOGOUT'
            : 'LOGIN,USER_LOGOUT';
      params.set('eventTypes', eventTypes);
      if (authFilters.from) params.set('startDate', authFilters.from);
      if (authFilters.to) params.set('endDate', authFilters.to);

      const qs = params.toString();
      const res = await fetchWithAuth<PagedResult<AuthEvent>>(
        `${API_BASE_URL}/auditoria/auth/events?${qs}`,
      );
      const raw = Array.isArray(res?.data)
        ? (res.data as Record<string, unknown>[])
        : Array.isArray(res as unknown as unknown[])
          ? (res as unknown as Record<string, unknown>[])
          : [];
      const normalized = raw.map((item) =>
        normalizeAuthEvent(item as unknown as Record<string, unknown>),
      );
      const sorted = [...normalized].sort((a, b) => {
        const da = new Date(a.createdAt ?? '').getTime();
        const db = new Date(b.createdAt ?? '').getTime();
        return Number.isNaN(db) ? -1 : Number.isNaN(da) ? 1 : db - da;
      });
      setAuthEvents(sorted);
      const totalPages = (res as PagedResult<AuthEvent>)?.totalPages;
      const totalItems = (res as PagedResult<AuthEvent>)?.totalItems;
      setAuthEventsTotalPages(Math.max(1, totalPages ?? 1));
      setAuthEventsTotalItems(totalItems ?? normalized.length);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setAuthEvents([]);
      setAuthEventsTotalPages(1);
      setAuthEventsTotalItems(0);
    } finally {
      setAuthEventsLoading(false);
    }
  }, [authFilters, fetchWithAuth]);

  const loadMateriaHistorial = useCallback(async () => {
    try {
      setMateriaHistorialLoading(true);
      const params = new URLSearchParams({
        page: String(materiaFilters.page),
        pageSize: String(materiaFilters.pageSize),
      });
      if (materiaFilters.search.trim()) params.set('search', materiaFilters.search.trim());
      if (materiaFilters.materiaId && materiaFilters.materiaId !== 'all') {
        params.set('id_materiaprima', materiaFilters.materiaId);
      }
      if (materiaFilters.from) params.set('from', materiaFilters.from);
      if (materiaFilters.to) params.set('to', materiaFilters.to);

      const qs = params.toString();
      const res = await fetchWithAuth<PagedResult<MateriaHistorialItem>>(
        `${API_BASE_URL}/auditoria/materias/historial?${qs}`,
      );
      const raw = Array.isArray(res?.data)
        ? (res.data as Record<string, unknown>[])
        : Array.isArray(res as unknown as unknown[])
          ? (res as unknown as Record<string, unknown>[])
          : [];
      const normalized = raw.map((item) => normalizeMateriaHistorial(item));
      setMateriaHistorial(normalized);
      const totalPages = (res as PagedResult<MateriaHistorialItem>)?.totalPages;
      setMateriaHistorialTotalPages(Math.max(1, totalPages ?? 1));
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setMateriaHistorial([]);
      setMateriaHistorialTotalPages(1);
    } finally {
      setMateriaHistorialLoading(false);
    }
  }, [fetchWithAuth, materiaFilters]);

  const loadMateriaResumen = useCallback(async () => {
    try {
      setMateriaResumenLoading(true);
      const params = new URLSearchParams();
      if (materiaFilters.from) params.set('from', materiaFilters.from);
      if (materiaFilters.to) params.set('to', materiaFilters.to);
      const qs = params.toString();
      const res = await fetchWithAuth<MateriaResumenItem[] | { data?: MateriaResumenItem[] }>(
        `${API_BASE_URL}/auditoria/materias/resumen${qs ? `?${qs}` : ''}`,
      );
      const data = Array.isArray(res)
        ? res
        : Array.isArray((res as { data?: MateriaResumenItem[] }).data)
          ? (res as { data?: MateriaResumenItem[] }).data
          : [];
      setMateriaResumen(data.map((item) => normalizeMateriaResumen(item as Record<string, unknown>)));
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setMateriaResumen([]);
    } finally {
      setMateriaResumenLoading(false);
    }
  }, [fetchWithAuth, materiaFilters.from, materiaFilters.to]);

  const loadMateriaOptions = useCallback(async () => {
    try {
      const res = await fetchWithAuth<{ data?: { id_materiaprima?: number; nombre?: string }[] }>(
        `${API_BASE_URL}/materias-primas?page=1&pageSize=200`,
      );
      const raw = (res?.data ?? []) as { id_materiaprima?: number; nombre?: string }[];
      const options = raw
        .filter((item) => typeof item.id_materiaprima === 'number' && item.nombre)
        .map((item) => ({
          id: Number(item.id_materiaprima),
          nombre: item.nombre ?? `Materia ${item.id_materiaprima}`,
        }));
      setMateriaOptions(options);
    } catch (err) {
      setMateriaOptions([]);
      setErrorMessage(getErrorMessage(err));
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadAuthSummary();
  }, [loadAuthSummary]);

  useEffect(() => {
    loadAuthEvents();
  }, [loadAuthEvents]);

  useEffect(() => {
    loadMateriaResumen();
  }, [loadMateriaResumen]);

  useEffect(() => {
    loadMateriaHistorial();
  }, [loadMateriaHistorial]);

  useEffect(() => {
    loadMateriaOptions();
  }, [loadMateriaOptions]);

  const authPageControls = useMemo(() => {
    const prevDisabled = authFilters.page <= 1;
    const nextDisabled = authFilters.page >= authEventsTotalPages;
    return { prevDisabled, nextDisabled };
  }, [authEventsTotalPages, authFilters.page]);

  const materiaPageControls = useMemo(() => {
    const prevDisabled = materiaFilters.page <= 1;
    const nextDisabled = materiaFilters.page >= materiaHistorialTotalPages;
    return { prevDisabled, nextDisabled };
  }, [materiaFilters.page, materiaHistorialTotalPages]);

  const setAuthDateRange = (from: string, to: string) =>
    setAuthFilters((prev) => ({ ...prev, from, to, page: 1 }));
  const setAuthType = (type: AuthFilters['type']) =>
    setAuthFilters((prev) => ({ ...prev, type, page: 1 }));
  const setAuthPage = (page: number) =>
    setAuthFilters((prev) => ({ ...prev, page: Math.max(1, page) }));

  const setMateriaSearch = (value: string) =>
    setMateriaFilters((prev) => ({ ...prev, search: value, page: 1 }));
  const setMateriaId = (value: string) =>
    setMateriaFilters((prev) => ({
      ...prev,
      materiaId: value || 'all',
      page: 1,
    }));
  const setMateriaDateRange = (from: string, to: string) =>
    setMateriaFilters((prev) => ({ ...prev, from, to, page: 1 }));
  const setMateriaPage = (page: number) =>
    setMateriaFilters((prev) => ({ ...prev, page: Math.max(1, page) }));

  const clearError = () => setErrorMessage(null);

  return {
    authSummary,
    authSummaryLoading,
    authEvents,
    authEventsLoading,
    authEventsTotalPages,
    authEventsTotalItems,
    authFilters,
    authPageControls,
    setAuthDateRange,
    setAuthType,
    setAuthPage,
    reloadAuthSummary: loadAuthSummary,
    reloadAuthEvents: loadAuthEvents,

    materiaHistorial,
    materiaHistorialLoading,
    materiaHistorialTotalPages,
    materiaResumen,
    materiaResumenLoading,
    materiaOptions,
    materiaFilters,
    materiaPageControls,
    setMateriaSearch,
    setMateriaId,
    setMateriaDateRange,
    setMateriaPage,
    reloadMateriaHistorial: loadMateriaHistorial,
    reloadMateriaResumen: loadMateriaResumen,
    reloadMateriaOptions: loadMateriaOptions,

    errorMessage,
    clearError,
  };
};




