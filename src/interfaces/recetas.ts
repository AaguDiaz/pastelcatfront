export interface Ingrediente {
  id_materiaprima: number;
  nombre: string;
}

export interface IngredienteReceta {
  id_materiaprima: number;
  cantidad: number;
  unidadmedida: string;
}

export interface RecetaPayload {
  id_torta: number;
  porciones: number;
  ingredientes: IngredienteReceta[];
}