// src/app/bandejas/page.tsx
'use client';

import { useBandejaData } from "@/hooks/useBandejaData";
import { FormAgregarBandeja } from "@/components/forms/FormAddEditBandeja";
import { FormTablaBandeja } from "@/components/forms/FormTarjetasBandejas";
import { TortaEnBandeja } from "@/interfaces/bandejas";

const PageBandejas = () => {
  // Se llama al hook una sola vez para compartir el estado
  const {
    bandejas,
    tortasDisponibles,
    bandejaSeleccionada,
    modo,
    seleccionarBandeja,
    limpiarSeleccion,
    agregarBandeja,
    loading,
    error
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
            loading={loading}
            error={error}
          />
        {/* Tabla/Tarjetas de Bandejas */}
        <FormTablaBandeja
          bandejas={bandejas}
          seleccionarBandeja={seleccionarBandeja}
        />
      </div>
    </main>
  );
};

export default PageBandejas;