export interface ApiTorta {
    id_torta: number;
    nombre: string;
    tamanio: string;
}

export interface ApiIngrediente {
    id_materiaprima: number;
    nombre: string;
}

export interface ApiReceta {
    id_receta: number;
    torta: ApiTorta;
    porciones: number;
}

export interface ApiRecetaIngrediente {
    id: number;
    ingrediente: string;
    cantidad: number;
    unidad: string;
    precio: number;
}