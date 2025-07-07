// src/app/bandejas/bdprueba.ts

export interface Torta {
  id: number;
  nombre: string;
  tamanio: string;
  precio: number;
}

export interface TortaEnBandeja extends Torta {
  porciones: number;
}

export interface Bandeja {
  id: number;
  nombre: string;
  precio: number;
  tamaño: string;
  imagen: string;
  tortas: TortaEnBandeja[];
}

// Datos simulados de tortas que se pueden agregar a las bandejas
export const mockTortas: Torta[] = [
  { id: 1, nombre: 'Lemon Pie', tamanio: 'Mediano', precio: 20000 },
  { id: 2, nombre: 'Cheesecake', tamanio: 'Grande', precio: 22000 },
  { id: 3, nombre: 'Tiramisú', tamanio: 'Mediano', precio: 25000 },
  { id: 4, nombre: 'Rogel', tamanio: 'Grande', precio: 28000 },
  { id: 5, nombre: 'Tofi', tamanio: 'Chico', precio: 18000 },
  { id: 6, nombre: 'Oreo', tamanio: 'Grande', precio: 30000 },
];

// Datos simulados de bandejas para mostrar en las tarjetas
// Hay 9 para probar la funcionalidad de "Ver Más"
export const mockBandejas: Bandeja[] = [
  {
    id: 1,
    nombre: 'Bandeja Desayuno Clásico',
    precio: 45000,
    tamaño: 'Mediano',
    imagen: '/cupcake.jpg', // Reemplazar con tus imágenes
    tortas: [
      { id: 1, nombre: 'Lemon Pie', tamanio: 'Mediano', precio: 20000, porciones: 2 },
      { id: 5, nombre: 'Tofi', tamanio: 'Chico', precio: 18000, porciones: 4 },
    ],
  },
  {
    id: 2,
    nombre: 'Bandeja Full Chocolate',
    precio: 58000,
    tamaño: 'Grande',
    imagen: '/cupcake.jpg',
    tortas: [
        { id: 6, nombre: 'Oreo', tamanio: 'Grande', precio: 30000, porciones: 6 },
    ],
  },
  // ... (Agregué 7 bandejas más para un total de 9)
  { id: 3, nombre: 'Bandeja Café Italiano', precio: 25000, tamaño: 'Chico', imagen: '/cupcake.jpg', tortas: [{ id: 3, nombre: 'Tiramisú', tamanio: 'Mediano', precio: 25000, porciones: 2 }]},
  { id: 4, nombre: 'Bandeja de Fiestas', precio: 70000, tamaño: 'Grande', imagen: '/cupcake.jpg', tortas: [{ id: 2, nombre: 'Cheesecake', tamanio: 'Grande', precio: 22000, porciones: 4 }, { id: 4, nombre: 'Rogel', tamanio: 'Grande', precio: 28000, porciones: 4 }]},
  { id: 5, nombre: 'Bandeja Aniversario', precio: 48000, tamaño: 'Mediano', imagen: '/cupcake.jpg', tortas: [{ id: 4, nombre: 'Rogel', tamanio: 'Grande', precio: 28000, porciones: 2 }]},
  { id: 6, nombre: 'Bandeja Especial', precio: 50000, tamaño: 'Mediano', imagen: '/cupcake.jpg', tortas: [{ id: 1, nombre: 'Lemon Pie', tamanio: 'Mediano', precio: 20000, porciones: 2 }, { id: 3, nombre: 'Tiramisú', tamanio: 'Mediano', precio: 25000, porciones: 2 }]},
  { id: 7, nombre: 'Bandeja Tentación', precio: 40000, tamaño: 'Chico', imagen: '/cupcake.jpg', tortas: [{ id: 5, nombre: 'Tofi', tamanio: 'Chico', precio: 18000, porciones: 4 }]},
  { id: 8, nombre: 'Bandeja de Amigos', precio: 62000, tamaño: 'Grande', imagen: '/cupcake.jpg', tortas: [{ id: 6, nombre: 'Oreo', tamanio: 'Grande', precio: 30000, porciones: 2 }, { id: 2, nombre: 'Cheesecake', tamanio: 'Grande', precio: 22000, porciones: 2 }]},
  { id: 9, nombre: 'Bandeja Individual', precio: 20000, tamaño: 'Chico', imagen: '/cupcake.jpg', tortas: [{ id: 1, nombre: 'Lemon Pie', tamanio: 'Mediano', precio: 20000, porciones: 1 }]},
];