'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react'; // Íconos para las acciones
import { useRecetaData } from '@/hooks/useRecetaData';
import EliminarModal from '../modals/eliminar';
import { Receta } from '@/interfaces/recetas';

const FormTablaReceta = () => {
  const { recetas, loading,seleccionarReceta,eliminarReceta } = useRecetaData();

  const [filtroNombre, setFiltroNombre] = useState('');
  const [modalEliminar, setModalEliminar] = useState<{ isOpen: boolean; receta: Receta | null }>({ isOpen: false, receta: null });

  // Lógica para filtrar las recetas según el input de búsqueda
  const recetasFiltradas = recetas.filter(receta => {
    const nombreCompleto = `${receta.torta.nombre} ${receta.torta.tamanio}`.toLowerCase();
    if (!receta || !receta.torta){
        return false; // Si la receta o la torta no existen, no incluirla
    }
    return nombreCompleto.includes(filtroNombre.toLowerCase());
  });

  //Handlers para las acciones
  const handleVerDetalles = (id: number) => {
    seleccionarReceta(id, 'view');
  };

  const handleEditar = (id: number) => {
    seleccionarReceta(id, 'edit');
  };

  const handleAbrirModalEliminar = (receta: Receta) => {
    setModalEliminar({ isOpen: true, receta });
  };

  const handleCerrarModalEliminar = async(confirmed: boolean) => {
    if(confirmed && modalEliminar.receta) {
      await eliminarReceta(modalEliminar.receta.id_receta);
    }
    setModalEliminar({ isOpen: false, receta: null });
  };

  return (
    <div className="bg-pastel-cream text-black p-6 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-4">Gestionar Recetas</h2>
      {/* Input de Búsqueda */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar por nombre y tamaño de torta..."
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Contenedor de la tabla  */}
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="border-b">
              <th className="py-2">Nombre Torta</th>
              <th className="py-2">Porciones</th>
              <th className="py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-4">Cargando recetas...</td>
              </tr>
            ) : recetasFiltradas.length > 0 ? (
              recetasFiltradas.map(receta => (
                <tr key={receta.id_receta} className="border-t">
                  <td className="py-3 font-medium">{`${receta.torta.nombre} (${receta.torta.tamanio})`}</td>
                  <td className="py-3">{receta.porciones}</td>
                  <td className="py-3 flex justify-left items-center gap-2">
                    <Button title="Editar" size="sm" className="bg-pastel-blue hover:bg-blue-400" onClick={() => handleEditar(receta.id_receta)}>
                      <Pencil size={16} /> Editar
                    </Button>
                    <Button title="Eliminar" size="sm" className="bg-pastel-red hover:bg-red-400" onClick={() => handleAbrirModalEliminar(receta)}>
                      <Trash2 size={16} /> Eliminar
                    </Button>
                    <Button title="Ver Detalles" size="sm" className="bg-pastel-yellow hover:bg-yellow-400" onClick={() => handleVerDetalles(receta.id_receta)}>
                      <Eye size={16} /> Ver Detalles
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-4">No se encontraron recetas que coincidan con la búsqueda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {modalEliminar.isOpen && modalEliminar.receta && (
        <EliminarModal
          nombre={`${modalEliminar.receta.torta.nombre} (${modalEliminar.receta.torta.tamanio})`}
          contexto="Recetas"
          onClose={handleCerrarModalEliminar}
        />
      )}
    </div>
  );
};

export default FormTablaReceta;