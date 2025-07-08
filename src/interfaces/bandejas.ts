export interface Bandeja {
    id_bandeja: number; // Suponiendo que Supabase genera un ID para las bandejas
    nombre: string;
    precio: number | null; // Puede ser null
    tamanio: string;
    imagen: string | null; // URL de la imagen en Supabase Storage
}

// El tipo TortaDisponible ahora viene del hook procesado
export interface TortaDisponible {
    id_torta: number;
    nombre: string;
    tamanio: string;
    porciones_receta: number; // Porciones que rinde la receta de esta torta
    costo_por_porcion: number; // Costo pre-calculado por porción de esta torta
}

// Tipo para las tortas que se van agregando a la bandeja
export interface TortaEnBandeja {
    id_torta: number;
    nombre: string;
    tamanio: string;
    porciones: number; // Cantidad de porciones de esta torta en particular para la bandeja
    precio: number; // Precio total de esas porciones para la bandeja
}



export interface MateriaPrimaBackend {
    id_materiaprima: number;
    nombre: string;
    unidadmedida: string;
    preciototal: number; // Precio de la cantidad base de la materia prima
    cantidad: number; // Cantidad de la materia prima en su unidad base
}

export interface IngredienteRecetaBackend {
    cantidad: number;
    unidadmedida: string;
    materiaprima: MateriaPrimaBackend;
}

export interface RecetaBackend {
    id_receta: number;
    porciones: number;
    ingredientereceta: IngredienteRecetaBackend[];
}

export interface TortaBackend {
    id_torta: number;
    nombre: string;
    tamanio: string;
    receta: RecetaBackend []; // Puede ser null si no tiene receta
}

