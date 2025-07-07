'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Importa las funciones de cálculo de costos
import { normalizarUnidad, calcularCostoIngrediente } from '@/lib/calculoCostos'; // Asegúrate de que la ruta sea correcta
import { Bandeja } from '@/app/bandeja/bdprueba'; // Mantener el tipo Bandeja si se usa para otros estados

const API_BASE_URL = 'http://localhost:5000'; //'https://pastelcatback.onrender.com'; // 

// Definir los tipos de datos brutos que vienen del backend
interface MateriaPrimaBackend {
    id_materiaprima: number;
    nombre: string;
    unidadmedida: string;
    preciototal: number; // Precio de la cantidad base de la materia prima
    cantidad: number; // Cantidad de la materia prima en su unidad base
}

interface IngredienteRecetaBackend {
    cantidad: number;
    unidadmedida: string;
    materiaprima: MateriaPrimaBackend;
}

interface RecetaBackend {
    id_receta: number;
    porciones: number;
    ingredientereceta: IngredienteRecetaBackend[];
}

interface TortaBackend {
    id_torta: number;
    nombre: string;
    tamanio: string;
    receta: RecetaBackend []; // Puede ser null si no tiene receta
}

// Definir el tipo de Torta ya procesada para el frontend
interface TortaDisponible {
    id_torta: number;
    nombre: string;
    tamanio: string;
    porciones_receta: number;
    costo_por_porcion: number;
}

export const useBandejaData = () => {
    const [bandejas, setBandejas] = useState<Bandeja[]>([]); // Se obtendrá del backend más adelante
    const [tortasDisponibles, setTortasDisponibles] = useState<TortaDisponible[]>([]);
    const [bandejaSeleccionada, setBandejaSeleccionada] = useState<Bandeja | null>(null);
    const [modo, setModo] = useState<'create' | 'edit' | 'view'>('create');

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

    useEffect(() => {
        fetchTortasYCalcularCostos();

    }, []); // El efecto se ejecuta una sola vez al montar el componente

    const seleccionarBandeja = (id: number, newMode: 'edit' | 'view') => {
        const bandeja = bandejas.find(b => b.id === id);
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
    };
};