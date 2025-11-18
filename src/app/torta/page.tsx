'use client';
import * as tortasHooks from '@/hooks/useTortasData';
import React, { ChangeEvent, FormEvent, JSX, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil, Info, Loader2 } from 'lucide-react';
import { Torta } from '@/interfaces/tortas';
import EliminarModal from '@/components/modals/eliminar';
import Detallestorta from '@/components/modals/detallestorta';
import ModalError from '@/components/modals/error';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function TortasPage(): JSX.Element {
  const [searchInput, setSearchInput] = useState('');
  // Estados para el formulario de agregar torta
  const [nombreTorta, setNombreTorta] = useState('');
  const [precioTorta, setPrecioTorta] = useState('');
  const [tamanioTorta, setTamanioTorta] = useState('');
  const [imagenFileTorta, setImagenFileTorta] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string>(''); // Para mostrar el nombre del archivo
  // Estados para editar torta
  const [isEditing, setIsEditing] = useState(false);
  const [editingTorta, setEditingTorta] = useState<Torta | null>(null);
  const [tortaToDelete, setTortaToDelete] = useState<Torta | null>(null);
  const [tortaDetails, setTortaDetails] = useState<Torta | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    tortas: displayedTortas, // El hook ahora devuelve el array acumulado
    isLoading, // Para carga inicial / nueva búsqueda
    isFetchingMore, // Para el botón "Ver Más"
    error,
    canLoadMore,
    setSearchTerm,
    handleLoadMore,
    createTorta,
    updateTorta,
    deleteTorta,
    isCreating,
    createError,
    fetchRecetaDetails,
  } = tortasHooks.useTortasData()

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchTerm(searchInput); 
  };

  const handleImagenChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagenFileTorta(e.target.files[0]);
      setImagenPreview(e.target.files[0].name); // Mostrar nombre del archivo
    } else {
      setImagenFileTorta(null);
      setImagenPreview('');
    }
  };

  const handleEditTorta = (torta: Torta) => {
    setIsEditing(true);
    setEditingTorta(torta);
    setNombreTorta(torta.nombre);
    setPrecioTorta(torta.precio.toString());
    setTamanioTorta(torta.tamanio);
    setImagenPreview(torta.imagen || '');
    setImagenFileTorta(null); // Resetear la imagen para que el usuario pueda subir una nueva
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombreTorta || !precioTorta || !tamanioTorta) {
      setErrorMsg('Por favor, completa todos los campos obligatorios: Nombre, Precio y Tamaño.');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombreTorta);
    formData.append('precio', precioTorta);
    formData.append('tamanio', tamanioTorta);
    if (isEditing && editingTorta) {
      formData.append('existingImage', editingTorta.imagen || ''); // Enviar la imagen existente
    }
    if (imagenFileTorta) {
      formData.append('imagen', imagenFileTorta);
    }

    let success;
    if (isEditing && editingTorta) {
      success = await updateTorta(editingTorta.id_torta, formData);
    } else {
      success = await createTorta(formData);
    }

    if (success) {// Resetear el formulario
      setNombreTorta('');
      setPrecioTorta('');
      setTamanioTorta('');
      setImagenFileTorta(null);
      setImagenPreview('');
      setIsEditing(false);
      setEditingTorta(null);
    }
  };

  const handleDeleteTorta = (torta: Torta) => {
    setTortaToDelete(torta); // Mostrar el modal
  };

  const handleDeleteConfirm = async (confirmed: boolean) => {
    if (confirmed && tortaToDelete) {
      await deleteTorta(tortaToDelete.id_torta); // Llamar a la función de eliminación
    }
    setTortaToDelete(null); // Cerrar el modal
  };

  const handleViewDetails = (torta: Torta) => {
    setTortaDetails(torta);
  };

  return (
    <div className="min-h-screen bg-pastel-beige p-4 md:p-8">
      <div className="mb-8 p-6 bg-pastel-cream rounded-lg shadow-xl space-y-6">
        {/* Formulario Agregar/Editar Torta */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">{isEditing ?`Editar "${editingTorta?.nombre}"` : 'Agregar Torta'}</h2>
            <div className="flex flex-wrap items-end gap-4">
                 {/* Inputs usan estado y handlers del hook */}
                <div className="flex-grow min-w-[150px]">
                    <label htmlFor="nombre" className="text-sm font-medium text-gray-700">Nombre</label>
                    <Input type="text" id="nombre" placeholder="Nombre" className="mt-1 w-full" value={nombreTorta} onChange={(e)=> setNombreTorta(e.target.value)} disabled={isCreating} />
                </div>
                <div className="flex-grow min-w-[100px]">
                    <label htmlFor="precio" className="text-sm font-medium text-gray-700">Precio</label>
                    <Input type="number" id="precio" step="0.01" min="0" placeholder="Precio" className="mt-1 w-full" value={precioTorta} onChange={(e)=> setPrecioTorta(e.target.value)} disabled={isCreating} />
                </div>
                <div className="flex-grow min-w-[120px]">
                     <label htmlFor="tamanio" className="text-sm font-medium text-gray-700">Tamaño</label>
                     <select  id="tamanio"  className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2" value={tamanioTorta} onChange={(e)=> setTamanioTorta(e.target.value)} disabled={isCreating}>
                          <option value="">Seleccionar Tamaño...</option>
                          <option value="Pequeño">Pequeño</option>
                          <option value="Mediano">Mediano</option>
                          <option value="Grande">Grande</option>
                      </select>
                </div>
                <div className="flex-grow min-w-[180px]">
                     <label htmlFor="imagen" className="text-sm font-medium text-gray-700">Imagen</label>
                     <Input type="file" id="imagen" accept="image/*" className="mt-1 w-full rounded-md border text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2" onChange={handleImagenChange} disabled={isCreating}/>
                     {imagenPreview && (<p className="text-xs mt-1 text-gray-600 truncate" >Seleccionado: {imagenPreview}</p>)}
                </div>
                <Button type="submit" className="bg-pastel-blue hover:bg-blue-400" disabled={isCreating}> {
                  isCreating? ( <><Loader2 className='mr-2 h-4 w-4 animate-spin'>{
                    isEditing ? 'Editando...' : 'Agregando...'
                  }</Loader2> </>):isEditing ? ('Editar Torta') : ( 'Agregar Torta')
                }</Button>
            </div>
              {createError && (<p className="text-sm text-red-600 mt-2">{createError}</p>)}
        </form>

        {/* Buscador */}
        <div className="pt-4 border-t border-gray-200">
        <form onSubmit={handleSearchSubmit}>
             <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar por Nombre</label>
             <Input type="text" id="search" placeholder="Buscar torta..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full"  disabled={isLoading || isFetchingMore}/>
        </form>
        </div>
      </div>

      {/* Mensaje de carga inicial */}
      {isLoading && <p className="text-center text-gray-600 my-8">Cargando tortas...</p>}

      {/* Grid de Tortas con Animación */}
      {displayedTortas.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${(isLoading || isFetchingMore) ? 'opacity-70 pointer-events-none' : ''}`}>
          <AnimatePresence>
            {displayedTortas.map((torta) => (
              <motion.div
                key={torta.id_torta}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
              >
                {/* Contenido de la tarjeta (imagen, nombre, precio, botones) */}
                <div className="relative w-full h-64 md:h-72">
                  <Image src={torta.imagen || '/cupcake.jpg'} alt={torta.nombre} layout="fill" objectFit="cover" onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { if (e.currentTarget.src !== '/cupcake.jpg') { e.currentTarget.src = '/cupcake.jpg'; } }}/>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">{torta.nombre}</h2>
                    <p className="text-md font-bold text-green-600 mb-3">${Number(torta.precio).toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mb-2">Tamaño: {torta.tamanio}</p>
                    <div className="mt-auto pt-3 border-t border-gray-200 flex flex-wrap justify-center items-center gap-2">
                      <Button className="bg-pastel-blue hover:bg-blue-200" variant="ghost" title="Editar" onClick={() => handleEditTorta(torta)}><Pencil className="h-4 w-4 " />Editar</Button>
                      <Button className="bg-pastel-red hover:bg-red-200" variant="ghost" title="Eliminar" onClick={()=>handleDeleteTorta(torta)}><Trash2 className="h-4 w-4" />Eliminar</Button>
                      <Button  className='bg-pastel-yellow hover:bg-yellow-100' variant="ghost" title="Ver Detalles" onClick={()=> handleViewDetails(torta)}><Info className="h-4 w-4" />Ver detalles</Button>
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Mensajes de No Resultados */}
      {!isLoading && !isFetchingMore && displayedTortas.length === 0 && !error && <p className="text-center text-gray-600 mt-8">No se encontraron tortas...</p>}

      {/* Botón Ver Más */}
      {/* Usar filteredTortas y visibleCount del hook */}
      {!isLoading && canLoadMore && (
        <div className="text-center mt-8">
            {/* Usar handleLoadMore del hook */}
            <Button onClick={handleLoadMore} className="bg-pastel-blue hover:bg-blue-400 text-white" disabled={isFetchingMore}>
               {isFetchingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</> : 'Ver Más'}</Button>
        </div>
       )}

      {/* Renderizar el modal si hay una torta para eliminar */}
      {tortaToDelete && (
        <EliminarModal
          nombre={tortaToDelete.nombre}
          contexto='tortas'
          onClose={handleDeleteConfirm}
        />
      )}
      {/* Renderizar el modal de detalles si hay una torta seleccionada */}
      {tortaDetails && (
        <Detallestorta
          torta={tortaDetails}
          onClose={() => setTortaDetails(null)}
          fetchRecetaDetails={fetchRecetaDetails}
        />
      )}
      {errorMsg && (
        <ModalError
          titulo="Error"
          mensaje={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}
    </div>
  );
}
