'use client';

import { useBandejaData } from "@/hooks/useBandejaData";
import { FormAgregarBandeja } from "@/components/forms/FormAddEditBandeja";
import { FormTablaBandeja } from "@/components/forms/FormTarjetasBandejas";

const PageBandejas = () => {
  // Destructura TODAS las nuevas funciones y estados del hook
  const {
    bandejas,
    tortasDisponibles,
    bandejaSeleccionada,
    modo,
    loading,
    error,
    currentPage,
    totalPages,
    seleccionarBandeja,
    limpiarSeleccion,
    agregarBandeja,
    updateBandeja, // <-- Función nueva para el formulario
    deleteBandeja, // <-- Función nueva para la tabla
    handleSearch,  // <-- Función nueva para la tabla
    handleLoadMore // <-- Función nueva para la tabla
  } = useBandejaData();

  return (
    <main className="p-6">
      <div className="flex flex-col gap-6">
        {/* Formulario de Agregar/Editar */}
        <FormAgregarBandeja
            tortasDisponibles={tortasDisponibles.map(td => ({
              ...td,
              id: td.id_torta ?? '',
              precio: td.costo_por_porcion ?? 0
            }))}
            bandejaSeleccionada={bandejaSeleccionada}
            modo={modo}
            limpiarSeleccion={limpiarSeleccion}
            agregarBandeja={agregarBandeja}
            updateBandeja={updateBandeja} 
            loading={loading}
            error={error}
          />
          
        {/* Tabla/Tarjetas de Bandejas */}
        <FormTablaBandeja
            bandejas={bandejas}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            handleSearch={handleSearch}
            handleLoadMore={handleLoadMore}
            deleteBandeja={deleteBandeja}
            seleccionarBandeja={seleccionarBandeja}
        />
      </div>
    </main>
  );
};

export default PageBandejas;