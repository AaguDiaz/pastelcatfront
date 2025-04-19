'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Pencil, Plus } from 'lucide-react'

const mockData = [
  { id: 1, nombre: 'Harina', unidad: 'kg', cantidad: 25, precio: 1500 },
  { id: 2, nombre: 'Azúcar', unidad: 'kg', cantidad: 10, precio: 800 },
  { id: 3, nombre: 'Huevos', unidad: 'docena', cantidad: 5, precio: 1200 },
  { id: 4, nombre: 'Leche', unidad: 'litro', cantidad: 15, precio: 1350 },
  { id: 5, nombre: 'Manteca', unidad: 'kg', cantidad: 2, precio: 500 },
  { id: 6, nombre: 'Chocolate', unidad: 'kg', cantidad: 3, precio: 3000 },
  { id: 7, nombre: 'Frutillas', unidad: 'kg', cantidad: 1, precio: 1800 },
  { id: 8, nombre: 'Crema', unidad: 'litro', cantidad: 5, precio: 950 },
  { id: 9, nombre: 'Vainilla', unidad: 'ml', cantidad: 100, precio: 300 },
  { id: 10, nombre: 'Colorantes', unidad: 'ml', cantidad: 50, precio: 100 },
  { id: 11, nombre: 'Nueces', unidad: 'kg', cantidad: 2, precio: 2200 },
]

export default function MateriasPrimas() {
  const [data, setData] = useState(mockData)
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')
  const [search, setSearch] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [idEliminar, setIdEliminar] = useState<number | null>(null)

  const agregarFila = () => {
    const nuevaFila = {
      id: Date.now(),
      nombre,
      unidad,
      cantidad: parseFloat(cantidad),
      precio: parseFloat(precio),
    }
    setData(prev => [nuevaFila, ...prev])
    setNombre('')
    setUnidad('')
    setCantidad('')
    setPrecio('')
  }

  const eliminar = () => {
    setData(data.filter(d => d.id !== idEliminar))
    setModalEliminar(false)
  }

  const filtrado = data.filter(item =>
    item.nombre.toLowerCase().includes(search.toLowerCase())
  )
  const totalPaginas = Math.ceil(filtrado.length / 10)
  const datosPaginados = filtrado.slice((pagina - 1) * 10, pagina * 10)

  return (
    <div className="min-h-screen bg-pastel-beige p-8">
      <div className="bg-pastel-cream shadow-2xl rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Agregar Materia Prima</h2>
        <div className="grid grid-cols-5 gap-4 mb-4">
          <Input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
          <Input placeholder="Unidad" value={unidad} onChange={e => setUnidad(e.target.value)} />
          <Input placeholder="Cantidad" type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} />
          <Input placeholder="Precio Total" type="number" value={precio} onChange={e => setPrecio(e.target.value)} />
          <Button onClick={agregarFila} className="bg-pastel-blue hover:scale-105 transition-transform">Agregar</Button>
        </div>
        <Input placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-pastel-cream shadow-2xl rounded-2xl p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Nombre</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Precio Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {datosPaginados.map(row => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="border-b"
                >
                  <td className="py-2">{row.nombre}</td>
                  <td>{row.unidad}</td>
                  <td>{row.cantidad}</td>
                  <td>${row.precio}</td>
                  <td className="flex gap-2">
                    <Button className="bg-pastel-blue hover:scale-105 transition-transform">
                      <Pencil size={16} />
                    </Button>
                    <Button onClick={() => { setIdEliminar(row.id); setModalEliminar(true) }} className="bg-pastel-red hover:scale-105 transition-transform">
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        <div className="flex justify-between mt-4">
          {pagina > 1 ? (
            <Button onClick={() => setPagina(pagina - 1)} className="bg-pastel-blue hover:scale-105 transition-transform">Anterior</Button>
          ) : <div />}
          {pagina < totalPaginas && (
            <Button onClick={() => setPagina(pagina + 1)} className="bg-pastel-blue hover:scale-105 transition-transform">Siguiente</Button>
          )}
        </div>
      </div>

      <Dialog open={modalEliminar} onOpenChange={setModalEliminar}>
        <DialogContent className="bg-pastel-cream">
          <DialogHeader>
            <h2 className="text-lg font-semibold">¿Estás seguro de eliminar esta materia prima?</h2>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEliminar(false)}>Cancelar</Button>
            <Button className="bg-[#ff6961] hover:scale-105 transition-transform" onClick={eliminar}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}