'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

export default function RawMaterials() {
  const router = useRouter();
  const [materials, setMaterials] = useState<RawMaterial[]>([
    { id: 1, name: 'Harina', quantity: 50, unit: 'kg' },
    { id: 2, name: 'Azúcar', quantity: 20, unit: 'kg' },
  ]);
  const [form, setForm] = useState<RawMaterial>({ id: 0, name: '', quantity: 0, unit: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleAddOrUpdate = () => {
    if (isEditing) {
      setMaterials(materials.map((m) => (m.id === form.id ? form : m)));
    } else {
      setMaterials([...materials, { ...form, id: materials.length + 1 }]);
    }
    setForm({ id: 0, name: '', quantity: 0, unit: '' });
    setIsEditing(false);
  };

  const handleEdit = (material: RawMaterial) => {
    setForm(material);
    setIsEditing(true);
  };

  const handleDelete = (id: number) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-pastel-beige p-8">
      <h1 className="text-3xl font-bold text-pastel-brown mb-6">Gestión de Materia Prima</h1>

      {/* Formulario */}
      <div className="bg-pastel-cream p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold text-pastel-brown mb-4">{isEditing ? 'Editar' : 'Agregar'} Materia Prima</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="p-2 border border-pastel-brown rounded focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) })}
            className="p-2 border border-pastel-brown rounded focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          />
          <input
            type="text"
            placeholder="Unidad (ej. kg)"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="p-2 border border-pastel-brown rounded focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          />
        </div>
        <button
          onClick={handleAddOrUpdate}
          className="mt-4 px-4 py-2 bg-pastel-blue text-pastel-brown rounded-lg hover:bg-pastel-pink transition"
        >
          {isEditing ? 'Actualizar' : 'Agregar'}
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-pastel-cream p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-pastel-brown mb-4">Lista de Materia Prima</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-pastel-brown">
              <th className="p-2">Nombre</th>
              <th className="p-2">Cantidad</th>
              <th className="p-2">Unidad</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id} className="border-t border-pastel-brown/20">
                <td className="p-2">{material.name}</td>
                <td className="p-2">{material.quantity}</td>
                <td className="p-2">{material.unit}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleEdit(material)}
                    className="px-2 py-1 bg-pastel-blue text-pastel-brown rounded mr-2 hover:bg-pastel-pink transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}