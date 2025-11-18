export interface Torta {
    id_torta: number;
    nombre: string;
    precio: string | number;
    tamanio: string;
    imagen: string | null;
}

export interface TortasApiResponse {
    id_torta: number;
    nombre: string;
    precio: number;
    tamanio: string;
    imagen: string;
}

export interface TortaSelect {
  id_torta: number;
  nombre: string;
}