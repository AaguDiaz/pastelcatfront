'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Pencil} from 'lucide-react'
const API_BASE_URL = 'http://localhost:5000'; //'https://pastelcatback.onrender.com';

interface MateriaPrima {
  id: number;
  nombre: string;
  unidad: string;
  cantidad: number;
  precio: number;
}

export default function MateriasPrimas() {
  const router = useRouter();
  const [data, setData] = useState<MateriaPrima[]>([]);
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [idEliminar, setIdEliminar] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/materias-primas?page=${pagina}&search=${encodeURIComponent(search)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', res.status, 'OK:', res.ok);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error('Error al obtener materias primas');
    }
    const{data: backendData, totalPages} = await res.json();
    setData(backendData.map((item: { id_materiaprima: number; nombre: string; unidadmedida: string; cantidad: number; preciototal: number }) => ({
      id: item.id_materiaprima,
      nombre: item.nombre,
      unidad: item.unidadmedida,
      cantidad: item.cantidad,
      precio: item.preciototal,
    })));
    setTotalPaginas(totalPages);
  }catch (error) {
      console.error(error);
    }
}

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }else{
      fetchMaterials();
    }
  }, [router, pagina, search, fetchMaterials]);

  const agregarFila = async () => {
    try{
      const token = localStorage.getItem('token');
      const newMaterial={
        nombre: nombre,
        unidadmedida: unidad,
        cantidad: parseFloat(cantidad),
        preciototal: parseFloat(precio),
      };
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_BASE_URL}/materias-primas/${editId}` : `${API_BASE_URL}/materias-primas`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMaterial),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error(isEditing ? 'Error al editar' : 'Error al agregar');
      }
      setNombre('');
      setUnidad('');
      setCantidad('');
      setPrecio('');
      setIsEditing(false);
      setEditId(null);
      fetchMaterials();
    }catch (error) {
      console.error(error);
    };
  }

  const editarFila = (row: MateriaPrima) => {
    setNombre(row.nombre);
    setUnidad(row.unidad);
    setCantidad(row.cantidad.toString());
    setPrecio(row.precio.toString());
    setIsEditing(true);
    setEditId(row.id);
  }

  const eliminar = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/materias-primas/${idEliminar}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error('Error al eliminar');
      }
      setModalEliminar(false);
      setIdEliminar(null);
      fetchMaterials();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="min-h-screen bg-pastel-beige p-8">
      <div className="bg-pastel-cream shadow-2xl rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">{isEditing ? 'Editar Materia Prima':'Agregar Materia Prima'}</h2>
        <div className="grid grid-cols-5 gap-4 mb-4">
          <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
          <Input placeholder="Cantidad" type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} step='0.01' />
          <Input placeholder="Precio Total" type="number" value={precio} onChange={e => setPrecio(e.target.value)} step='0.01'/>
          <Button onClick={agregarFila} className="bg-pastel-blue hover:scale-105 transition-transform">{isEditing ? 'Actualizar':'Agregar'}</Button>
        </div>
        <Input placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              {data.map(row => (
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
                  <td>{row.cantidad.toFixed(2)}</td>
                  <td>${row.precio.toFixed(2)}</td>
                  <td className="flex gap-2">
                    <Button onClick={()=> editarFila(row)} className="bg-pastel-blue hover:scale-105 transition-transform">
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
            <Button className="bg-pastel-red hover:scale-105 transition-transform" onClick={eliminar}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}