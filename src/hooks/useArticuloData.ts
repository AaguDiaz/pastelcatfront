'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { debugFetch } from '@/lib/debugFetch';
import { Articulo, ArticuloFormState, Categoria } from '@/interfaces/articulos';

const API_BASE_URL = api;
const PAGE_SIZE = 10;
const CATEGORIA_PAGE_SIZE = 200;
const CATEGORY_INACTIVE_ID = 1;

type SimpleModalState = {
  open: boolean;
  message: string;
};

type ModalEliminarArticuloState = {
  open: boolean;
  articulo: Articulo | null;
};

type ModalEliminarCategoriaState = {
  open: boolean;
  categoria: Categoria | null;
};

const createInitialFormState = (): ArticuloFormState => ({
  nombre: '',
  color: '',
  tamanio: '',
  id_categoria: '',
  reutilizable: '',
  costo_unitario: '',
  precio_alquiler: '',
  stock_total: '',
  stock_disponible: '',
});

type ArticuloResponse = {
  data?: Articulo[];
  totalPages?: number;
  currentPage?: number;
};

type CategoriaResponse = {
  data?: Categoria[];
};

type DeleteArticuloResponse = {
  action?: string;
  message?: string;
  [key: string]: unknown;
} | null;

const parseErrorMessage = (payload: string) => {
  if (!payload) return 'Error al procesar la solicitud.';
  try {
    const data = JSON.parse(payload);
    if (data?.error?.message) return data.error.message as string;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data === 'string') return data;
  } catch {
    // ignore
  }
  return payload;
};

