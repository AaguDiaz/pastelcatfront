'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Info, Loader2 } from 'lucide-react';
import { Bandeja } from '@/interfaces/bandejas'; // Asegúrate de que la ruta sea correcta
import { Input } from '../ui/input';
import DetallesBandeja from '../modals/detallebandeja';

interface FormTablaBandejaProps {
  bandejas: Bandeja[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  handleSearch: (term: string) => void;
  handleLoadMore: () => void;
  deleteBandeja: (id: number) => void;
  seleccionarBandeja: (id: number, mode: 'edit' | 'view') => void;
}

export const FormTablaBandeja = ({ 
  bandejas, seleccionarBandeja, loading, currentPage, totalPages, handleSearch, handleLoadMore, deleteBandeja
}: FormTablaBandejaProps) => {
  const [visibleCount] = useState(8); // Mostrar 8 bandejas inicialmente
  const [searchTerm, setSearchTerm] = useState('');
  const canLoadMore = currentPage < totalPages;
  const [detallesBandeja, setDetallesBandeja] = useState<Bandeja | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500); // Espera 500ms después de que el usuario deja de escribir

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const handleDeleteClick = (id: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la bandeja "${nombre}"?`)) {
      deleteBandeja(id);
    }
  };

  const bandejasMostradas = bandejas.slice(0, visibleCount);

  return (
    <div className="bg-pastel-cream text-black p-6 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-4">Bandejas Disponibles</h2>
      <Input
          type="text"
          placeholder="Buscar bandeja por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w- mb-4"
        />
          
      {loading && bandejas.length === 0 ? (
        <p className="text-center">Cargando bandejas...</p>
        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bandejasMostradas.map(bandeja => (
              <div key={bandeja.id_bandeja} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="relative w-full h-64 md:h-72">
                  <Image
                    src={bandeja.imagen || '/cupcake.jpg'}
                    alt={bandeja.nombre}
                    layout="fill"
                    objectFit="cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { if (e.currentTarget.src !== '/cupcake.jpg') { e.currentTarget.src = '/cupcake.jpg'; } }}
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{bandeja.nombre}</h3>
                  <p className="text-md font-bold text-green-600 mb-2">${Number(bandeja.precio).toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mb-2">Tamaño: {bandeja.tamanio}</p>
                  <div className="mt-auto pt-3 border-t border-gray-200 flex flex-wrap justify-center items-center gap-2">
                    <Button title="Editar" size="sm" className="bg-pastel-blue hover:bg-blue-200" onClick={() => seleccionarBandeja(bandeja.id_bandeja, 'edit')}>
                        <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button title="Eliminar" size="sm" className="bg-pastel-red hover:bg-red-200" onClick={() => handleDeleteClick(bandeja.id_bandeja, bandeja.nombre)}>
                        <Trash2 className="h-4 w-4" /> Eliminar
                    </Button>
                    <Button title="Ver Detalles" size="sm" className="bg-pastel-yellow hover:bg-yellow-100" onClick={() => setDetallesBandeja(bandeja)}>
                        <Info className="h-4 w-4" /> Ver Detalles
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {bandejas.length === 0 && !loading && (
        <p className="text-center py-8">No se encontraron bandejas.</p>
      )}
      {canLoadMore && (
        <div className="text-center mt-8">
          <Button onClick={handleLoadMore} className="bg-pastel-blue hover:bg-blue-400 text-white">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</> : 'Ver Más'}
          </Button>
        </div>
      )}
      {detallesBandeja && (
        <DetallesBandeja bandeja={detallesBandeja} onClose={() => setDetallesBandeja(null)} />
      )}
    </div>
  );
};