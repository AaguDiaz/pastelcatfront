'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calcularCostoIngrediente } from '@/lib/calculoCostos'; 
import { Bandeja, MateriaPrimaBackend, IngredienteRecetaBackend, RecetaBackend, TortaBackend, TortaDisponible, TortaEnBandeja } from '@/interfaces/bandejas'; 


const API_BASE_URL = 'http://localhost:5000'; //'https://pastelcatback.onrender.com'; // 

export const useBandejaData = () => {
    const [bandejas, setBandejas] = useState<Bandeja[]>([]);
    const [tortasDisponibles, setTortasDisponibles] = useState<TortaDisponible[]>([]);
    const [bandejaSeleccionada, setBandejaSeleccionada] = useState<Bandeja | null>(null);
    const [modo, setModo] = useState<'create' | 'edit' | 'view'>('create');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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
                formData.append('imagen', bandejaData.imagen); // Adjuntar el objeto File directamente
            }
            // Las tortas se envían como un string JSON para que el backend lo parsee
            formData.append('tortas', JSON.stringify(bandejaData.tortas));

            formData.forEach((value, key) => {
                console.log(`→ FormData: ${key}`, value);
            });


            const response = await fetch(`${API_BASE_URL}/bandejas`, { // Nueva ruta POST /bandejas
                method: 'POST',
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });

            console.log("→ Response status:", response.status);
            const text = await response.text();
            console.log("→ Respuesta texto crudo:", text);

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    router.push('/login');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar la bandeja.');
            }

            const nuevaBandeja: Bandeja = await response.json(); // Casteamos a la interfaz Bandeja
            console.log('Bandeja guardada con éxito:', nuevaBandeja);
            // Si gestionas el estado de todas las bandejas aquí, podrías añadirla
            setBandejas(prevBandejas => [...prevBandejas, nuevaBandeja]); // Actualiza el estado de bandejas
            return nuevaBandeja;
        } catch (err: any) {
            console.error("→ Error atrapado en agregarBandeja:", err);
            setError(err.message || 'Error desconocido al agregar bandeja.');
            throw err; // Re-lanza el error para que el componente pueda manejarlo
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTortasYCalcularCostos();

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
    };
};