'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { debugFetch } from '@/lib/debugFetch';
import {
  Usuario,
  UsuarioFilter,
  UsuarioFormState,
} from '@/interfaces/usuarios';

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

type SimpleModalState = {
  open: boolean;
  message: string;
};

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

  const handleGestionPermisos = useCallback(() => {
    showSuccessModal('Gestion de permisos en construccion.');
  }, [showSuccessModal]);

  const handleModificarPermisos = useCallback(
    (usuario: Usuario) => {
      showSuccessModal(
        `Modificar permisos para ${usuario.nombre} estara disponible proximamente.`,
      );
    },
    [showSuccessModal],
  );

  const pageControls = useMemo(() => {
    const prevDisabled = page <= 1;
    const nextDisabled = page >= totalPages;
    return { prevDisabled, nextDisabled };
  }, [page, totalPages]);

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
    handleGestionPermisos,
    handleModificarPermisos,
    setSearch,
    setFilter,
    setPage,
    modalError,
    modalExito,
    closeErrorModal,
    closeExitoModal,
    modalEliminar,
    handleEliminarResponse,
  };
};

