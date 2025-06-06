'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ComboboxTortas from '@/components/ui/comboboxTorta'
import ComboboxIngredientes from '@/components/ui/comboboxIngredientes'
import { Pencil, Trash2 } from 'lucide-react'

const FormAgregarReceta = () => {
  const [tortaSeleccionada, setTortaSeleccionada] = useState('')
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

  const [tortas, setTortas] = useState<{ id: string; nombre: string }[]>([])
  const [ingredientes, setIngredientes] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    const fetchTortas = async () => {
      const data = [
        { id: '1', nombre: 'Torta de Chocolate' },
        { id: '2', nombre: 'Torta de Vainilla' },
      ]
      setTortas(data)
    }

    const fetchIngredientes = async () => {
      const data = [
        { id: '1', nombre: 'Harina' },
        { id: '2', nombre: 'Azúcar' },
      ]
      setIngredientes(data)
    }

    fetchTortas()
    fetchIngredientes()
  }, [])

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
      setIngredientesAgregados(prev => [
        ...prev,
        { id: Date.now(), ingrediente: ingredienteSeleccionado, cantidad, unidad }
      ])
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

  return (
    <div className="bg-pastel-cream text-black p-6 rounded-xl shadow-xl">
      <h2 className="text-xl font-bold mb-4">Agregar Receta</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex-grow min-w-[150px]">
            <label className="text-sm font-medium">Torta</label>
            <ComboboxTortas options={tortas} value={tortaSeleccionada} onSelect={setTortaSeleccionada}/>
        </div>

        <div className="flex-grow min-w-[150px]">
            <label className="text-sm font-medium">Porciones</label>
            <Input type='number' placeholder="Ej: 22" value={porciones} onChange={(e) => setPorciones(e.target.value)}/>
        </div>
        <div className="flex-grow min-w-[150px]">
            <label className="text-sm font-medium">Ingrediente</label>
            <ComboboxIngredientes options={ingredientes} value={ingredienteSeleccionado} onSelect={setIngredienteSeleccionado}/>
        </div>

      </div>
      {ingredienteSeleccionado && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            <div className="flex-grow min-w-[150px]">
                <label className="text-sm font-medium">Cantidad</label>
                <Input type='number' placeholder="Ej: 1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}/>
            </div>
            <div className="flex-grow min-w-[150px]">
                <label className="text-sm font-medium">Unidad</label>
                <Input placeholder="Unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)}/>
            </div>
            
            <Button className="bg-pastel-blue hover:bg-blue-400 mt-6" onClick={handleAgregarOEditarIngrediente}>
                {modoEdicion ? 'Confirmar Edición' : 'Agregar Ingrediente'}
            </Button>
        </div>
      )}

      <table className="w-full text-left">
        <thead>
          <tr className='border-b'>
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
                <Button className="bg-pastel-blue hover:bg-blue-400 transition-transform" size="sm" onClick={() => handleEditar(item)}>Editar <Pencil size={16} /></Button>
                <Button className="bg-pastel-red hover:bg-red-400 transition-transform" size="sm" onClick={() => handleEliminar(item.id)}>Eliminar <Trash2 size={16}/> </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex gap-4">
        <Button className="bg-pastel-blue hover:bg-blue-400 transition-transform">Confirmar Receta</Button>
        <Button className="bg-pastel-yellow hover:bg-yellow-400 transition-transform" onClick={handleLimpiar}>Limpiar</Button>
      </div>
    </div>
  )
}

export default FormAgregarReceta