export const useArticuloData = () => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [articulosLoading, setArticulosLoading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [categoriaSaving, setCategoriaSaving] = useState(false);

  const [form, setForm] = useState<ArticuloFormState>(createInitialFormState);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);

  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<'todos' | string>('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalError, setModalError] = useState<SimpleModalState>({
    open: false,
    message: '',
  });
  const [modalExito, setModalExito] = useState<SimpleModalState>({
    open: false,
    message: '',
  });
  const [modalEliminarArticulo, setModalEliminarArticulo] =
    useState<ModalEliminarArticuloState>({ open: false, articulo: null });
  const [modalEliminarCategoria, setModalEliminarCategoria] =
    useState<ModalEliminarCategoriaState>({ open: false, categoria: null });

  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);
  const [categoriaFormNombre, setCategoriaFormNombre] = useState('');
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [requireCategorySelection, setRequireCategorySelection] = useState(false);

  const fetchWithAuth = useCallback(
    async <T,>(endpoint: string, options: RequestInit = {}): Promise<T | null> => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await debugFetch(endpoint, { ...options, headers });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Sesion expirada. Inicia sesion nuevamente.');
      }

      const raw = await response.text();

      if (!response.ok) {
        throw new Error(parseErrorMessage(raw));
      }

      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as T;
      }
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

  const fetchCategorias = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: String(CATEGORIA_PAGE_SIZE),
      });
      const result = await fetchWithAuth<CategoriaResponse>(
        `${API_BASE_URL}/categorias?${params.toString()}`,
      );
      setCategorias(result?.data ?? []);
    } catch (err) {
      showErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudieron obtener las categorias.',
      );
    }
  }, [fetchWithAuth, showErrorModal]);

  const fetchArticulos = useCallback(async () => {
    try {
      setArticulosLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        search: search.trim(),
      });
      if (categoriaFilter !== 'todos') {
        params.append('categoriaId', categoriaFilter);
      }
      const result = await fetchWithAuth<ArticuloResponse>(
        `${API_BASE_URL}/articulos?${params.toString()}`,
      );
      setArticulos(result?.data ?? []);
      setTotalPages(result?.totalPages ?? 1);
    } catch (err) {
      showErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudieron obtener los articulos.',
      );
    } finally {
      setArticulosLoading(false);
    }
  }, [categoriaFilter, fetchWithAuth, page, search, showErrorModal]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  useEffect(() => {
    fetchArticulos();
  }, [fetchArticulos]);

  const handleFieldChange = useCallback(
    (field: keyof ArticuloFormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field === 'id_categoria' && value) {
        setRequireCategorySelection(false);
      }
    },
    [],
  );

  const resetForm = useCallback(() => {
    setForm(createInitialFormState());
    setEditingArticulo(null);
    setRequireCategorySelection(false);
  }, []);

  const startEdit = useCallback((articulo: Articulo) => {
    setEditingArticulo(articulo);
    const isInactive = articulo.id_categoria === CATEGORY_INACTIVE_ID;
    setRequireCategorySelection(isInactive);
    setForm({
      nombre: articulo.nombre,
      color: articulo.color ?? '',
      tamanio: articulo.tamanio ?? '',
      id_categoria: isInactive
        ? ''
        : articulo.id_categoria
        ? String(articulo.id_categoria)
        : '',
      reutilizable: articulo.reutilizable ? 'si' : 'no',
      costo_unitario: articulo.costo_unitario ?? '',
      precio_alquiler:
        typeof articulo.precio_alquiler === 'number'
          ? articulo.precio_alquiler.toString()
          : '',
      stock_total: articulo.stock_total?.toString() ?? '',
      stock_disponible: articulo.stock_disponible?.toString() ?? '',
    });
  }, []);

  const validateArticuloForm = useCallback(() => {
    const nombre = form.nombre.trim();
    if (!nombre) throw new Error('El nombre del articulo es obligatorio.');

    const idCategoria = Number.parseInt(form.id_categoria, 10);
    if (!Number.isFinite(idCategoria) || idCategoria <= 0) {
      throw new Error('Selecciona una categoria.');
    }

    if (form.reutilizable !== 'si' && form.reutilizable !== 'no') {
      throw new Error('Indica si el articulo es reutilizable.');
    }

    const costoUnitario = Number(form.costo_unitario);
    if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
      throw new Error('El costo unitario es invalido.');
    }

    const precioAlquiler = Number(form.precio_alquiler);
    if (!Number.isFinite(precioAlquiler) || precioAlquiler < 0) {
      throw new Error('El precio de alquiler es invalido.');
    }

    const stockTotal = Number.parseInt(form.stock_total, 10);
    if (!Number.isFinite(stockTotal) || stockTotal < 0) {
      throw new Error('El stock total es invalido.');
    }

    const stockDisponible = Number.parseInt(form.stock_disponible, 10);
    if (!Number.isFinite(stockDisponible) || stockDisponible < 0) {
      throw new Error('El stock disponible es invalido.');
    }

    if (stockDisponible > stockTotal) {
      throw new Error('El stock disponible no puede superar al total.');
    }

    return {
      nombre,
      id_categoria: idCategoria,
      reutilizable: form.reutilizable === 'si',
      color: form.color.trim() || null,
      tamanio: form.tamanio.trim() || null,
      costo_unitario: costoUnitario.toString(),
      precio_alquiler: precioAlquiler,
      stock_total: stockTotal,
      stock_disponible: stockDisponible,
    };
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const payload = validateArticuloForm();
      setFormSaving(true);
      if (editingArticulo) {
        await fetchWithAuth(`${API_BASE_URL}/articulos/${editingArticulo.id_articulo}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showSuccessModal('Articulo actualizado correctamente.');
      } else {
        await fetchWithAuth(`${API_BASE_URL}/articulos`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showSuccessModal('Articulo agregado correctamente.');
      }
      resetForm();
      fetchArticulos();
    } catch (err) {
      showErrorModal(
        err instanceof Error ? err.message : 'No se pudo guardar el articulo.',
      );
    } finally {
      setFormSaving(false);
    }
  }, [
    editingArticulo,
    fetchArticulos,
    fetchWithAuth,
    resetForm,
    showErrorModal,
    showSuccessModal,
    validateArticuloForm,
  ]);

  const requestDeleteArticulo = useCallback((articulo: Articulo) => {
    setModalEliminarArticulo({ open: true, articulo });
  }, []);

  const handleEliminarArticuloResponse = useCallback(
    async (confirmed: boolean) => {
      const articulo = modalEliminarArticulo.articulo;
      setModalEliminarArticulo({ open: false, articulo: null });
      if (!confirmed || !articulo) return;
      try {
        const result = await fetchWithAuth<DeleteArticuloResponse>(
          `${API_BASE_URL}/articulos/${articulo.id_articulo}`,
          { method: 'DELETE' },
        );
        if (result && typeof result === 'object' && 'action' in result) {
          showSuccessModal(
            (result as DeleteArticuloResponse)?.message ||
              'El articulo fue marcado como dado de baja.',
          );
        } else {
          showSuccessModal('Articulo eliminado.');
        }
        if (editingArticulo && editingArticulo.id_articulo === articulo.id_articulo) {
          resetForm();
        }
        fetchArticulos();
      } catch (err) {
        showErrorModal(
          err instanceof Error
            ? err.message
            : 'No se pudo dar de baja el articulo.',
        );
      }
    },
    [
      editingArticulo,
      fetchArticulos,
      fetchWithAuth,
      modalEliminarArticulo.articulo,
      resetForm,
      showErrorModal,
      showSuccessModal,
    ],
  );

  const openCategoriaModal = useCallback(() => {
    setCategoriaModalOpen(true);
  }, []);

  const closeCategoriaModal = useCallback(() => {
    setCategoriaModalOpen(false);
    setCategoriaFormNombre('');
    setCategoriaEditando(null);
  }, []);

  const startEditCategoria = useCallback((categoria: Categoria) => {
    setCategoriaEditando(categoria);
    setCategoriaFormNombre(categoria.nombre);
    setCategoriaModalOpen(true);
  }, []);

  const handleCategoriaSubmit = useCallback(async () => {
    const nombre = categoriaFormNombre.trim();
    if (!nombre) {
      showErrorModal('El nombre de la categoria es obligatorio.');
      return;
    }
    try {
      setCategoriaSaving(true);
      if (categoriaEditando) {
        await fetchWithAuth(`${API_BASE_URL}/categorias/${categoriaEditando.id_categoria}`, {
          method: 'PUT',
          body: JSON.stringify({ nombre }),
        });
        showSuccessModal('Categoria actualizada.');
      } else {
        const created = await fetchWithAuth<Categoria>(
          `${API_BASE_URL}/categorias`,
          {
            method: 'POST',
            body: JSON.stringify({ nombre }),
          },
        );
        if (created?.id_categoria && !form.id_categoria) {
          setForm((prev) => ({
            ...prev,
            id_categoria: String(created.id_categoria),
          }));
        }
        showSuccessModal('Categoria creada.');
      }
      setCategoriaFormNombre('');
      setCategoriaEditando(null);
      fetchCategorias();
    } catch (err) {
      showErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la categoria.',
      );
    } finally {
      setCategoriaSaving(false);
    }
  }, [
    categoriaEditando,
    categoriaFormNombre,
    fetchCategorias,
    fetchWithAuth,
    form.id_categoria,
    showErrorModal,
    showSuccessModal,
  ]);

  const requestDeleteCategoria = useCallback((categoria: Categoria) => {
    setModalEliminarCategoria({ open: true, categoria });
  }, []);

  const handleEliminarCategoriaResponse = useCallback(
    async (confirmed: boolean) => {
      const categoria = modalEliminarCategoria.categoria;
      setModalEliminarCategoria({ open: false, categoria: null });
      if (!confirmed || !categoria) return;
      try {
        await fetchWithAuth(`${API_BASE_URL}/categorias/${categoria.id_categoria}`, {
          method: 'DELETE',
        });
        showSuccessModal('Categoria eliminada.');
        if (form.id_categoria === String(categoria.id_categoria)) {
          setForm((prev) => ({ ...prev, id_categoria: '' }));
        }
        if (categoriaFilter === String(categoria.id_categoria)) {
          setCategoriaFilter('todos');
          setPage(1);
        }
        fetchCategorias();
      } catch (err) {
        showErrorModal(
          err instanceof Error
            ? err.message
            : 'No se pudo eliminar la categoria.',
        );
      }
    },
    [
      categoriaFilter,
      fetchCategorias,
      fetchWithAuth,
      form.id_categoria,
      modalEliminarCategoria.categoria,
      showErrorModal,
      showSuccessModal,
    ],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCategoriaFilterChange = useCallback((value: string) => {
    setCategoriaFilter(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((next: number) => {
    setPage((prev) => {
      const total = Math.max(totalPages, 1);
      const safe = Math.min(Math.max(next, 1), total);
      if (safe === prev) return prev;
      return safe;
    });
  }, [totalPages]);

  const pageControls = useMemo(
    () => ({
      prevDisabled: articulosLoading || page <= 1,
      nextDisabled: articulosLoading || page >= totalPages,
    }),
    [articulosLoading, page, totalPages],
  );

  const categoriaModalState = {
    open: categoriaModalOpen,
    nombre: categoriaFormNombre,
    isEditing: Boolean(categoriaEditando),
    loading: categoriaSaving,
    onOpen: openCategoriaModal,
    onClose: closeCategoriaModal,
    onNameChange: setCategoriaFormNombre,
    onSubmit: handleCategoriaSubmit,
    onEdit: startEditCategoria,
    onDelete: requestDeleteCategoria,
  };

  const categoriaSelectOptions = useMemo(
    () => categorias.filter((cat) => cat.id_categoria !== CATEGORY_INACTIVE_ID),
    [categorias],
  );

  return {
    articulos,
    categorias,
    categoriaSelectOptions,
    tableLoading: articulosLoading,
    form,
    isEditing: Boolean(editingArticulo),
    formLoading: formSaving,
    search,
    categoriaFilter,
    page,
    totalPages,
    pageControls,
    handleFieldChange,
    handleSubmit,
    resetForm,
    startEdit,
    requestDeleteArticulo,
    handleEliminarArticuloResponse,
    handleSearchChange,
    handleCategoriaFilterChange,
    handlePageChange,
    modalError,
    modalExito,
    closeErrorModal,
    closeExitoModal,
    modalEliminarArticulo,
    modalEliminarCategoria,
    handleEliminarCategoriaResponse,
    categoriaModal: categoriaModalState,
    requireCategorySelection,
  };
};
