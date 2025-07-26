
const conversiones = {
  // De cualquier unidad de peso a gramos
  peso: {
    gr: 1,
    grs: 1,
    g: 1,
    kg: 1000,
    kgs: 1000,
  },
  // De cualquier unidad de volumen a mililitros
  volumen: {
    ml: 1,
    cc: 1,
    l: 1000,
    lt: 1000,
    lts: 1000,
  },
};

export function normalizarUnidad(cantidad, unidad) {
  const unidadNormalizada = unidad.toLowerCase().replace('.', '');
  
  if (typeof unidad !== 'string' || !unidad) {
    return { valor: cantidad, tipo: 'unidad' };
  }

  if (conversiones.peso[unidadNormalizada]) {
    return { valor: cantidad * conversiones.peso[unidadNormalizada], tipo: 'peso' };
  }
  if (conversiones.volumen[unidadNormalizada]) {
    return { valor: cantidad * conversiones.volumen[unidadNormalizada], tipo: 'volumen' };
  }
  // Si no es peso ni volumen, se trata como 'unidad'
  return { valor: cantidad, tipo: 'unidad' };
}

export function calcularCostoIngrediente(ingrediente) {
  const {
    cantidad,
    unidad,
    precio,
    cantidadMateriaPrima,
    unidadmedida,
  } = ingrediente;
  const normReceta = normalizarUnidad(cantidad, unidad);
  const normBase = normalizarUnidad(cantidadMateriaPrima, unidadmedida);

  // Si los tipos de unidad no coinciden (ej: Kg y Litro), no se puede calcular.
  // O si el precio base es 0.
  if (normReceta.tipo !== normBase.tipo || precio === 0) {
    return 0;
  }
  
  // Si el valor base es 0, evitamos división por cero.
  if (normBase.valor === 0) {
    return 0;
  }

  // Calculamos el costo por unidad normalizada (ej: costo por gramo)
  const costoPorUnidadNormalizada = precio / normBase.valor;

  // Calculamos el costo final para la cantidad usada en la receta
  const costoFinal = costoPorUnidadNormalizada * normReceta.valor;

  return costoFinal;
}