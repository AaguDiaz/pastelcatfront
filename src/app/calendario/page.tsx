"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { EventCalendar, addHoursToDate } from "@/components/calendario"
import type { CalendarEvent, EventColor } from "@/components/calendario/types"
import usePedidoData from "@/hooks/usePedidoData"

// Map estado -> calendar color
function estadoToColor(estadoRaw: string): EventColor {
  const estado = (estadoRaw || "").toString().trim().toLowerCase()
  switch (estado) {
    case "pendiente":
      return "amber" // Amarillo pastel
    case "confirmado":
      return "emerald" // Verde pastel
    case "cerrado":
      return "sky" // Azul pastel
    case "cancelado":
      return "rose" // Rojo pastel
    default:
      return "sky"
  }
}

// Parse date string (supports YYYY-MM-DD or ISO with time)
function parseFechaEntrega(fecha: string): Date {
  if (!fecha) return new Date()
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(fecha)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2]) - 1
    const d = Number(m[3])
    return new Date(y, mo, d, 0, 0, 0, 0)
  }
  // Fallback: let Date parse full ISO string
  const dt = new Date(fecha)
  return isNaN(dt.getTime()) ? new Date() : dt
}

export default function CalendarioPage() {
  const { pedidos, getPedidoCompleto } = usePedidoData()

  // Local extra events created from the calendar UI (not persisted)
  const [extraEvents, setExtraEvents] = useState<CalendarEvent[]>([])

  const [pedidoLocations, setPedidoLocations] = useState<Record<number, string | undefined>>({})

  useEffect(() => {
    let cancelled = false
    async function fillLocations() {
      const idsToFetch = (pedidos || [])
        .map((p) => p.id)
        .filter((id) => pedidoLocations[id] === undefined)

      if (idsToFetch.length === 0) return
      // Fetch sequentially to avoid spamming the API
      for (const id of idsToFetch) {
        try {
          const full = await getPedidoCompleto(id)
          if (!cancelled) {
            setPedidoLocations((prev) => ({ ...prev, [id]: full.direccion_entrega ?? undefined }))
          }
        } catch (error) {
          console.error("Error fetching pedido completo for location:", error)
          if (!cancelled) setPedidoLocations((prev) => ({ ...prev, [id]: undefined }))
        }
      }
    }
    fillLocations()
    return () => { cancelled = true }
  }, [pedidos, getPedidoCompleto])

  const pedidoEvents = useMemo<CalendarEvent[]>(() => {
    return (pedidos || []).map((p) => {
      const start = parseFechaEntrega(p.fecha_entrega)
      const end = addHoursToDate(start, 2) // 2 hours after delivery time
      const color = estadoToColor(p.estado)
      return {
        id: `pedido-${p.id}`,
        title: `Pedido #${p.id} - ${p.cliente?.nombre ?? ""}`.trim(),
        description: p.observaciones ?? undefined,
        start,
        end,
        allDay: false,
        color,
        location: pedidoLocations[p.id],
      } satisfies CalendarEvent
    })
  }, [pedidos, pedidoLocations])

  const events = useMemo(
    () => [...pedidoEvents, ...extraEvents],
    [pedidoEvents, extraEvents]
  )

  // Handle create/update/delete only for local extra events
  const handleAdd = useCallback((event: CalendarEvent) => {
    // Prefix id to mark as local
    const id = event.id && !event.id.startsWith("pedido-")
      ? event.id
      : `extra-${Math.random().toString(36).slice(2, 10)}`
    setExtraEvents((prev) => [...prev, { ...event, id }])
  }, [])

  const handleUpdate = useCallback((updated: CalendarEvent) => {
    // Only allow updates for local extra events
    if (!updated.id || !updated.id.startsWith("extra-")) return
    setExtraEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }, [])

  const handleDelete = useCallback((eventId: string) => {
    if (!eventId?.startsWith("extra-")) return
    setExtraEvents((prev) => prev.filter((e) => e.id !== eventId))
  }, [])

  return (
    <div className="p-4">
      <EventCalendar
        events={events}
        onEventAdd={handleAdd}
        onEventUpdate={handleUpdate}
        onEventDelete={handleDelete}
        initialView="month"
      />
    </div>
  )
}
