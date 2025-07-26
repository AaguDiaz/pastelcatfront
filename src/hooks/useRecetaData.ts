import { useEffect, useState, useCallback } from 'react';
import { TortaSelect } from '@/interfaces/tortas';
import { Ingrediente,Receta ,RecetaPayload } from '@/interfaces/recetas'; 
import { ApiTorta,ApiIngrediente,ApiReceta,ApiRecetaIngrediente } from '@/interfaces/api'; // Asegúrate de que Api esté definido correctamente

const API_BASE_URL = 'https://pastelcatback.onrender.com'; //'http://localhost:5000'; //'https://pastelcatback.onrender.com'; 

type ModalState = {
  mostrar: boolean;
  mensaje: string;
};

export const useRecetaData = () => {
  // Estados de datos
  const [tortas, setTortas] = useState<TortaSelect[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de UI y formulario
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(null);
  const [modo, setModo] = useState<'view' | 'edit' | null>(null);

  // Estados de modales
  const [modalExito, setModalExito] = useState<ModalState>({ mostrar: false, mensaje: '' }); 
  const [modalError, setModalError] = useState<ModalState>({ mostrar: false, mensaje: '' });

  // --- FUNCIÓN DE FETCH CON AUTENTICACIÓN ---
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login'; 
      throw new Error('No autorizado');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    // Si la respuesta no tiene contenido (ej. en un DELETE), devolvemos un objeto vacío
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {};

  }, []);

  // --- CARGA INICIAL DE DATOS ---
  const fetchInitialData = useCallback(async () => {
  try {
    setLoading(true);
    const [dataTortas, dataIngredientes, dataRecetas] = await Promise.all([
      fetchWithAuth(`${API_BASE_URL}/receta/tortas`),
      fetchWithAuth(`${API_BASE_URL}/receta/ingredientes`),
      fetchWithAuth(`${API_BASE_URL}/receta`),
    ]);

    setTortas(
      (dataTortas as ApiTorta[]).map((t: ApiTorta) => ({
        id_torta: t.id_torta,
        nombre: `${t.nombre}${t.tamanio ? ' ' + t.tamanio : ''}`,
      }))
    );

    setIngredientes(
      (dataIngredientes as ApiIngrediente[]).map((i: ApiIngrediente) => ({
        id_materiaprima: i.id_materiaprima,
        nombre: i.nombre,
      }))
    );

    // Transformar las recetas para incluir ingredientes
    const recetasTransformadas = await Promise.all(
      (dataRecetas as ApiReceta[]).map(async (receta: ApiReceta) => {
        const ingredientesReceta = await fetchWithAuth(`${API_BASE_URL}/receta/${receta.id_receta}/ingredientes`);
        return {
          id_receta: receta.id_receta,
          torta: {
            id_torta: receta.torta.id_torta,
            nombre: receta.torta.nombre,
            tamanio: receta.torta.tamanio,
          },
          porciones: receta.porciones,
          ingredientes: (ingredientesReceta as ApiRecetaIngrediente[]).map((ing: ApiRecetaIngrediente) => ({
            id_materiaprima: ing.id,
            nombre: ing.ingrediente,
            cantidad: ing.cantidad,
            unidadmedida: ing.unidad,
            precio: ing.precio,
          })),
        };
      })
    );

    setRecetas(recetasTransformadas);
    console.log('Recetas transformadas:', recetasTransformadas);
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
    setModalError({ mostrar: true, mensaje: 'No se pudieron cargar los datos iniciales.' });
  } finally {
    setLoading(false);
  }
}, [fetchWithAuth]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- MANEJADORES DE ACCIONES DE LA TABLA ---
  const seleccionarReceta = (id: number, mode: 'view' | 'edit') => {
  console.log('Buscando receta con id:', id);
  console.log('Estado recetas:', recetas);
  const receta = recetas.find((r) => r.id_receta === id);
  if (receta) {
    console.log('Receta encontrada:', receta);
    setRecetaSeleccionada({ ...receta }); // Crear una nueva referencia
    setModo(mode);
    console.log('Estado actualizado - recetaSeleccionada:', { ...receta }, 'modo:', mode);
  } else {
    console.error('Receta no encontrada para id:', id);
    setModalError({ mostrar: true, mensaje: `No se encontró la receta con ID ${id}.` });
  }
};

  const limpiarSeleccion = () => {
    setRecetaSeleccionada(null);
    setModo(null);
  };
  
  // --- FUNCIONES CRUD ---
  const confirmarReceta = async (payload: RecetaPayload) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/receta`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setModalExito({ mostrar: true, mensaje: 'Receta guardada correctamente.' });
      fetchInitialData(); // Recargamos la lista de recetas
      limpiarSeleccion();
    } catch (error: unknown) {
      console.error('Error al confirmar receta:', error);
        if (error instanceof Error) {
            setModalError({ mostrar: true, mensaje: error.message }); // 
        } else {
            setModalError({ mostrar: true, mensaje: 'Ocurrió un error inesperado.' });
        }
    }
  };

  const actualizarReceta = async (id: number, payload: Omit<RecetaPayload, 'id_torta'>) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/receta/${id}`, {
        method: 'PUT', 
        body: JSON.stringify(payload), 
      });
      setModalExito({ mostrar: true, mensaje: 'Receta actualizada correctamente.' });
      fetchInitialData(); // Recargamos la lista
      limpiarSeleccion();
    } catch (error: unknown) {
      console.error('Error al actualizar receta:', error);
        if (error instanceof Error) {
            setModalError({ mostrar: true, mensaje: error.message }); // 
        } else {
            setModalError({ mostrar: true, mensaje: 'Ocurrió un error inesperado.' });
        }
    }
  };

  const eliminarReceta = async (id: number) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/receta/${id}`, {
        method: 'DELETE', 
      });
      setModalExito({ mostrar: true, mensaje: 'Receta eliminada correctamente.' });
      fetchInitialData(); // Recargamos la lista
    } catch (error: unknown) {
      console.error('Error al eliminar receta:', error);
        if (error instanceof Error) {
            setModalError({ mostrar: true, mensaje: error.message }); // 
        } else {
            setModalError({ mostrar: true, mensaje: 'Ocurrió un error inesperado.' });
        }
    }
  };

  return {
    // Datos y estado de carga
    tortas,
    ingredientes,
    recetas,
    loading,
    // Estado y manejadores del formulario
    modo,
    recetaSeleccionada,
    seleccionarReceta,
    limpiarSeleccion,
    // Funciones CRUD
    confirmarReceta,
    actualizarReceta,
    eliminarReceta,
    // Modales
    modalExito,
    setModalExito,
    modalError,
    setModalError,
    setRecetaSeleccionada,
    setModo,
  };
};