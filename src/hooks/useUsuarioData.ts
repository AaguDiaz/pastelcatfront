'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { debugFetch } from '@/lib/debugFetch';
import {
  Usuario,
  UsuarioFilter,
  UsuarioFormState,
} from '@/interfaces/usuarios';
import { Grupo, Permiso } from '@/interfaces/permisos';

const API_BASE_URL = api;
const PAGE_SIZE = 10;

const initialForm: UsuarioFormState = {
  nombre: '',
  dni: '',
  telefono: '',
  direccion: '',
  email: '',
  grupo: 'cliente',
};

interface UsuariosResponse {
  data?: Usuario[];
  totalPages?: number;
  currentPage?: number;
  totalItems?: number;
}

interface PaginatedResponse<T> {
  data?: T[];
  totalPages?: number;
  currentPage?: number;
  totalItems?: number;
}

type SimpleModalState = {
  open: boolean;
  message: string;
};

interface UsuarioGrupoListado {
  grupos?: Grupo[];
}

interface UsuarioPermisoListado {
  permisos?: Permiso[];
}

const normalizeText = (value: string) => value.trim();
const optionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const decodeJwtUserId = (token: string | null) => {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const padded = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      '=',
    );
    if (typeof window === 'undefined') return null;
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(decoded);
    return data?.sub || data?.user_id || null;
  } catch {
    return null;
  }
};

export const useUsuarioData = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UsuarioFilter>('activos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState<UsuarioFormState>(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [modalError, setModalError] = useState<SimpleModalState>({
    open: false,
    message: '',
  });
  const [modalExito, setModalExito] = useState<SimpleModalState>({
    open: false,
    message: '',
  });
  const [modalEliminar, setModalEliminar] = useState<{
    open: boolean;
    usuario: Usuario | null;
  }>({ open: false, usuario: null });
  const [permisosModal, setPermisosModal] = useState<{
    open: boolean;
    usuario: Usuario | null;
  }>({ open: false, usuario: null });
  const [promoverModal, setPromoverModal] = useState<{
    open: boolean;
    usuario: Usuario | null;
    email: string;
    dni: string;
    loading: boolean;
  }>({ open: false, usuario: null, email: '', dni: '', loading: false });
  const [permModalLoading, setPermModalLoading] = useState(false);
  const [gruposCatalog, setGruposCatalog] = useState<Grupo[]>([]);
  const [permisosCatalog, setPermisosCatalog] = useState<Permiso[]>([]);
  const [usuarioGruposAsignados, setUsuarioGruposAsignados] = useState<Grupo[]>([]);
  const [usuarioPermisosAsignados, setUsuarioPermisosAsignados] = useState<Permiso[]>([]);
  const [usuarioGruposOriginalIds, setUsuarioGruposOriginalIds] = useState<number[]>([]);
  const [usuarioPermisosOriginalIds, setUsuarioPermisosOriginalIds] = useState<number[]>([]);
  const [permFilterModulo, setPermFilterModulo] = useState<string>('Todos');
  const [selectedGrupoId, setSelectedGrupoId] = useState('');
  const [selectedPermisoId, setSelectedPermisoId] = useState('');

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

  const fetchGruposCatalog = useCallback(async () => {
    const params = new URLSearchParams({
      page: '1',
      pageSize: '200',
    });
    const response = await fetchWithAuth<PaginatedResponse<Grupo>>(
      `${API_BASE_URL}/grupos?${params.toString()}`,
    );
    setGruposCatalog(response.data ?? []);
  }, [fetchWithAuth]);

  const fetchPermisosCatalog = useCallback(async () => {
    const params = new URLSearchParams({
      page: '1',
      pageSize: '500',
    });
    const response = await fetchWithAuth<PaginatedResponse<Permiso>>(
      `${API_BASE_URL}/permisos?${params.toString()}`,
    );
    setPermisosCatalog(response.data ?? []);
  }, [fetchWithAuth]);

  const fetchUsuarioGruposAsignados = useCallback(
    async (idPerfil: number) => {
      const response = await fetchWithAuth<UsuarioGrupoListado>(
        `${API_BASE_URL}/usuarios/${idPerfil}/grupos`,
      );
      const grupos = response.grupos ?? [];
      setUsuarioGruposAsignados(grupos);
      setUsuarioGruposOriginalIds(grupos.map((grupo) => grupo.id_grupo));
    },
    [fetchWithAuth],
  );

  const fetchUsuarioPermisosAsignados = useCallback(
    async (idPerfil: number) => {
      const response = await fetchWithAuth<UsuarioPermisoListado>(
        `${API_BASE_URL}/usuarios/${idPerfil}/permisos`,
      );
      const permisos = response.permisos ?? [];
      setUsuarioPermisosAsignados(permisos);
      setUsuarioPermisosOriginalIds(permisos.map((permiso) => permiso.id_permiso));
    },
    [fetchWithAuth],
  );

  const resetPermisosModalSelections = useCallback(() => {
    setSelectedGrupoId('');
    setSelectedPermisoId('');
    setPermFilterModulo('Todos');
  }, []);

  const restoreStageFromOriginal = useCallback(() => {
    const restoredGrupos = gruposCatalog.filter((grupo) =>
      usuarioGruposOriginalIds.includes(grupo.id_grupo),
    );
    const restoredPermisos = permisosCatalog.filter((permiso) =>
      usuarioPermisosOriginalIds.includes(permiso.id_permiso),
    );
    setUsuarioGruposAsignados(restoredGrupos);
    setUsuarioPermisosAsignados(restoredPermisos);
  }, [gruposCatalog, permisosCatalog, usuarioGruposOriginalIds, usuarioPermisosOriginalIds]);

  const clearPermisosModalState = useCallback(() => {
    restoreStageFromOriginal();
    resetPermisosModalSelections();
  }, [resetPermisosModalSelections, restoreStageFromOriginal]);

