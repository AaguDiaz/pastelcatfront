'use client';

import { useState } from 'react';
import AddEditPedidos from '@/components/forms/FormaAddEditPedido';
import FormTablaPedido from '@/components/forms/FormTablaPedido';
import { ItemPedido, Producto } from '@/interfaces/pedidos';
import { EventoDataProvider } from '@/context/EventoDataContext';
import ModalError from '@/components/modals/error';

export default function EventosPage() {
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [stockError, setStockError] = useState<string | null>(null);

  const addItem = (product: Producto) => {
    const key = `${product.tipo}-${product.id}`;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      const currentQty = idx >= 0 ? prev[idx].cantidad : 0;
      const available =
        typeof product.stockDisponible === 'number' ? product.stockDisponible : undefined;
      if (available !== undefined && currentQty + 1 > available) {
        setStockError(
          `Solo hay ${available} unidades disponibles de ${product.nombre}.`,
        );
        return prev;
      }
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
          stockDisponible: available,
          stockTotal: product.stockTotal,
          categoriaNombre: product.categoriaNombre ?? null,
        },
      ];
    });
  };

  const updateQty = (key: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const maxStock =
          typeof i.stockDisponible === 'number' ? i.stockDisponible : undefined;
        const normalizedQty = Math.max(1, qty);
        if (maxStock !== undefined && normalizedQty > maxStock) {
          setStockError(
            `Solo hay ${maxStock} unidades disponibles de ${i.nombre}.`,
          );
        }
        const finalQty =
          maxStock !== undefined ? Math.min(normalizedQty, maxStock) : normalizedQty;
        return { ...i, cantidad: finalQty };
      }),
    );
  };

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clearItems = () => setItems([]);

  return (
    <div className="min-h-screen bg-pastel-beige p-4 md:p-8">
      <EventoDataProvider>
        <AddEditPedidos
          mode="evento"
          contextLabel="Evento"
          items={items}
          onAddItem={addItem}
          onUpdateItemQuantity={updateQty}
          onRemoveItem={removeItem}
          onClearItems={clearItems}
          onReplaceItems={(newItems: ItemPedido[]) => setItems(newItems)}
        />
        <FormTablaPedido mode="evento" contextLabel="Evento" />
      </EventoDataProvider>
      {stockError && (
        <ModalError
          titulo="Stock insuficiente"
          mensaje={stockError}
          onClose={() => setStockError(null)}
        />
      )}
    </div>
  );
}
