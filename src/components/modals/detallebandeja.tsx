'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Image from 'next/image';
import { Bandeja } from '@/interfaces/bandejas';

interface DetallesBandejaProps {
  bandeja: Bandeja;
  onClose: () => void;
}

export default function DetallesBandeja({ bandeja, onClose }: DetallesBandejaProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[85vw] lg:max-w-[70vw] xl:max-w-[60vw] mx-4 bg-pastel-cream text-gray-800 p-0 rounded-lg shadow-2xl border-none max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Detalles de la bandeja {bandeja.nombre}</DialogTitle>
        </VisuallyHidden>
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Cerrar"
          />
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="relative w-full md:w-1/3 h-64 rounded-lg overflow-hidden shadow-md">
              <Image
                src={bandeja.imagen || '/cupcake.jpg'}
                alt={bandeja.nombre}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{bandeja.nombre}</h2>
              <p className="text-md text-gray-600 mb-2"><strong>Tamaño:</strong> {bandeja.tamanio}</p>
              <p className="text-md text-gray-600 mb-4"><strong>Precio Actual:</strong> ${Number(bandeja.precio).toFixed(2)}</p>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-2xl font-semibold mb-3">Tortas en la Bandeja</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2">Torta</th>
                    <th className="py-2 px-2">Tamaño</th>
                    <th className="py-2 px-2">Porciones</th>
                    <th className="py-2 px-2">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {bandeja.bandeja_tortas && bandeja.bandeja_tortas.length > 0 ? (
                    bandeja.bandeja_tortas.map((bt) => (
                      <tr key={bt.id_bandeja_tortas} className="border-b">
                        <td className="py-2 px-2">{bt.torta.nombre}</td>
                        <td className="py-2 px-2">{bt.torta.tamanio}</td>
                        <td className="py-2 px-2">{bt.porciones}</td>
                        <td className="py-2 px-2">${Number(bt.precio).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500 italic">
                        No hay tortas asociadas.
                      </td>
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