const closePermisosModal = useCallback(() => {
    restoreStageFromOriginal();
    setPermisosModal({ open: false, usuario: null });
    resetPermisosModalSelections();
  }, [resetPermisosModalSelections, restoreStageFromOriginal]);

  const openPromoverModal = useCallback((usuario: Usuario) => {
    setPromoverModal({
      open: true,
      usuario,
      email: usuario.email ?? '',
      dni: usuario.dni ?? '',
      loading: false,
    });
  }, []);

  const closePromoverModal = useCallback(() => {
    setPromoverModal({ open: false, usuario: null, email: '', dni: '', loading: false });
  }, []);

  const showErrorModal = useCallback((message: string) => {
    setModalError({ open: true, message });
  }, []);

  const showSuccessModal = useCallback((message: string) => {
    setModalExito({ open: true, message });
  }, []);

  const closeErrorModal = useCallback(() => {
    setModalError({ open: false, message: '' });
  }, []);

  const closeExitoModal = useCallback(() => {
    setModalExito({ open: false, message: '' });
  }, []);

  const closeEliminarModal = useCallback(() => {
    setModalEliminar({ open: false, usuario: null });
  }, []);

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      if (filter === 'activos') {
        params.set('is_active', 'true');
      } else if (filter === 'inactivos') {
        params.set('is_active', 'false');
      } else {
        params.set('is_active', 'all');
      }

      const response = await fetchWithAuth<UsuariosResponse>(
        `${API_BASE_URL}/usuarios?${params.toString()}`,
      );

      setUsuarios(response?.data ?? []);
      setTotalPages(Math.max(1, response?.totalPages ?? 1));
    } catch (err) {
      showErrorModal(
        err instanceof Error ? err.message : 'Error al cargar usuarios',
      );
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, filter, page, search, showErrorModal]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refreshUser = () => {
      const token = localStorage.getItem('token');
      setCurrentUserId(decodeJwtUserId(token));
    };
    refreshUser();
    window.addEventListener('storage', refreshUser);
    return () => window.removeEventListener('storage', refreshUser);
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setIsEditing(false);
    setSelectedUsuario(null);
  }, []);

  const handleInputChange = useCallback(
    (field: keyof UsuarioFormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!form.nombre.trim() || !form.dni.trim()) {
      showErrorModal('Nombre y DNI son obligatorios.');
      return;
    }
    if (!isEditing && form.grupo === 'administrador' && !form.email.trim()) {
      showErrorModal('Para un administrador se requiere email.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nombre: normalizeText(form.nombre),
        dni: normalizeText(form.dni),
        telefono: optionalText(form.telefono),
        direccion: optionalText(form.direccion),
      };

      if (isEditing && selectedUsuario) {
        await fetchWithAuth(
          `${API_BASE_URL}/usuarios/${selectedUsuario.id_perfil}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          },
        );
        showSuccessModal('Usuario actualizado.');
      } else if (form.grupo === 'administrador') {
        await fetchWithAuth(`${API_BASE_URL}/usuarios`, {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            email: normalizeText(form.email),
          }),
        });
        showSuccessModal('Usuario administrador creado.');
      } else {
        await fetchWithAuth(`${API_BASE_URL}/usuarios/cliente`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showSuccessModal('Cliente creado.');
      }

      resetForm();
      fetchUsuarios();
    } catch (err) {
      showErrorModal(
        err instanceof Error ? err.message : 'Error al guardar usuario.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    fetchUsuarios,
    fetchWithAuth,
    form.direccion,
    form.dni,
    form.email,
    form.grupo,
    form.nombre,
    form.telefono,
    isEditing,
    resetForm,
    selectedUsuario,
    showErrorModal,
    showSuccessModal,
  ]);

  const startEdit = useCallback((usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsEditing(true);
    setForm({
      nombre: usuario.nombre ?? '',
      dni: usuario.dni ?? '',
      telefono: usuario.telefono ?? '',
      direccion: usuario.direccion ?? '',
      email: usuario.email ?? '',
      grupo: usuario.has_account ? 'administrador' : 'cliente',
    });
  }, []);

  const deactivateUsuario = useCallback(
    async (usuario: Usuario) => {
      try {
        setLoading(true);
        await fetchWithAuth(`${API_BASE_URL}/usuarios/${usuario.id_perfil}`, {
          method: 'DELETE',
        });
        showSuccessModal('Usuario dado de baja.');
        if (selectedUsuario?.id_perfil === usuario.id_perfil) {
          resetForm();
        }
        fetchUsuarios();
      } catch (err) {
        showErrorModal(
          err instanceof Error
            ? err.message
            : 'No se pudo dar de baja al usuario.',
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchUsuarios, fetchWithAuth, resetForm, selectedUsuario, showErrorModal, showSuccessModal],
  );

  const reactivateUsuario = useCallback(
    async (usuario: Usuario) => {
      try {
        setLoading(true);
        await fetchWithAuth(`${API_BASE_URL}/usuarios/${usuario.id_perfil}`, {
          method: 'PUT',
          body: JSON.stringify({ is_active: true }),
        });
        showSuccessModal('Usuario reactivado.');
        fetchUsuarios();
      } catch (err) {
        showErrorModal(
          err instanceof Error
            ? err.message
            : 'No se pudo reactivar al usuario.',
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchUsuarios, fetchWithAuth, showErrorModal, showSuccessModal],
  );

  const toggleActivo = useCallback(
    (usuario: Usuario) => {
      if (usuario.is_active) {
        if (currentUserId && usuario.user_id && usuario.user_id === currentUserId) {
          showErrorModal('No podes darte de baja a vos mismo.');
          return;
        }
        setModalEliminar({ open: true, usuario });
        return;
      }
      reactivateUsuario(usuario);
    },
    [currentUserId, reactivateUsuario, showErrorModal],
  );

  const handleEliminarResponse = useCallback(
    async (confirmed: boolean) => {
      if (confirmed && modalEliminar.usuario) {
        await deactivateUsuario(modalEliminar.usuario);
      }
      closeEliminarModal();
    },
    [closeEliminarModal, deactivateUsuario, modalEliminar.usuario],
  );

  const handleChangePassword = useCallback(
    (usuario: Usuario) => {
      if (!usuario.has_account) {
        showErrorModal('El usuario no tiene cuenta para resetear contrasena.');
        return;
      }
      showErrorModal(
        'La funcionalidad de cambio de contrasena estara disponible proximamente.',
      );
    },
    [showErrorModal],
  );

  const handleModificarPermisos = useCallback(
    async (usuario: Usuario) => {
      setPermisosModal({ open: true, usuario });
      setPermModalLoading(true);
      try {
        await Promise.all([
          fetchGruposCatalog(),
          fetchPermisosCatalog(),
          fetchUsuarioGruposAsignados(usuario.id_perfil),
          fetchUsuarioPermisosAsignados(usuario.id_perfil),
        ]);
      } catch (err) {
        showErrorModal(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la gestion de permisos.',
        );
        setPermisosModal({ open: false, usuario: null });
      } finally {
        setPermModalLoading(false);
      }
    },
    [
      fetchGruposCatalog,
      fetchPermisosCatalog,
      fetchUsuarioGruposAsignados,
      fetchUsuarioPermisosAsignados,
      showErrorModal,
    ],
  );

  const handlePromoverAdministrador = useCallback(
    (usuario: Usuario) => {
      openPromoverModal(usuario);
    },
    [openPromoverModal],
  );

  const handlePromoverEmailChange = useCallback((value: string) => {
    setPromoverModal((prev) => ({ ...prev, email: value }));
  }, []);

  const handlePromoverDniChange = useCallback((value: string) => {
    setPromoverModal((prev) => ({ ...prev, dni: value }));
  }, []);

  const handleAgregarGrupoUsuario = useCallback(() => {
    if (!selectedGrupoId) {
      showErrorModal('Selecciona un grupo para asignar.');
      return;
    }
    const grupo = gruposCatalog.find(
      (item) => String(item.id_grupo) === selectedGrupoId,
    );
    if (!grupo) {
      showErrorModal('El grupo seleccionado es invalido.');
      return;
    }
    const already = usuarioGruposAsignados.some(
      (g) => g.id_grupo === grupo.id_grupo,
    );
    if (already) {
      showErrorModal('El grupo ya esta en la lista.');
      return;
    }
    setUsuarioGruposAsignados((prev) => [...prev, grupo]);
    setSelectedGrupoId('');
  }, [
    gruposCatalog,
    selectedGrupoId,
    showErrorModal,
    usuarioGruposAsignados,
  ]);

  const handleQuitarGrupoUsuario = useCallback((grupoId: number) => {
    setUsuarioGruposAsignados((prev) =>
      prev.filter((grupo) => grupo.id_grupo !== grupoId),
    );
    setSelectedGrupoId('');
  }, []);

  const handleAgregarPermisoUsuario = useCallback(() => {
    if (!selectedPermisoId) {
      showErrorModal('Selecciona un permiso para asignar.');
      return;
    }
    const permiso = permisosCatalog.find(
      (item) => String(item.id_permiso) === selectedPermisoId,
    );
    if (!permiso) {
      showErrorModal('El permiso seleccionado es invalido.');
      return;
    }
    const already = usuarioPermisosAsignados.some(
      (p) => p.id_permiso === permiso.id_permiso,
    );
    if (already) {
      showErrorModal('El permiso ya esta en la lista.');
      return;
    }
    setUsuarioPermisosAsignados((prev) => [...prev, permiso]);
    setSelectedPermisoId('');
  }, [
    permisosCatalog,
    selectedPermisoId,
    showErrorModal,
    usuarioPermisosAsignados,
  ]);

  const handleQuitarPermisoUsuario = useCallback((permisoId: number) => {
    setUsuarioPermisosAsignados((prev) =>
      prev.filter((permiso) => permiso.id_permiso !== permisoId),
    );
    setSelectedPermisoId('');
  }, []);

  const pageControls = useMemo(() => {
    const prevDisabled = page <= 1;
    const nextDisabled = page >= totalPages;
    return { prevDisabled, nextDisabled };
  }, [page, totalPages]);

  const permisosFiltrados = useMemo(() => {
    if (permFilterModulo === 'Todos') {
      return permisosCatalog;
    }
    const normalized = permFilterModulo.toLowerCase();
    return permisosCatalog.filter(
      (permiso) => permiso.modulo.toLowerCase() === normalized,
    );
  }, [permFilterModulo, permisosCatalog]);

  useEffect(() => {
    if (!selectedPermisoId) return;
    const exists = permisosFiltrados.some(
      (permiso) => String(permiso.id_permiso) === selectedPermisoId,
    );
    if (!exists) {
      setSelectedPermisoId('');
    }
  }, [permisosFiltrados, selectedPermisoId]);

  const handleConfirmPermisosUsuario = useCallback(async () => {
    if (!permisosModal.usuario) {
      showErrorModal('No se selecciono un usuario.');
      return;
    }

    const grupoDeseadoIds = usuarioGruposAsignados.map((grupo) => grupo.id_grupo);
    const permisoDeseadoIds = usuarioPermisosAsignados.map(
      (permiso) => permiso.id_permiso,
    );

    const gruposAAgregar = grupoDeseadoIds.filter(
      (id) => !usuarioGruposOriginalIds.includes(id),
    );
    const gruposAQuitar = usuarioGruposOriginalIds.filter(
      (id) => !grupoDeseadoIds.includes(id),
    );
    const permisosAAgregar = permisoDeseadoIds.filter(
      (id) => !usuarioPermisosOriginalIds.includes(id),
    );
    const permisosAQuitar = usuarioPermisosOriginalIds.filter(
      (id) => !permisoDeseadoIds.includes(id),
    );

    try {
      setPermModalLoading(true);
      const usuarioId = permisosModal.usuario.id_perfil;

      for (const grupoId of gruposAAgregar) {
        await fetchWithAuth(`${API_BASE_URL}/usuarios/${usuarioId}/grupos`, {
          method: 'POST',
          body: JSON.stringify({ id_grupo: grupoId }),
        });
      }

      for (const grupoId of gruposAQuitar) {
        await fetchWithAuth(`${API_BASE_URL}/usuarios/${usuarioId}/grupos/${grupoId}`, {
          method: 'DELETE',
        });
      }

      for (const permisoId of permisosAAgregar) {
        await fetchWithAuth(`${API_BASE_URL}/usuarios/${usuarioId}/permisos`, {
          method: 'POST',
          body: JSON.stringify({ id_permiso: permisoId }),
        });
      }

      for (const permisoId of permisosAQuitar) {
        await fetchWithAuth(
          `${API_BASE_URL}/usuarios/${usuarioId}/permisos/${permisoId}`,
          { method: 'DELETE' },
        );
      }

      setUsuarioGruposOriginalIds(grupoDeseadoIds);
      setUsuarioPermisosOriginalIds(permisoDeseadoIds);
      showSuccessModal('Permisos del usuario actualizados.');
      closePermisosModal();
    } catch (err) {
      showErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudieron actualizar los permisos del usuario.',
      );
    } finally {
      setPermModalLoading(false);
    }
  }, [
    closePermisosModal,
    fetchWithAuth,
    permisosModal.usuario,
    showErrorModal,
    showSuccessModal,
    usuarioGruposAsignados,
    usuarioGruposOriginalIds,
    usuarioPermisosAsignados,
    usuarioPermisosOriginalIds,
  ]);

  const handleConfirmPromover = useCallback(async () => {
    if (!promoverModal.usuario) {
      showErrorModal('No se selecciono un usuario.');
      return;
    }

    const safeEmail = normalizeText(promoverModal.email).toLowerCase();
    const safeDni = normalizeText(promoverModal.dni);

    if (!safeEmail || !safeDni) {
      showErrorModal('Email y DNI son obligatorios.');
      return;
    }

    try {
      setPromoverModal((prev) => ({ ...prev, loading: true }));
      await fetchWithAuth(
        `${API_BASE_URL}/usuarios/${promoverModal.usuario.id_perfil}/promover`,
        {
          method: 'POST',
          body: JSON.stringify({ email: safeEmail, dni: safeDni }),
        },
      );
      showSuccessModal('Usuario promovido a administrador.');
      closePromoverModal();
      fetchUsuarios();
    } catch (err) {
      showErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudo promover al usuario.',
      );
    } finally {
      setPromoverModal((prev) => ({ ...prev, loading: false }));
    }
  }, [
    closePromoverModal,
    fetchUsuarios,
    fetchWithAuth,
    promoverModal.dni,
    promoverModal.email,
    promoverModal.usuario,
    showErrorModal,
    showSuccessModal,
  ]);

  const permisosModalState = {
    open: permisosModal.open,
    usuario: permisosModal.usuario,
    loading: permModalLoading,
    gruposOptions: gruposCatalog,
    permisosOptions: permisosFiltrados,
    moduloFilter: permFilterModulo,
    setModuloFilter: setPermFilterModulo,
    selectedGrupoId,
    setSelectedGrupoId,
    selectedPermisoId,
    setSelectedPermisoId,
    assignedGrupos: usuarioGruposAsignados,
    assignedPermisos: usuarioPermisosAsignados,
    onAddGrupo: handleAgregarGrupoUsuario,
    onRemoveGrupo: handleQuitarGrupoUsuario,
    onAddPermiso: handleAgregarPermisoUsuario,
    onRemovePermiso: handleQuitarPermisoUsuario,
    onClearSelections: clearPermisosModalState,
    onConfirm: handleConfirmPermisosUsuario,
    onClose: closePermisosModal,
  };

  const promoverModalState = {
    open: promoverModal.open,
    usuario: promoverModal.usuario,
    loading: promoverModal.loading,
    email: promoverModal.email,
    dni: promoverModal.dni,
    requireDni: !promoverModal.usuario?.dni,
    onEmailChange: handlePromoverEmailChange,
    onDniChange: handlePromoverDniChange,
    onConfirm: handleConfirmPromover,
    onClose: closePromoverModal,
  };

  return {
    usuarios,
    loading,
    form,
    isEditing,
    search,
    filter,
    page,
    totalPages,
    pageControls,
    handleInputChange,
    handleSubmit,
    cancelEdit: resetForm,
    startEdit,
    toggleActivo,
    handleChangePassword,
    handleModificarPermisos,
    handlePromoverAdministrador,
    setSearch,
    setFilter,
    setPage,
    modalError,
    modalExito,
    closeErrorModal,
    closeExitoModal,
    modalEliminar,
    handleEliminarResponse,
    permisosModal: permisosModalState,
    promoverModal: promoverModalState,
  };
};
