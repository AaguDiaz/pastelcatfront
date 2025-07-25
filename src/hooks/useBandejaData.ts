'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { calcularCostoIngrediente } from '@/lib/calculoCostos'; 
import { Bandeja, TortaBackend, TortaDisponible, TortaEnBandeja } from '@/interfaces/bandejas'; 

const API_BASE_URL = 'http://localhost:5000'; //'https://pastelcatback.onrender.com'; // 

export const useBandejaData = () => {
    const [bandejas, setBandejas] = useState<Bandeja[]>([]);
    const [tortasDisponibles, setTortasDisponibles] = useState<TortaDisponible[]>([]);
    const [bandejaSeleccionada, setBandejaSeleccionada] = useState<Bandeja | null>(null);
    const [modo, setModo] = useState<'create' | 'edit' | 'view'>('create');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

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

    const fetchTortasYCalcularCostos = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/bandejas/tortas`, { 
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }),
                       'Content-Type': 'application/json',
                    }
                });
                if (response.status === 404) {
                    return null;
                }
                if (!response.ok) {
                   if (response.status === 401 || response.status === 403) {
                        localStorage.removeItem('token');
                        router.push('/login');
                        return null;
                    }       
                    let errorMessage = 'Error al obtener los detalles de la torta';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch { /* No hacer nada si el cuerpo no es JSON */ }
                         throw new Error(errorMessage);
                }
                const data: TortaBackend[] = await response.json();
                const tortasProcesadas: TortaDisponible[] = data.map(torta => {
                    if (!torta.receta || torta.receta.length === 0 || !torta.receta[0].porciones) {
                    return null; // Filtramos tortas sin receta válida
                    }

                    const receta = torta.receta[0]; // Accedemos a la receta real

                    let costoTotalReceta = 0;

                    if (receta.ingredientereceta?.length > 0) {
                    receta.ingredientereceta.forEach(ingredienteReceta => {
                        if (ingredienteReceta.materiaprima) {
                        const ingredienteParaCalculo = {
                            cantidad: ingredienteReceta.cantidad,
                            unidad: ingredienteReceta.unidadmedida,
                            precio: ingredienteReceta.materiaprima.preciototal,
                            cantidadMateriaPrima: ingredienteReceta.materiaprima.cantidad,
                            unidadmedida: ingredienteReceta.materiaprima.unidadmedida,
                        };
                            const parsedCantidad = Number(ingredienteParaCalculo.cantidad);
                            const parsedPrecio = Number(ingredienteParaCalculo.precio);
                            const parsedCantidadMateriaPrima = Number(ingredienteParaCalculo.cantidadMateriaPrima);

                            if (isNaN(parsedCantidad) || isNaN(parsedPrecio) || isNaN(parsedCantidadMateriaPrima)) {
                                costoTotalReceta += 0; // O manejar el error de otra forma
                            } else {
                                const calculo = calcularCostoIngrediente({
                                    ...ingredienteParaCalculo,
                                    cantidad: parsedCantidad,
                                    precio: parsedPrecio,
                                    cantidadMateriaPrima: parsedCantidadMateriaPrima
                                });
                                 costoTotalReceta += calculo;
                            }
                        } 
                    });
                } 

                const costoPorcion = receta.porciones > 0 ? costoTotalReceta / receta.porciones : 0;
               
                return {
                    id_torta: torta.id_torta,
                    nombre: torta.nombre,
                    tamanio: torta.tamanio,
                    porciones_receta: receta.porciones,
                    costo_por_porcion: costoPorcion,
                };
            })
            .filter((torta): torta is TortaDisponible => torta !== null);


                setTortasDisponibles(tortasProcesadas);
            } catch (error) {
                console.error("Error al obtener y procesar tortas:", error);
                // Opcionalmente, puedes establecer un estado de error o mostrar un mensaje al usuario
            }
        };

    const agregarBandeja = async (bandejaData: { nombre: string; precio: number | null; tamanio: string; imagen: File | null; tortas: TortaEnBandeja[] }) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                throw new Error('No autenticado. Por favor, inicia sesión.');
            }

            const formData = new FormData();
            formData.append('nombre', bandejaData.nombre);
            formData.append('tamanio', bandejaData.tamanio);
            if (bandejaData.precio !== null) {
                formData.append('precio', String(bandejaData.precio));
            }
            if (bandejaData.imagen) {
                formData.append('imagen', bandejaData.imagen);
            }
            formData.append('tortas', JSON.stringify(bandejaData.tortas));


            const response = await fetch(`${API_BASE_URL}/bandejas`, {
                method: 'POST',
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });

            const rawText = await response.text();

            let data: any;
            try {
                data = JSON.parse(rawText);
            } catch {
                 data = null;
            }

            if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                router.push('/login');
            }
            throw new Error(data?.message || 'Error al guardar la bandeja.');
            }

            console.log('Bandeja guardada con éxito:', data);
            setBandejas(prevBandejas => [...prevBandejas, data]);
            return data;

        } catch (err: any) {
            console.error("→ Error atrapado en agregarBandeja:", err);
            setError(err.message || 'Error desconocido al agregar bandeja.');
            throw err;
        } finally {
            setLoading(false);
        }
        };
    // --- OBTENER BANDEJAS (CON PAGINACIÓN Y BÚSQUEDA) ---
    const fetchBandejas = useCallback(async (page: number, search: string, loadMore = false) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/bandejas?page=${page}&search=${search}`, {
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` }),
                       'Content-Type': 'application/json',
                    }
                });
                if (response.status === 404) {
                    return null;
                }
                if (!response.ok) {
                   if (response.status === 401 || response.status === 403) {
                        localStorage.removeItem('token');
                        router.push('/login');
                        return null;
                    }       
                    let errorMessage = 'Error al obtenerla bandeja';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch { /* No hacer nada si el cuerpo no es JSON */ }
                         throw new Error(errorMessage);
                }
        
        if (!response.ok) throw new Error('Error al obtener las bandejas.');
        
        const result = await response.json();
        
        // Si es "Cargar Más", añade los resultados. Si no, reemplaza.
        setBandejas(loadMore ? [...bandejas, ...result.data] : result.data);
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);

        } catch (err: any) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    }, [bandejas]); // Dependencia 'bandejas' para el 'loadMore'

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        fetchBandejas(1, term, false); // Siempre busca desde la página 1
    };
    
    const handleLoadMore = () => {
        if (currentPage < totalPages) {
        fetchBandejas(currentPage + 1, searchTerm, true);
        }
    };

    const updateBandeja = async (bandejaId: number, data: FormData) => {
        setLoading(true);
        setError(null);
        try {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            throw new Error('No autenticado. Por favor, inicia sesión.');
        }

        const response = await fetch(`${API_BASE_URL}/bandejas/${bandejaId}`, {
            method: 'PUT',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: data, // Con FormData, el navegador pone el Content-Type correcto
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Error al actualizar la bandeja.');
        }
        const bandejaActualizada = await response.json();
        
        // Actualiza el estado local para reflejar el cambio en la UI al instante
        setBandejas(bandejas.map(b => (b.id_bandeja === bandejaId ? bandejaActualizada : b)));

        } catch (err: any) {
        setError(err.message);
        throw err; // Re-lanzar para que el formulario lo pueda atrapar
        } finally {
        setLoading(false);
        }
    };
  
    const deleteBandeja = async (bandejaId: number) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            throw new Error('No autenticado. Por favor, inicia sesión.');
        }
        const response = await fetch(`${API_BASE_URL}/bandejas/${bandejaId}`, {
            method: 'DELETE',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Error al eliminar la bandeja.');
        }
        // Actualiza el estado local eliminando la bandeja
        setBandejas(bandejas.filter(b => b.id_bandeja !== bandejaId));
        } catch (err: any) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchTortasYCalcularCostos();
        fetchBandejas(1, '');
    }, []); // El efecto se ejecuta una sola vez al montar el componente

    const seleccionarBandeja = (id: number, newMode: 'edit' | 'view') => {
        const bandeja = bandejas.find(b => b.id_bandeja === id);
        if (bandeja) {
            setBandejaSeleccionada(bandeja);
            setModo(newMode);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const limpiarSeleccion = () => {
        setBandejaSeleccionada(null);
        setModo('create');
    };

    return {
        bandejas,
        tortasDisponibles,
        bandejaSeleccionada,
        modo,
        seleccionarBandeja,
        limpiarSeleccion,
        agregarBandeja,
        loading,
        error,
        fetchBandejas,
        handleSearch,
        handleLoadMore,
        updateBandeja,
        deleteBandeja,
        currentPage,
        totalPages
    };
};