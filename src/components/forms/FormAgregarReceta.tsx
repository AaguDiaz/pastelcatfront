'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Combobox from '@/components/ui/combobox'
import { Pencil, Trash2 } from 'lucide-react'
import { useRecetaData } from '@/hooks/useRecetaData'
import ModalExito from '@/components/modals/exito'
import ModalError from '@/components/modals/error'


const FormAgregarReceta = () => {
  const [tortaSeleccionada, setTortaSeleccionada] = useState('');
  const [porciones, setPorciones] = useState('')
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('')
  
  type IngredienteAgregado = {
    id: number;
    ingrediente: string;
    cantidad: string;
    unidad: string;
  }
  
  const [ingredientesAgregados, setIngredientesAgregados] = useState<IngredienteAgregado[]>([])
  const [modoEdicion, setModoEdicion] = useState(false)
  const [idEditando, setIdEditando] = useState<number | null>(null)
  const { confirmarReceta, modalError, setModalError, modalExito, setModalExito, tortas, ingredientes, loading } = useRecetaData()

    const handleAgregarOEditarIngrediente = () => {
    if (!ingredienteSeleccionado || !cantidad || !unidad) return

    if (modoEdicion) {
      setIngredientesAgregados(prev =>
        prev.map(item =>
          item.id === idEditando ? { ...item, cantidad, unidad } : item
        )
      )
      setModoEdicion(false)
      setIdEditando(null)
    } else {
      const ingredienteObj = ingredientes.find(i => i.nombre === ingredienteSeleccionado);
        if (!ingredienteObj) {
          setModalError({ mostrar: true, mensaje: 'Ingrediente no válido.' });
          return;
        }

        setIngredientesAgregados(prev => [
          ...prev,
          {
            id: ingredienteObj.id_materiaprima,
            ingrediente: ingredienteSeleccionado,
            cantidad,
            unidad
          }
        ]);
      }

    setIngredienteSeleccionado('')
    setCantidad('')
    setUnidad('')
  }

  const handleEditar = (item: IngredienteAgregado) => {
    setIngredienteSeleccionado(item.ingrediente)
    setCantidad(item.cantidad)
    setUnidad(item.unidad)
    setModoEdicion(true)
    setIdEditando(item.id)
  }

  const handleEliminar = (id: number) => {
    setIngredientesAgregados(prev => prev.filter(item => item.id !== id))
  }

  const handleLimpiar = () => {
    setTortaSeleccionada('')
    setPorciones('')
    setIngredienteSeleccionado('')
    setCantidad('')
    setUnidad('')
    setIngredientesAgregados([])
    setModoEdicion(false)
    setIdEditando(null)
  }

const handleConfirmar = async () => {
  if (!tortaSeleccionada || !porciones || ingredientesAgregados.length === 0) {
    // MUESTRA EL MODAL DE ERROR PARA VALIDACIÓN
    setModalError({ mostrar: true, mensaje: 'Debes completar todos los campos de la receta antes de confirmar.' });
    return;
  }
  
  // (Aquí va la lógica corregida de la pregunta anterior para obtener el id_torta)
  const tortaObj = tortas.find(t => t.nombre === tortaSeleccionada);
  if (!tortaObj) {
      setModalError({ mostrar: true, mensaje: 'La torta seleccionada no es válida.' });
      return;
  }
  const idTorta = tortaObj.id_torta;

  const porcionesNum = parseInt(porciones);
  const ingredientesFormateados = ingredientesAgregados.map(item => ({
    id_materiaprima: item.id,
    cantidad: parseFloat(item.cantidad),
    unidadmedida: item.unidad
  }));

  const payload = {
    id_torta: idTorta,
    porciones: porcionesNum,
    ingredientes: ingredientesFormateados
  };

  try {
    await confirmarReceta(payload);
    // SI TODO SALE BIEN, MUESTRA EL MODAL DE ÉXITO
    setModalExito({ mostrar: true, mensaje: 'La receta se ha guardado correctamente.' });
    handleLimpiar(); // Limpiamos el formulario después de mostrar el éxito
  } catch (err) {
    console.error(err);
    // SI HAY UN ERROR CON LA API, MUESTRA EL MODAL DE ERROR
    const mensajeError = err instanceof Error ? err.message : 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.';
    setModalError({ mostrar: true, mensaje: mensajeError });
  }
};
  if (loading) {
    return <div className="p-6 text-center">Cargando datos...</div>
  }

  return (
    <div className="bg-pastel-cream text-black p-6 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-4">Agregar Receta</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex-grow min-w-[150px]">
          <label className="text-sm font-medium">Torta</label>
          <Combobox
            options={tortas.map(t => ({ id: String(t.id_torta), nombre: t.nombre }))} value={tortaSeleccionada} onSelect={setTortaSeleccionada} />
        </div>

        <div className="flex-grow min-w-[150px]">
          <label className="text-sm font-medium">Porciones</label>
          <Input type="number" placeholder="Ej: 22" value={porciones} onChange={(e) => setPorciones(e.target.value)} />
        </div>

        <div className="flex-grow min-w-[150px]">
          <label className="text-sm font-medium">Ingrediente</label>
          <Combobox options={ingredientes.map(i => ({ id: String(i.id_materiaprima), nombre: i.nombre }))} value={ingredienteSeleccionado} onSelect={setIngredienteSeleccionado} />
        </div>
      </div>

      {ingredienteSeleccionado && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex-grow min-w-[150px]">
            <label className="text-sm font-medium">Cantidad</label>
            <Input type="number" placeholder="Ej: 1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          <div className="flex-grow min-w-[150px]">
            <label className="text-sm font-medium">Unidad</label>
            <Input placeholder="Unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
          </div>

          <Button className="bg-pastel-blue hover:bg-blue-400 mt-6" onClick={handleAgregarOEditarIngrediente}>
            {modoEdicion ? 'Confirmar Edición' : 'Agregar Ingrediente'}
          </Button>
        </div>
      )}

      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">Ingrediente</th>
            <th className="py-2">Cantidad</th>
            <th className="py-2">Unidad</th>
            <th className="py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ingredientesAgregados.map(item => (
            <tr key={item.id} className="text-left">
              <td className="py-2">{item.ingrediente}</td>
              <td className="py-2">{item.cantidad}</td>
              <td className="py-2">{item.unidad}</td>
              <td className="py-2 space-x-2">
                <Button className="bg-pastel-blue hover:bg-blue-400 transition-transform" size="sm" onClick={() => handleEditar(item)}>
                  Editar <Pencil size={16} />
                </Button>
                <Button className="bg-pastel-red hover:bg-red-400 transition-transform" size="sm" onClick={() => handleEliminar(item.id)}>
                  Eliminar <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex gap-4">
        <Button className="bg-pastel-blue hover:bg-blue-400 transition-transform" onClick={handleConfirmar}>Confirmar Receta</Button>
        <Button className="bg-pastel-yellow hover:bg-yellow-400 transition-transform" onClick={handleLimpiar}>Limpiar</Button>
      </div>
       
       {modalExito.mostrar && (
      <ModalExito
        titulo="¡Éxito!"
        mensaje={modalExito.mensaje}
        onClose={() => setModalExito({ mostrar: false, mensaje: '' })}
      />
    )}

    {modalError.mostrar && (
      <ModalError
        titulo="Ocurrió un Error"
        mensaje={modalError.mensaje}
        onClose={() => setModalError({ mostrar: false, mensaje: '' })}
      />
    )}
    </div>
  )
}

export default FormAgregarReceta
