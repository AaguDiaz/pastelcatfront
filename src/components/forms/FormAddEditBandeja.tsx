// src/app/bandejas/components/FormAgregarBandeja.tsx
'use client';
import { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';  
import { Button } from '@/components/ui/button';  
import Combobox from '@/components/ui/combobox';  
import { Pencil, Trash2 } from 'lucide-react';  

// El tipo TortaDisponible ahora viene del hook procesado
interface TortaDisponible {
    id_torta: number;
    nombre: string;
    tamanio: string;
    porciones_receta: number; // Porciones que rinde la receta de esta torta
    costo_por_porcion: number; // Costo pre-calculado por porción de esta torta
}

// Tipo para las tortas que se van agregando a la bandeja
interface TortaEnBandeja {
    id_torta: number;
    nombre: string;
    tamanio: string;
    porciones: number; // Cantidad de porciones de esta torta en particular para la bandeja
    precio: number; // Precio total de esas porciones para la bandeja
}

interface FormAgregarBandejaProps {
    tortasDisponibles: TortaDisponible[];  
    bandejaSeleccionada: any | null;  
    modo: 'create' | 'edit' | 'view';  
    limpiarSeleccion: () => void;  
}

export const FormAgregarBandeja = ({
    tortasDisponibles,  
    bandejaSeleccionada,  
    modo,  
    limpiarSeleccion,  
}: FormAgregarBandejaProps) => {
    // Estado local del formulario principal 
    const [nombre, setNombre] = useState('');  
    const [precio, setPrecio] = useState('');  
    const [tamaño, setTamaño] = useState('');  
    const [imagen, setImagen] = useState('');  

    // Estado local para la sección de agregar tortas 
    const [tortaId, setTortaId] = useState('');  
    const [porciones, setPorciones] = useState('');
    const opcionesTorta = tortasDisponibles.map(torta => ({
        id: String(torta.id_torta),
        nombre: `${torta.nombre} ${torta.tamanio}`,
    }));

    const mapNombreAId: Record<string, string> = {};
        opcionesTorta.forEach(op => {
        mapNombreAId[op.nombre] = op.id;
    });  

    const [editingTortaId, setEditingTortaId] = useState<number | null>(null);
    const [tortasEnBandeja, setTortasEnBandeja] = useState<TortaEnBandeja[]>([]);  

    // Estado para manejar el archivo de imagen y la previsualización del nombre 
    const [imagenFile, setImagenFile] = useState<File | null>(null);  
    const [imagenPreview, setImagenPreview] = useState('');  

    const isReadOnly = modo === 'view';  

    // Efecto para rellenar el formulario cuando se edita o ve una bandeja 
    useEffect(() => {
        if (bandejaSeleccionada && (modo === 'edit' || modo === 'view')) {  
            setNombre(bandejaSeleccionada.nombre);  
            setPrecio(String(bandejaSeleccionada.precio));  
            setTamaño(bandejaSeleccionada.tamaño);  
            setImagen(bandejaSeleccionada.imagen);  
            setTortasEnBandeja(bandejaSeleccionada.tortas);  
        } else {
            handleLimpiar();  
        }
    }, [bandejaSeleccionada, modo]);  

    const handleImagenChange = (e: ChangeEvent<HTMLInputElement>) => {  
        if (e.target.files && e.target.files[0]) {  
            setImagenFile(e.target.files[0]);  
            setImagenPreview(e.target.files[0].name); // Mostrar nombre del archivo 
        } else {  
            setImagenFile(null);  
            setImagenPreview('');  
        }
    };

    const handleAgregarTorta = () => {  
        if (!tortaId || !porciones) {
            return;
        }

        const tortaSeleccionada = tortasDisponibles.find(t => String(t.id_torta) === tortaId);

        if (tortaSeleccionada) {
            const cantidadPorciones = parseInt(porciones);
            if (isNaN(cantidadPorciones) || cantidadPorciones <= 0) {
                alert("Por favor, introduce una cantidad válida de porciones.");
                return;
            }

            const precioCalculadoParaBandeja = tortaSeleccionada.costo_por_porcion * cantidadPorciones;

            if (editingTortaId !== null) {
                // Modo edición: Actualizar la torta existente
                const updatedTortas = tortasEnBandeja.map(torta => {
                    const currentTortaIdNum = Number(torta.id_torta);
                    const editingIdNum = Number(editingTortaId);
                    if (currentTortaIdNum === editingIdNum) {
                        return { ...torta, porciones: cantidadPorciones, precio: precioCalculadoParaBandeja };
                    }
                    return torta;
                });

                setTortasEnBandeja(updatedTortas);
                setEditingTortaId(null); // Salir del modo edición
                
            } else {
                // Modo agregar: Añadir una nueva torta
                const tortaExistente = tortasEnBandeja.find(t => String(t.id_torta) === tortaId);
                if (tortaExistente) {
                    alert('Esta torta ya ha sido agregada a la bandeja. Por favor, edítala si deseas cambiar las porciones.');
                    return;
                }

                setTortasEnBandeja([
                    ...tortasEnBandeja,
                    {
                        id_torta: tortaSeleccionada.id_torta,
                        nombre: tortaSeleccionada.nombre,
                        tamanio: tortaSeleccionada.tamanio,
                        porciones: cantidadPorciones,
                        precio: precioCalculadoParaBandeja,
                    },
                ]);
                
            }
            setTortaId('');
            setPorciones('');
        } 
    };

    const handleEditarTorta = (tortaAEditarId: number) => {
        const torta = tortasEnBandeja.find(t => t.id_torta === tortaAEditarId);
        if (torta) {
            setEditingTortaId(tortaAEditarId); // Establece la torta que se está editando
            setTortaId(String(torta.id_torta)); // Carga el ID en el combobox
            setPorciones(String(torta.porciones)); // Carga las porciones
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Desplazar hacia arriba al formulario de agregar
        }
    };

    const handleEliminarTorta = (idTorta: number) => { 
        setTortasEnBandeja(tortasEnBandeja.filter(t => t.id_torta !== idTorta));
        if (editingTortaId === idTorta) {
            setEditingTortaId(null);
            setTortaId('');
            setPorciones('');
        } 
    };

    const handleLimpiar = () => { 
        setNombre(''); 
        setPrecio(''); 
        setTamaño(''); 
        setImagen(''); 
        setTortaId(''); 
        setPorciones(''); 
        setTortasEnBandeja([]); 
        setEditingTortaId(null); 
        if (modo !== 'create') { 
            limpiarSeleccion(); 
        }
    };

    const handleConfirmar = () => { 
        // Lógica futura para guardar 
        console.log('Bandeja a confirmar:', { nombre, precio, tamaño, imagen, tortas: tortasEnBandeja }); 
        alert('Bandeja confirmada! Revisa la consola.'); 
        handleLimpiar(); 
    };

    const titulo = modo === 'edit' ? 'Editar Bandeja' : modo === 'view' ? 'Detalles de la Bandeja' : 'Agregar Bandeja'; 
    const botonTortaTexto = editingTortaId !== null ? 'Confirmar Edición' : 'Agregar Torta';
    
    return (
        <div className="bg-pastel-cream text-black p-6 rounded-2xl shadow-2xl"> 
            <h2 className="text-2xl font-semibold mb-4">{titulo}</h2> 

            {/* Inputs principales de la bandeja */} 
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"> 
                <div> 
                    <label className="text-sm font-medium">Nombre</label> 
                    <Input placeholder="Ej: Bandeja Desayuno" value={nombre} onChange={(e) => setNombre(e.target.value)} readOnly={isReadOnly} /> 
                </div>
                <div> 
                    <label className="text-sm font-medium">Precio</label> 
                    <Input placeholder="Ej: 50000" type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} readOnly={isReadOnly} />             
                    </div>
                <div> 
                    <label className="text-sm font-medium">Tamaño</label> 
                    <Input placeholder="Ej: 24cm" value={tamaño} onChange={(e) => setTamaño(e.target.value)} readOnly={isReadOnly} />             
                    </div>
                <div> 
                    <label htmlFor="imagen" className="text-sm font-medium">Imagen</label>                 
                    <Input type="file" id="imagen" accept="image/*" onChange={handleImagenChange} disabled={isReadOnly} />                 
                    {imagenPreview && (<p className="text-xs mt-1 text-gray-600 truncate">Seleccionado: {imagenPreview}</p>)}             
                    </div>
            </div>

            {/* Sección para agregar tortas a la bandeja */} 
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">             
                <div> 
                    <label className="text-sm font-medium">Torta</label> 
                    <Combobox
                        options={opcionesTorta}
                        value={opcionesTorta.find(op => op.id === tortaId)?.nombre || ''} 
                        onSelect={(nombreSeleccionada) => {
                            const id = mapNombreAId[nombreSeleccionada];
                            setTortaId(id); // Actualizar el ID de la torta seleccion
                        }} 
                        disabled={isReadOnly} 
                        // Mensaje de tooltip 
                        placeholder={tortasDisponibles.length === 0 ? "No hay tortas disponibles con porciones en receta" : "Selecciona una torta"}
                        tooltipMessage="Si la torta no está acá es porque le falta las porciones en la receta." // 
                    />
                </div>

                {/* Campos que aparecen al seleccionar una torta */} 
                {(tortaId || editingTortaId !== null) && !isReadOnly && ( 
                    <>
                        <div> 
                            <label className="text-sm font-medium">Porciones</label> 
                            <Input type="number" value={porciones} onChange={(e) => setPorciones(e.target.value)} />                     
                            </div>
                        <div className="col-span-1 flex items-end"> 
                            <Button onClick={handleAgregarTorta} className="bg-pastel-blue hover:bg-blue-400 w-full"> 
                                {botonTortaTexto} 
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Tabla de tortas agregadas */} 
            <h3 className="text-lg font-semibold mt-6 mb-2">Tortas en la Bandeja</h3>         
            <table className="w-full text-left"> 
                <thead> 
                    <tr className="border-b"> 
                        <th className="py-2">Nombre</th> 
                        <th className="py-2">Porciones</th> 
                        <th className="py-2">Precio</th> 
                        <th className="py-2">Acciones</th> 
                    </tr>
                </thead>
                <tbody> 
                    {tortasEnBandeja.map(torta => ( 
                        <tr key={torta.id_torta} className="border-t"> 
                            <td className="py-2">{`${torta.nombre} ${torta.tamanio}`}</td> 
                            <td className="py-2">{torta.porciones}</td> 
                            <td className="py-2">${torta.precio.toFixed(2)}</td> 
                            <td className="py-2 space-x-2">                             
                                <Button size="sm" className="bg-pastel-blue hover:bg-blue-400" onClick={() => handleEditarTorta(torta.id_torta)} disabled={isReadOnly}><Pencil size={16} /> Editar</Button> 
                                <Button size="sm" className="bg-pastel-red hover:bg-red-400" onClick={() => handleEliminarTorta(torta.id_torta)} disabled={isReadOnly}><Trash2 size={16} /> Eliminar </Button> 
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Botones de acción principales */} 
            <div className="mt-6 flex gap-4"> 
                <Button onClick={handleConfirmar} className="bg-pastel-blue hover:bg-blue-400" disabled={isReadOnly}> 
                    Confirmar Bandeja 
                </Button>
                <Button onClick={handleLimpiar} className="bg-pastel-yellow hover:bg-yellow-400"> 
                    Limpiar 
                </Button>
            </div>
        </div>
    );
};