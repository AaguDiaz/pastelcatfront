import { useEffect, useState } from 'react';
import { TortaSelect } from '@/interfaces/tortas';
import { Ingrediente, RecetaPayload } from '@/interfaces/recetas';

const API_BASE_URL = 'http://localhost:5000'; // o tu URL de producción

type ModalState = {
    mostrar: boolean;
    mensaje: string;
};

export const useRecetaData = () => {
  const [tortas, setTortas] = useState<TortaSelect[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalExito, setModalExito] = useState<ModalState>({
    mostrar: false,
    mensaje: '',
  });
  const [modalError, setModalError] = useState<ModalState>({
    mostrar: false,
    mensaje: '',
  });

  
    useEffect(() => {
        fetchRecetaData();
    }, []);

  const fetchWithAuth = async (url: string): Promise<any> => {
    const token = localStorage.getItem('token');

    const res = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login'; // o router.push si estás en un componente
      }
      const errorText = await res.text();
      throw new Error(`Error ${res.status}: ${errorText}`);
    }

    return res.json();
  };

  const fetchRecetaData = async () => {
    try {
      const [dataTortas, dataIngredientes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/receta/tortas`),
        fetchWithAuth(`${API_BASE_URL}/receta/ingredientes`),
      ]);

      setTortas(
              dataTortas.map((t: any) => ({
                  id_torta: t.id_torta,
                   nombre: `${t.nombre}${t.tamaño ? ' ' + t.tamaño : ''}`, // ← evita undefined
              }))
      );
      setIngredientes(dataIngredientes.map((i: any) => ({
        id_materiaprima: i.id_materiaprima,
        nombre: i.nombre,
      })));
    } catch (error) {
      console.error('Error al cargar datos de receta:', error);
    } finally {
      setLoading(false);
    }
  };
  const confirmarReceta = async (payload: RecetaPayload) => {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/receta`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        
        body: JSON.stringify(payload),
        });

        if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }

        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
        }

        setModalExito({ mostrar: true, mensaje: 'Receta confirmada con éxito.' }); // mostrar modal de éxito
    } catch (error: any) {
        console.error('Error al confirmar receta:', error);
        setModalError({ mostrar: true, mensaje: error.message });
    }
    };


  return { tortas,
    ingredientes,
    loading,
    confirmarReceta,
    modalExito,
    setModalExito,
    modalError,
    setModalError };
};
