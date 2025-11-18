'use client';

import React, { createContext, useContext } from 'react';
import useEventoData from '@/hooks/useEventoData';

type EventoDataValue = ReturnType<typeof useEventoData>;

export const EventoDataContext = createContext<EventoDataValue | null>(null);

export function EventoDataProvider({ children }: { children: React.ReactNode }) {
  const value = useEventoData();
  return (
    <EventoDataContext.Provider value={value}>{children}</EventoDataContext.Provider>
  );
}

export function useEventoDataCtx() {
  const ctx = useContext(EventoDataContext);
  if (!ctx) throw new Error('useEventoDataCtx debe usarse dentro de <EventoDataProvider>');
  return ctx;
}
