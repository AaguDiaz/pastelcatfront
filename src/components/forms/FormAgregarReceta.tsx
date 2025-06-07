'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Combobox from '@/components/ui/combobox'
import { Pencil, Trash2 } from 'lucide-react'
import { useRecetaData } from '@/hooks/useRecetaData'
type FormAgregarRecetaProps = ReturnType<typeof useRecetaData>;
import ModalExito from '@/components/modals/exito'
import ModalError from '@/components/modals/error'

// El tipo local para la tabla de ingredientes, tal como estaba en tu código original
type IngredienteAgregado = {
  id: number;
  ingrediente: string;
  cantidad: string;
  unidad: string;
}

const FormAgregarReceta = (props: FormAgregarRecetaProps) => {
  // Desestructura todas las props que vienen del padre
  const {
    confirmarReceta,
    actualizarReceta,
    modalError,
    setModalError,
    modalExito,
    setModalExito,
    tortas,
    ingredientes,
    recetaSeleccionada, // Estado global que ahora viene por props
    modo,               // Modo global que ahora viene por props
    limpiarSeleccion,
  } = props;
  const [tortaSeleccionada, setTortaSeleccionada] = useState<string>('');
  const [porciones, setPorciones] = useState('');
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('');
  const [ingredientesAgregados, setIngredientesAgregados] = useState<IngredienteAgregado[]>([]);
  const [modoEdicion, setModoEdicion] = useState(false); // Modo de edición para un ingrediente en la tabla
  const [idEditando, setIdEditando] = useState<number | null>(null);

  // Variable para determinar si el formulario es de solo lectura (modo 'ver')
  const isReadOnly = modo === 'view';

  // EFECTO: Rellena el formulario cuando cambia la receta seleccionada desde el hook
  useEffect(() => {
    console.log(
      'useEffect en FormAgregarReceta EJECUTADO:',
      'recetaSeleccionada:', recetaSeleccionada,
      'modo:', modo
    );
    if (recetaSeleccionada && (modo === 'view' || modo === 'edit')) { 
      const torta = tortas.find(t => t.id_torta === recetaSeleccionada.torta.id_torta); 
      setTortaSeleccionada(torta?.nombre || '');
      setPorciones(String(recetaSeleccionada.porciones));
      setIngredientesAgregados(
        recetaSeleccionada.ingredientes.map(ing => ({
          id: ing.id_materiaprima,
          ingrediente: ing.nombre,
          cantidad: String(ing.cantidad),
          unidad: ing.unidadmedida,
        }))
      );
    } else {
      // Si no hay receta seleccionada, se limpian los campos locales
      // handleLimpiar() ya no es necesario aquí porque limpiarSeleccion()
      // no afecta los estados locales directamente.
      setTortaSeleccionada('');
      setPorciones('');
      setIngredienteSeleccionado('');
      setCantidad('');
      setUnidad('');
      setIngredientesAgregados([]);
      setModoEdicion(false);
      setIdEditando(null);
    }
  }, [recetaSeleccionada, modo, tortas]); // Las dependencias son correctas.

  const handleAgregarOEditarIngrediente = () => {
    if (!ingredienteSeleccionado || !cantidad || !unidad) return;
    
    // Si estamos editando un ingrediente de la tabla
    if (modoEdicion && idEditando !== null) {
      setIngredientesAgregados(prev =>
        prev.map(item =>
          item.id === idEditando ? { ...item, ingrediente: ingredienteSeleccionado, cantidad, unidad } : item
        )
      );
      setModoEdicion(false);
      setIdEditando(null);
    } else {
      // Si estamos agregando un nuevo ingrediente a la tabla
      const ingredienteObj = ingredientes.find(i => i.nombre === ingredienteSeleccionado);
      if (!ingredienteObj) {
        setModalError({ mostrar: true, mensaje: 'Ingrediente no válido.' });
        return;
      }
      setIngredientesAgregados(prev => [
        ...prev,
        { id: ingredienteObj.id_materiaprima, ingrediente: ingredienteSeleccionado, cantidad, unidad }
      ]);
    }
    // Limpia los campos del ingrediente
    setIngredienteSeleccionado('');
    setCantidad('');
    setUnidad('');
  };

  // Carga un ingrediente de la tabla en los campos de edición
  const handleEditarIngrediente = (item: IngredienteAgregado) => {
    setIngredienteSeleccionado(item.ingrediente);
    setCantidad(item.cantidad);
    setUnidad(item.unidad);
    setModoEdicion(true);
    setIdEditando(item.id);
  };

  // Elimina un ingrediente de la tabla
  const handleEliminarIngrediente = (id: number) => {
    setIngredientesAgregados(prev => prev.filter(item => item.id !== id));
  };

  const handleLimpiar = () => {
    // Resetea todos los estados locales del formulario
    setTortaSeleccionada('');
    setPorciones('');
    setIngredienteSeleccionado('');
    setCantidad('');
    setUnidad('');
    setIngredientesAgregados([]);
    setModoEdicion(false);
    setIdEditando(null);
    // Y también resetea el estado global del hook para volver al modo 'crear'
    limpiarSeleccion();
  };

  const handleConfirmar = async () => {
    if (!tortaSeleccionada || !porciones || ingredientesAgregados.length === 0) {
      setModalError({ mostrar: true, mensaje: 'Debes completar todos los campos.' });
      return;
    }

    const ingredientesFormateados = ingredientesAgregados.map(item => ({
      id_materiaprima: item.id,
      cantidad: parseFloat(item.cantidad),
      unidadmedida: item.unidad
    }));
    
    // Si estamos en modo 'edit', llamamos a la función de actualizar
    if (modo === 'edit' && recetaSeleccionada) {
      const payload = {
        porciones: parseInt(porciones),
        ingredientes: ingredientesFormateados,
      };
      await actualizarReceta(recetaSeleccionada.id_receta, payload);
    } else {
      // Si no, estamos en modo 'crear', llamamos a la función original
      const tortaObj = tortas.find(t => t.nombre === tortaSeleccionada);
      if (!tortaObj) {
        setModalError({ mostrar: true, mensaje: 'La torta seleccionada no es válida.' });
        return;
      }
      const payload = {
        id_torta: tortaObj.id_torta,
        porciones: parseInt(porciones),
        ingredientes: ingredientesFormateados
      };
      await confirmarReceta(payload);
    }
    // Tras una operación exitosa, el hook se encarga de limpiar y recargar
  };

  return (
    <div className="bg-pastel-cream text-black p-6 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-4">
        {modo === 'edit' ? 'Editar Receta' : modo === 'view' ? 'Detalles de la Receta' : 'Agregar Receta'}
      </h2>
      
      {/* Campos principales del formulario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium">Torta</label>
          <Combobox
            options={tortas.map(t => ({ id: String(t.id_torta), nombre: t.nombre }))}
            value={tortaSeleccionada}
            onSelect={setTortaSeleccionada}
            disabled={modo === 'edit' || isReadOnly} // Se deshabilita al editar o ver
          />
        </div>
        <div>
          <label className="text-sm font-medium">Porciones</label>
          <Input type="number" placeholder="Ej: 22" value={porciones}
            onChange={(e) => setPorciones(e.target.value)}
            readOnly={isReadOnly} // Solo lectura en modo 'ver'
          />
        </div>
        <div>
          <label className="text-sm font-medium">Ingrediente</label>
          <Combobox options={ingredientes.map(i => ({ id: String(i.id_materiaprima), nombre: i.nombre }))}
            value={ingredienteSeleccionado}
            onSelect={setIngredienteSeleccionado}
            disabled={isReadOnly} // Deshabilitado en modo 'ver'
          />
        </div>
      </div>

      {/* Sección para agregar/editar ingredientes (aparece al seleccionar un ingrediente) */}
      {ingredienteSeleccionado && !isReadOnly && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
          <div>
            <label className="text-sm font-medium">Cantidad</label>
            <Input type="number" placeholder="Ej: 1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Unidad</label>
            <Input placeholder="Unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
          </div>
          <Button className="bg-pastel-blue hover:bg-blue-400" onClick={handleAgregarOEditarIngrediente}>
            {modoEdicion ? 'Confirmar Edición' : 'Agregar Ingrediente'}
          </Button>
        </div>
      )}

      {/* Tabla de ingredientes agregados */}
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
            <tr key={item.id} className="text-left border-t">
              <td className="py-2">{item.ingrediente}</td>
              <td className="py-2">{item.cantidad}</td>
              <td className="py-2">{item.unidad}</td>
              <td className="py-2 space-x-2">
                <Button className="bg-pastel-blue hover:bg-blue-400" size="sm" onClick={() => handleEditarIngrediente(item)} disabled={isReadOnly}>
                  <Pencil size={16} /> Editar
                </Button>
                <Button className="bg-pastel-red hover:bg-red-400" size="sm" onClick={() => handleEliminarIngrediente(item.id)} disabled={isReadOnly}>
                  <Trash2 size={16} /> Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botones de acción principales */}
      <div className="mt-6 flex gap-4">
        <Button className="bg-pastel-blue hover:bg-blue-400" onClick={handleConfirmar} disabled={isReadOnly}>
            {modo === 'edit' ? 'Guardar Cambios' : 'Confirmar Receta'}
        </Button>
        <Button className="bg-pastel-yellow hover:bg-yellow-400" onClick={handleLimpiar}>
          Limpiar
        </Button>
      </div>
      
      {/* Modales de feedback */}
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

export default FormAgregarReceta;