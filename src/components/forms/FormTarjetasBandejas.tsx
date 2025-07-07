// src/app/bandejas/components/FormTablaBandeja.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Info } from 'lucide-react';
import { Bandeja } from '@/app/bandeja/bdprueba';
import { Input } from '../ui/input';

interface FormTablaBandejaProps {
  bandejas: Bandeja[];
  seleccionarBandeja: (id: number, mode: 'edit' | 'view') => void;
}

export const FormTablaBandeja = ({ bandejas, seleccionarBandeja }: FormTablaBandejaProps) => {
  const [visibleCount, setVisibleCount] = useState(8); // Mostrar 8 bandejas inicialmente
  const [filtroNombre, setFiltroNombre] = useState('');

  const handleVerMas = () => {
    setVisibleCount(prevCount => prevCount + 8); // Cargar 8 más
  };

  const bandejasFiltradas = bandejas.filter(bandeja =>
    bandeja.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  const bandejasMostradas = bandejas.slice(0, visibleCount);
  const canLoadMore = visibleCount < bandejas.length;

  return (
    <div className="bg-pastel-cream text-black p-6 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-4">Bandejas Disponibles</h2>
      <Input
          type="text"
          placeholder="Buscar bandeja por nombre..."
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
          className="max-w- mb-4"
        />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {bandejasMostradas.map(bandeja => (
          <div key={bandeja.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
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
              <p className="text-sm text-gray-500 mb-2">Tamaño: {bandeja.tamaño}</p>
              <div className="mt-auto pt-3 border-t border-gray-200 flex flex-wrap justify-center items-center gap-2">
                <Button title="Editar" size="sm" className="bg-pastel-blue hover:bg-blue-200" onClick={() => seleccionarBandeja(bandeja.id, 'edit')}>
                    <Pencil className="h-4 w-4" /> Editar
                </Button>
                <Button title="Eliminar" size="sm" className="bg-pastel-red hover:bg-red-200">
                    <Trash2 className="h-4 w-4" /> Eliminar
                </Button>
                <Button title="Ver Detalles" size="sm" className="bg-pastel-yellow hover:bg-yellow-100" onClick={() => seleccionarBandeja(bandeja.id, 'view')}>
                    <Info className="h-4 w-4" /> Ver Detalles
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {canLoadMore && (
        <div className="text-center mt-8">
          <Button onClick={handleVerMas} className="bg-pastel-blue hover:bg-blue-400 text-white">
            Ver Más
          </Button> 
        </div>
      )}
    </div>
  );
};