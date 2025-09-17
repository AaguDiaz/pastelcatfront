'use client';

import React, { useEffect, useState } from 'react';
import { Torta } from '@/interfaces/tortas';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Loader2 } from 'lucide-react';
import { calcularCostoIngrediente } from '@/lib/calculoCostos'; // Asegúrate de tener esta función para calcular el costo

interface IngredienteConCosto {
  id: number;
  ingrediente: string;
  cantidad_receta: number;
  unidad_receta: string;
  costoCalculado: number;
}

interface RecetaDetalles{
    porciones: number;
    ingredientes: {
        id: number;
        ingrediente: string;
        cantidad: number;
        unidad: string;
        precio: number;
    }[];
}

interface VerDetallesProps {
  torta: Torta;
  onClose: () => void;
  fetchRecetaDetails: (tortaId: number) => Promise<RecetaDetalles>;
}

export default function Detallestorta({ torta, onClose, fetchRecetaDetails }: VerDetallesProps) {
  // El estado 'open' se maneja desde el padre, pero la UI del Dialog lo necesita
  const [isLoading, setIsLoading] = useState(true);
  const [detalles, setDetalles] = useState<RecetaDetalles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ingredientes, setIngredientes] = useState<IngredienteConCosto[]>([]);
  const [costoTotal, setCostoTotal] = useState<number | null>(null);


   useEffect(() => {
    const loadDetalles = async () => {
      if (!torta.id_torta) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchRecetaDetails(torta.id_torta);
        setDetalles(data);
        if (data === null) {
          // Si es null, significa que no se encontró receta (404)
          // Dejamos los arrays y valores en su estado inicial/vacío.
          setIngredientes([]);
          setCostoTotal(null);
        } else {
            let costoAcumulado = 0;
            const ingredientesConCosto = data.ingredientes.map(ing => {
            const costo = calcularCostoIngrediente(ing);
            costoAcumulado += costo;
            return {
                id: ing.id,
                ingrediente: ing.ingrediente,
                cantidad_receta: ing.cantidad,
                unidad_receta: ing.unidad,
                costoCalculado: costo,
            };
            });
            // Actualiza los estados
            setIngredientes(ingredientesConCosto);
            setCostoTotal(costoAcumulado);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('No se pudo cargar la receta.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDetalles();
  }, [torta.id_torta, fetchRecetaDetails]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[85vw] lg:max-w-[75vw] xl:max-w-[70vw] mx-4 bg-pastel-cream text-gray-800 p-0 rounded-lg shadow-2xl border-none max-h-[90vh] overflow-y-auto">
        {/* Título oculto para accesibilidad */}
        <VisuallyHidden>
            <DialogTitle>Detalles de la torta {torta.nombre}</DialogTitle>
        </VisuallyHidden>
        <div className="relative p-6">
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Cerrar"
          >
          </button>

          {/* Sección Superior: Foto e Info General */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="relative w-full md:w-1/3 h-64 rounded-lg overflow-hidden shadow-md">
              <Image
                src={torta.imagen || '/cupcake.jpg'}
                alt={torta.nombre}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{torta.nombre}</h2>
              <p className="text-md text-gray-600 mb-4">
                <strong>Tamaño:</strong> {torta.tamaño}
              </p>
              <p className="text-md text-gray-600 mb-4">
                <strong>Rinde para:</strong> {' '}
                {isLoading ? <span className="text-sm italic">Cargando...</span> : detalles ? `${detalles.porciones} porciones` : 'N/A'}
              </p>
              
              <div className="grid grid-cols-3 gap-4 text-center mt-4 border-t border-gray-300 pt-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Precio Actual</p>
                  <p className="text-lg font-bold text-green-600">${Number(torta.precio).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Precio Costo</p>
                  <p className="text-lg font-bold text-blue-600 italic">
                    {isLoading ? '...' : costoTotal !== null ? `$${costoTotal.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Precio Sugerido</p>
                  <p className="text-lg font-bold text-purple-600 italic">
                    {isLoading ? '...' : costoTotal !== null ? `$${(costoTotal * 1.5).toFixed(2)} - $${(costoTotal * 2).toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección Inferior: Receta */}
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-2xl font-semibold mb-3">Receta</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2">Ingrediente</th>
                    <th className="py-2 px-2">Cantidad</th>
                    <th className="py-2 px-2">Unidad</th>
                    <th className="py-2 px-2">Precio</th>
                  </tr>
                </thead>
                <tbody>
                {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin inline-block" />
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-red-500">{error}</td>
                    </tr>
                  ) : ingredientes.length > 0 ? (
                    ingredientes.map((ing) => (
                      <tr key={ing.id} className="border-b">
                        <td className="py-2 px-2">{ing.ingrediente}</td>
                        <td className="py-2 px-2">{ing.cantidad_receta}</td>
                        <td className="py-2 px-2">{ing.unidad_receta}</td>
                        <td className="py-2 px-2">${ing.costoCalculado.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500 italic">No hay ingredientes para esta receta.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
