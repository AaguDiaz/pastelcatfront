'use client';

import { useState } from 'react';
import AddEditPedidos from '@/components/forms/FormaAddEditPedido';
import { ItemPedido, Producto } from '@/interfaces/pedidos';

export default function PedidosPage() {
  const [items, setItems] = useState<ItemPedido[]>([]);

  const addItem = (product: Producto) => {
    const key = `${product.tipo}-${product.id}`;
    setItems(prev => {
      const idx = prev.findIndex(i => i.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
        }
      return [
        ...prev,
        {
          key,
          productoId: product.id,
          id: product.id,
          tipo: product.tipo,
          nombre: product.nombre,
          precio: product.precio,
          cantidad: 1,
        },
      ];
    });
  };
  
  const updateQty = (key: string, qty: number) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, cantidad: qty } : i));
  };

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key));
  };

  const clearItems = () => setItems([]);

  return (
    <div className="min-h-screen bg-pastel-beige p-4 md:p-8">
      <AddEditPedidos
        items={items}
        onAddItem={addItem}
        onUpdateItemQuantity={updateQty}
        onRemoveItem={removeItem}
        onClearItems={clearItems}
      />
    </div>
  );
}