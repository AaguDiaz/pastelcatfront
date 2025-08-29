'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Producto } from '@/interfaces/pedidos';
import {Info} from 'lucide-react';

interface ProductCardProps {
  producto: Producto;
  onAdd: (p: Producto) => void;
  onDetails?: (p: Producto) => void;
}

export default function ProductCard({ producto, onAdd, onDetails }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      <div className="relative w-full h-64 md:h-50">
        <Image
          src={producto.imagen || '/cupcake.jpg'}
          alt={producto.nombre}
          layout="fill"
          objectFit="cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== '/cupcake.jpg') target.src = '/cupcake.jpg';
          }}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{producto.nombre}</h3>
        <p className="text-md font-bold text-green-600 mb-2">
          ${producto.precio.toFixed(2)}
        </p>
        {producto.tamanio && (
          <p className="text-sm text-gray-500 mb-2">Tamaño: {producto.tamanio}</p>
        )}
        <div className="mt-auto pt-3 border-t border-gray-200 flex justify-center gap-2">
          <Button
            size="sm"
            className="bg-pastel-blue hover:bg-blue-200"
            onClick={() => onAdd(producto)}
          >
            Agregar
          </Button>
          {onDetails && (
            <Button
              size="sm"
              className="bg-pastel-yellow hover:bg-yellow-100"
              onClick={() => onDetails(producto)}
            >
              <Info className="h-4 w-4 mr-1" /> Ver Detalles
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}