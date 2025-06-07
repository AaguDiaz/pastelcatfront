'use client';

import React from 'react';
import FormAgregarReceta from '@/components/forms/FormAgregarReceta';
import FormTablaReceta from '@/components/forms/FormTablaReceta';
import { useRecetaData } from '@/hooks/useRecetaData'; // Importa el hook aquí

const PageReceta = () => {
  // Llama al hook UNA SOLA VEZ en el componente padre.
  const recetaData = useRecetaData();

  if (recetaData.loading) {
    return <div className="p-6 text-center">Cargando datos...</div>;
  }

  return (
    <main className="p-6">
      <div className="flex flex-col gap-6">
        {/* Pasa todos los datos y funciones necesarios a FormAgregarReceta */}
        <FormAgregarReceta
          // Pasa todos los valores y setters que el formulario necesita
          {...recetaData}
        />
        
        {/* Pasa solo los datos y funciones que la tabla necesita */}
        <FormTablaReceta
          recetas={recetaData.recetas}
          seleccionarReceta={recetaData.seleccionarReceta}
          eliminarReceta={recetaData.eliminarReceta}
        />
      </div>
    </main>
  );
};

export default PageReceta;