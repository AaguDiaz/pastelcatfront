import { useState, useEffect, useCallback} from 'react';
import { useRouter } from 'next/navigation';
import { Torta, TortasApiResponse } from '../interfaces/tortas';
import {api} from '@/lib/api';

const API_BASE_URL = api;
export const useTortasData = (initialSearch = '') => {
  const [tortas, setTortas] = useState<Torta[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Para carga inicial o nueva búsqueda
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Para el botón "Ver Más"
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isCreating, setIsCreating] = useState(false); // Para el estado de creación de tortas
  const [createError, setCreateError] = useState<string | null>(null);

  const router = useRouter();

  const fetchData = useCallback(async (pageToFetch: number, currentSearchTerm: string) => {
    if (pageToFetch === 1) { // Carga inicial o nueva búsqueda
      setIsLoading(true);
      setTortas([]); // Limpiar tortas anteriores para una nueva búsqueda o carga inicial
    } else { // "Ver Más"
      setIsFetchingMore(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE_URL}/tortas?page=${pageToFetch}&search=${encodeURIComponent(currentSearchTerm)}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          // Asegurar que los estados de carga se reseteen antes de salir
          if (pageToFetch === 1) setIsLoading(false); else setIsFetchingMore(false);
          return;
        }
        let errorMessage = 'Error al obtener tortas';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch { /* No hacer nada si el cuerpo no es JSON */ }
        throw new Error(errorMessage);
      }

      const responseData = await res.json();
      const backendData: TortasApiResponse[] = responseData.data || [];
      const backendTotalPages: number = responseData.totalPages || 0;

      const mappedData: Torta[] = backendData.map((item) => ({
        id_torta: item.id_torta,
        nombre: item.nombre,
        precio: Number(item.precio),
        tamaño: item.tamanio,
        imagen: item.imagen || '/cupcake.jpg',
      }));

      if (pageToFetch === 1) {
        setTortas(mappedData);
      } else {
        setTortas((prevTortas) => [...prevTortas, ...mappedData]);
      }
      setTotalPages(backendTotalPages);
      setCurrentPage(pageToFetch); // Actualizar la página actual después de una carga exitosa

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    } finally {
      if (pageToFetch === 1) {
        setIsLoading(false);
      } else {
        setIsFetchingMore(false);
      }
    }
  }, [router]); // router es una dependencia

  const fetchRecetaDetails = async (tortaID: number)=>{
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/receta/detalles/torta/${tortaID}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });
      if (res.status === 404) {
          return null;
        }
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          return null;
        }
        let errorMessage = 'Error al obtener los detalles de la torta';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch { /* No hacer nada si el cuerpo no es JSON */ }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      return data; // Retornar los detalles de la torta
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al obtener los detalles de la torta');
      return null;
    }
  }
  // Efecto para la carga inicial y cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1); 
    fetchData(1, searchTerm);
  }, [searchTerm, fetchData]);


  const handleLoadMore = () => {
    if (currentPage < totalPages && !isFetchingMore && !isLoading) {
      fetchData(currentPage + 1, searchTerm);
    }
  };

  const handleSearchTermChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };
  const refetch = () => {
    setCurrentPage(1);
    fetchData(1, searchTerm);
  };

  // Nueva función para crear una torta
  const createTorta = async (formData: FormData) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tortas`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = 'Error al crear la torta';
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
        } else {
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch { /* No hacer nada si el cuerpo no es JSON */ }
        }
        throw new Error(errorMessage);
      }

      refetch(); // Recargar la lista de tortas para incluir la nueva
      return true; // Indicar éxito
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al crear la torta');
      return false; // Indicar fallo
    } finally {
      setIsCreating(false);
    }
  };

  const updateTorta = async (id: number, formData: FormData) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tortas/${id}`, {
        method: 'PUT',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = 'Error al actualizar la torta';
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
        } else {
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {}
        }
        throw new Error(errorMessage);
      }

      refetch();
      return true;
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al actualizar la torta');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTorta = async (id: number) => {
    setIsCreating(true); // Reutilizamos isCreating para bloquear acciones mientras se elimina
    setCreateError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tortas/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        let errorMessage = 'Error al eliminar la torta';
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
        } else {
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {}
        }
        throw new Error(errorMessage);
      }

      refetch(); // Hacer refetch para actualizar la lista
      return true;
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al eliminar la torta');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const canLoadMore = currentPage < totalPages;

  return {
    tortas, // Array acumulado de tortas mostradas
    isLoading, // Verdadero durante la carga inicial o una nueva búsqueda
    isFetchingMore, // Verdadero cuando se está cargando más con "Ver Más"
    error,
    canLoadMore, // Booleano: true si hay más páginas para cargar
    setSearchTerm: handleSearchTermChange,
    handleLoadMore,
    refetch,
    createTorta,
    updateTorta,
    deleteTorta,
    isCreating,
    createError,
    fetchRecetaDetails, // Función para obtener detalles de la receta
  };
};