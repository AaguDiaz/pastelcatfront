'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { debugFetch } from '@/lib/debugFetch';
import {
  Grupo,
  GrupoFormState,
  Permiso,
  PERMISO_MODULOS,
} from '@/interfaces/permisos';

const API_BASE_URL = api;
const PAGE_SIZE = 10;
const CATALOG_PAGE_SIZE = 500;
const initialGrupoForm: GrupoFormState = { nombre: '', descripcion: '', permisos: [] };

type SimpleModalState = {
  open: boolean;
  message: string;
};

type ModalEliminarState = {
  open: boolean;
  entityId: number | null;
  nombre: string;
  contexto: string;
  mensaje?: string;
  tipo?: string;
};

interface PaginatedResponse<T> {
  data?: T[];
  totalPages?: number;
  currentPage?: number;
  totalItems?: number;
}

const normalizeText = (value: string) => value.trim();

const normalizeSearch = (value: string) => value.trim();

export const usePermisosData = () => {
  const [permisosCatalog, setPermisosCatalog] = useState<Permiso[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [gruposLoading, setGruposLoading] = useState(false);
  const [gruposPage, setGruposPage] = useState(1);
  const [gruposTotalPages, setGruposTotalPages] = useState(1);
  const [grupoSearch, setGrupoSearch] = useState('');

  const [grupoForm, setGrupoForm] = useState<GrupoFormState>(initialGrupoForm);
  const [grupoMode, setGrupoMode] = useState<'nuevo' | 'detalle' | 'editar'>('nuevo');
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [grupoPermisosOriginal, setGrupoPermisosOriginal] = useState<number[]>([]);
  const [grupoSaving, setGrupoSaving] = useState(false);
  const [selectedPermisoId, setSelectedPermisoId] = useState('');
  const [permisoFilterModulo, setPermisoFilterModulo] = useState<string>('Todos');

  const [modalError, setModalError] = useState<SimpleModalState>({
    open: false,
    message: '',
  });
  const [modalExito, setModalExito] = useState<SimpleModalState>({
    open: false,
    message: '',
  });
  const [modalEliminar, setModalEliminar] = useState<ModalEliminarState>({
    open: false,
    entityId: null,
    nombre: '',
    contexto: '',
  });

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
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Sesion expirada. Inicia sesion nuevamente.');
      }

      if (res.status === 204) {
        return {} as T;
      }

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error en la peticion.');
      }

      return res.json() as Promise<T>;
    },
    [],
  );

  const showErrorModal = useCallback((message: string) => {
    setModalError({ open: true, message });
  }, []);

  const showSuccessModal = useCallback((message: string) => {
    setModalExito({ open: true, message });
  }, []);

  const closeErrorModal = useCallback(() => {
    setModalError((prev) => ({ ...prev, open: false }));
  }, []);

  const closeExitoModal = useCallback(() => {
    setModalExito((prev) => ({ ...prev, open: false }));
  }, []);

  const closeEliminarModal = useCallback(() => {
    setModalEliminar((prev) => ({ ...prev, open: false }));
  }, []);

  const upsertPermisosInCatalog = useCallback((items: Permiso[]) => {
    setPermisosCatalog((prev) => {
      const map = new Map(prev.map((permiso) => [permiso.id_permiso, permiso]));
      items.forEach((permiso) => {
        map.set(permiso.id_permiso, permiso);
      });
      return Array.from(map.values()).sort((a, b) => {
        const moduloCompare = a.modulo.localeCompare(b.modulo, 'es');
        if (moduloCompare !== 0) return moduloCompare;
        return a.accion.localeCompare(b.accion, 'es');
      });
    });
  }, []);

  const fetchPermisosCatalog = useCallback(async () => {
    try {
      setCatalogLoading(true);
      const params = new URLSearchParams({
        page: '1',
        pageSize: String(CATALOG_PAGE_SIZE),
      });
      const response = await fetchWithAuth<PaginatedResponse<Permiso>>(
        `${API_BASE_URL}/permisos?${params.toString()}`,
      );
      upsertPermisosInCatalog(response.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setCatalogLoading(false);
    }
  }, [fetchWithAuth, upsertPermisosInCatalog]);

  const fetchGrupos = useCallback(async () => {
    try {
      setGruposLoading(true);
      const params = new URLSearchParams({
        page: String(gruposPage),
        pageSize: String(PAGE_SIZE),
      });
      const searchValue = normalizeSearch(grupoSearch);
      if (searchValue) {
        params.append('search', searchValue);
      }
      const response = await fetchWithAuth<PaginatedResponse<Grupo>>(
        `${API_BASE_URL}/grupos?${params.toString()}`,
      );
      setGrupos(response.data ?? []);
      setGruposTotalPages(response.totalPages ?? 1);
    } catch (err) {
      showErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudieron obtener los grupos.',
      );
    } finally {
      setGruposLoading(false);
    }
  }, [fetchWithAuth, grupoSearch, gruposPage, showErrorModal]);

  useEffect(() => {
    fetchGrupos();
  }, [fetchGrupos]);

  useEffect(() => {
    fetchPermisosCatalog();
  }, [fetchPermisosCatalog]);

  useEffect(() => {
    setGruposPage(1);
  }, [grupoSearch]);

  const changeGruposPage = useCallback(
    (next: number) => {
      setGruposPage((prev) => {
        const total = gruposTotalPages || 1;
        const clamped = Math.min(Math.max(next, 1), total);
        return clamped === prev ? prev : clamped;
      });
    },
    [gruposTotalPages],
  );

  const handleGrupoFieldChange = useCallback(
    (field: keyof GrupoFormState, value: string | Permiso[]) => {
      setGrupoForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const resetGrupoForm = useCallback(() => {
    setGrupoForm(initialGrupoForm);
    setGrupoMode('nuevo');
    setSelectedGrupo(null);
    setGrupoPermisosOriginal([]);
    setSelectedPermisoId('');
    setPermisoFilterModulo('Todos');
  }, []);

  const handleAddPermisoToGrupo = useCallback(() => {
    if (grupoMode === 'detalle') return;
    if (!selectedPermisoId) {
      showErrorModal('Selecciona un permiso para agregar.');
      return;
    }
    const permiso = permisosCatalog.find(
      (item) => String(item.id_permiso) === selectedPermisoId,
    );
    if (!permiso) {
      showErrorModal('Permiso seleccionado invalido.');
      return;
    }
    if (grupoForm.permisos.some((p) => p.id_permiso === permiso.id_permiso)) {
      showErrorModal('El permiso ya fue agregado al grupo.');
      return;
    }
    setGrupoForm((prev) => ({
      ...prev,
      permisos: [...prev.permisos, permiso],
    }));
    setSelectedPermisoId('');
  }, [grupoForm.permisos, grupoMode, permisosCatalog, selectedPermisoId, showErrorModal]);

  const handleRemovePermisoFromGrupo = useCallback(
    (permisoId: number) => {
      if (grupoMode === 'detalle') return;
      setGrupoForm((prev) => ({
        ...prev,
        permisos: prev.permisos.filter((permiso) => permiso.id_permiso !== permisoId),
      }));
    },
    [grupoMode],
  );

  const syncGrupoPermisos = useCallback(
    async (grupoId: number, desiredIds: number[], originalIds: number[]) => {
      const desiredSet = new Set(desiredIds);
      const originalSet = new Set(originalIds);
      const toAdd = desiredIds.filter((id) => !originalSet.has(id));
      const toRemove = originalIds.filter((id) => !desiredSet.has(id));

      for (const permisoId of toAdd) {
        await fetchWithAuth(`${API_BASE_URL}/grupos/${grupoId}/permisos`, {
          method: 'POST',
          body: JSON.stringify({ id_permiso: permisoId }),
        });
      }

      for (const permisoId of toRemove) {
        await fetchWithAuth(`${API_BASE_URL}/grupos/${grupoId}/permisos/${permisoId}`, {
          method: 'DELETE',
        });
      }
    },
    [fetchWithAuth],
  );

  const fetchGrupoDetalle = useCallback(
    async (grupo: Grupo, mode: 'detalle' | 'editar') => {
      try {
        setGrupoSaving(true);
        const detalle = await fetchWithAuth<Grupo & { permisos?: Permiso[] }>(
          `${API_BASE_URL}/grupos/${grupo.id_grupo}`,
        );
        const permisosDetalle = detalle.permisos ?? [];
        upsertPermisosInCatalog(permisosDetalle);
        setGrupoForm({
          nombre: detalle.nombre ?? '',
          descripcion: detalle.descripcion ?? '',
          permisos: permisosDetalle,
        });
        setGrupoPermisosOriginal(permisosDetalle.map((permiso) => permiso.id_permiso));
        setGrupoMode(mode);
        setSelectedGrupo({ ...grupo, permisos: permisosDetalle });
      } catch (err) {
        showErrorModal(
          err instanceof Error ? err.message : 'No se pudo obtener el grupo.',
        );
      } finally {
        setGrupoSaving(false);
      }
    },
    [fetchWithAuth, showErrorModal, upsertPermisosInCatalog],
  );

  const handleVerDetalleGrupo = useCallback(
    (grupo: Grupo) => {
      fetchGrupoDetalle(grupo, 'detalle');
    },
    [fetchGrupoDetalle],
  );

  const handleEditarGrupo = useCallback(
    (grupo: Grupo) => {
      fetchGrupoDetalle(grupo, 'editar');
    },
    [fetchGrupoDetalle],
  );

  const handleGrupoSubmit = useCallback(async () => {
    if (grupoMode === 'detalle') {
      showErrorModal('Selecciona un grupo para editar o crea uno nuevo.');
      return;
    }

    const nombre = normalizeText(grupoForm.nombre);
    const descripcionValue = normalizeText(grupoForm.descripcion);

    if (!nombre) {
      showErrorModal('El nombre del grupo es obligatorio.');
      return;
    }

    try {
      setGrupoSaving(true);
      if (grupoMode === 'editar' && selectedGrupo) {
        await fetchWithAuth(`${API_BASE_URL}/grupos/${selectedGrupo.id_grupo}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre,
            descripcion: descripcionValue || null,
          }),
        });
        await syncGrupoPermisos(
          selectedGrupo.id_grupo,
          grupoForm.permisos.map((permiso) => permiso.id_permiso),
          grupoPermisosOriginal,
        );
        showSuccessModal('Grupo actualizado correctamente.');
      } else {
        const nuevo = await fetchWithAuth<Grupo>(`${API_BASE_URL}/grupos`, {
          method: 'POST',
          body: JSON.stringify({
            nombre,
            descripcion: descripcionValue || null,
          }),
        });
        if (!nuevo?.id_grupo) {
          throw new Error('No se pudo crear el grupo.');
        }
        await syncGrupoPermisos(
          nuevo.id_grupo,
          grupoForm.permisos.map((permiso) => permiso.id_permiso),
          [],
        );
        showSuccessModal('Grupo creado correctamente.');
      }
      resetGrupoForm();
      fetchGrupos();
    } catch (err) {
      showErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el grupo.',
      );
    } finally {
      setGrupoSaving(false);
    }
  }, [
    fetchGrupos,
    fetchWithAuth,
    grupoForm.descripcion,
    grupoForm.nombre,
    grupoForm.permisos,
    grupoMode,
    grupoPermisosOriginal,
    resetGrupoForm,
    selectedGrupo,
    showErrorModal,
    showSuccessModal,
    syncGrupoPermisos,
  ]);

  const deleteGrupo = useCallback(
    async (grupoId: number) => {
      try {
        await fetchWithAuth(`${API_BASE_URL}/grupos/${grupoId}`, {
          method: 'DELETE',
        });
        showSuccessModal('Grupo eliminado.');
        if (selectedGrupo?.id_grupo === grupoId) {
          resetGrupoForm();
        }
        fetchGrupos();
      } catch (err) {
        showErrorModal(
          err instanceof Error
            ? err.message
            : 'No se pudo eliminar el grupo.',
        );
      }
    },
    [fetchGrupos, fetchWithAuth, resetGrupoForm, selectedGrupo?.id_grupo, showErrorModal, showSuccessModal],
  );

  const requestDeleteGrupo = useCallback((grupo: Grupo) => {
    setModalEliminar({
      open: true,
      tipo: 'grupo',
      entityId: grupo.id_grupo,
      nombre: grupo.nombre,
      contexto: 'grupos',
      mensaje: 'Esta accion eliminara el grupo y sus asignaciones.',
    });
  }, []);

  const handleEliminarResponse = useCallback(
    async (confirmed: boolean) => {
      if (confirmed && modalEliminar.entityId) {
        await deleteGrupo(modalEliminar.entityId);
      }
      closeEliminarModal();
    },
    [closeEliminarModal, deleteGrupo, modalEliminar],
  );

  const grupoReadOnly = grupoMode === 'detalle';

  const permisosOptions = useMemo(() => {
    const byModulo = permisoFilterModulo.toLowerCase();
    return permisosCatalog.filter((permiso) => {
      if (permisoFilterModulo === 'Todos') return true;
      return permiso.modulo.toLowerCase() === byModulo;
    });
  }, [permisoFilterModulo, permisosCatalog]);

  useEffect(() => {
    if (!selectedPermisoId) return;
    const exists = permisosOptions.some(
      (permiso) => String(permiso.id_permiso) === selectedPermisoId,
    );
    if (!exists) {
      setSelectedPermisoId('');
    }
  }, [permisosOptions, selectedPermisoId]);

  return {
    grupoState: {
      form: grupoForm,
      mode: grupoMode,
      readOnly: grupoReadOnly,
      loading: gruposLoading || grupoSaving,
      saving: grupoSaving,
      search: grupoSearch,
      setSearch: setGrupoSearch,
      page: gruposPage,
      totalPages: gruposTotalPages,
      changePage: changeGruposPage,
      list: grupos,
      moduloOptions: PERMISO_MODULOS,
      permisoFilter: permisoFilterModulo,
      setPermisoFilter: setPermisoFilterModulo,
      selectedPermisoId,
      setSelectedPermisoId,
      permisosOptions,
      permisosOptionsLoading: catalogLoading,
      onFieldChange: handleGrupoFieldChange,
      onAddPermiso: handleAddPermisoToGrupo,
      onRemovePermiso: handleRemovePermisoFromGrupo,
      onReset: resetGrupoForm,
      onSubmit: handleGrupoSubmit,
      onVerDetalle: handleVerDetalleGrupo,
      onEditar: handleEditarGrupo,
      onEliminar: requestDeleteGrupo,
    },
    modals: {
      error: modalError,
      success: modalExito,
      closeError: closeErrorModal,
      closeSuccess: closeExitoModal,
      eliminar: modalEliminar,
      onEliminarResponse: handleEliminarResponse,
    },
  };
};
