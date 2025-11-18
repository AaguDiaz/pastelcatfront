'use client';

import React, { createContext, useContext } from 'react';
import usePedidoData from '@/hooks/usePedidoData';

type PedidoDataValue = ReturnType<typeof usePedidoData>;

export const PedidoDataContext = createContext<PedidoDataValue | null>(null);

export function PedidoDataProvider({ children }: { children: React.ReactNode }) {
  const value = usePedidoData();
  return (
    <PedidoDataContext.Provider value={value}>{children}</PedidoDataContext.Provider>
  );
}

export function usePedidoDataCtx() {
  const ctx = useContext(PedidoDataContext);
  if (!ctx) throw new Error('usePedidoDataCtx debe usarse dentro de <PedidoDataProvider>');
  return ctx;
}
