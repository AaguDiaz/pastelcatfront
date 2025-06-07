import { TortaSelect } from "./tortas";
// ModalState interface defined locally because './modal' module was not found
export interface ModalState {
  open: boolean;
  message?: string;
}

export interface Ingrediente {
  id_materiaprima: number;
  nombre: string;
}

export interface IngredienteRecetaAgregado {
  id_materiaprima: number;
  cantidad: number;
  unidadmedida: string;
}

export interface RecetaPayload {
  id_torta: number;
  porciones: number;
  ingredientes: IngredienteRecetaAgregado[];
}

export interface IngredienteReceta {
  id_materiaprima: number;
  nombre: string;
  cantidad: number;
  unidadmedida: string;
};
export interface Receta {
  id_receta: number;
  torta: {
    id_torta: number;
    nombre: string;
    tamanio: string;
  };
  porciones: number;
  ingredientes: IngredienteReceta[];
};

export interface RecetaData {
  tortas: TortaSelect[];
  ingredientes: Ingrediente[];
  recetas: Receta[];
  loading: boolean;
  modo: 'view' | 'edit' | null;
  recetaSeleccionada: Receta | null;
  seleccionarReceta: (id: number, mode: 'view' | 'edit') => void;
  limpiarSeleccion: () => void;
  confirmarReceta: (payload: RecetaPayload) => Promise<void>;
  actualizarReceta: (id: number, payload: Omit<RecetaPayload, 'id_torta'>) => Promise<void>;
  eliminarReceta: (id: number) => Promise<void>;
  modalExito: ModalState;
  setModalExito: (state: ModalState) => void;
  modalError: ModalState;
  setModalError: (state: ModalState) => void;
}