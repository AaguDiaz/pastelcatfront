import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { DashboardResponse, ClienteResumen, ProductoDetalle, ProductoTop } from '@/interfaces/dashboard';

type PdfOptions = {
  startLabel: string;
  endLabel: string;
};

const PAGE = { width: 210, height: 297, margin: 10 };
const COLORS = {
  primary: '#0f4c5c',
  accent: '#f0c987',
  bgLight: '#f7f2e7',
  text: '#1f2937',
};

const formatDateLabel = (isoDate: string) => {
  try {
    return format(parseISO(isoDate), "d 'de' MMMM yyyy", { locale: es });
  } catch {
    return isoDate;
  }
};

const drawSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFillColor(COLORS.bgLight);
  doc.rect(PAGE.margin, y - 6, PAGE.width - PAGE.margin * 2, 10, 'F');
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(12);
  doc.text(title, PAGE.margin + 2, y);
  doc.setTextColor(COLORS.text);
  return y + 8;
};

const kpiCard = (doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string) => {
  doc.setFillColor(COLORS.bgLight);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  doc.setDrawColor(COLORS.accent);
  doc.roundedRect(x, y, w, h, 2, 2);

  doc.setTextColor(COLORS.primary);
  doc.setFontSize(10);
  doc.text(label, x + 4, y + 6);
  doc.setTextColor(COLORS.text);
  doc.setFontSize(12);
  doc.text(value, x + 4, y + 14);
};

const addTable = (doc: jsPDF, head: string[], body: (string | number | null)[][], startY: number) => {
  autoTable(doc, {
    head: [head],
    body,
    startY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: 240 },
    margin: { left: PAGE.margin, right: PAGE.margin },
  });
};

export const exportDashboardPdf = (data: DashboardResponse, opts: PdfOptions) => {
  const filename = `reportes-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  const doc = new jsPDF();
  let y = PAGE.margin + 4;

  const ensure = (height: number) => {
    if (y + height > PAGE.height - PAGE.margin) {
      doc.addPage();
      y = PAGE.margin + 4;
    }
  };

  // Portada
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(16);
  doc.text('Dashboard de operaciones', PAGE.margin, y);
  y += 8;
  doc.setTextColor(COLORS.text);
  doc.setFontSize(10);
  doc.text(`Rango: ${opts.startLabel} - ${opts.endLabel}`, PAGE.margin, y);
  y += 10;

  // Seccion A
  y = drawSectionTitle(doc, 'Seccion A - Resumen general', y + 6);
  const cardWidth = (PAGE.width - PAGE.margin * 2 - 6) / 2;
  const cardHeight = 18;
  ensure(cardHeight * 2 + 6);
  kpiCard(doc, PAGE.margin, y, cardWidth, cardHeight, 'Ingresos totales', data.resumen ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(data.resumen.ingresosTotales) : '--');
  kpiCard(doc, PAGE.margin + cardWidth + 6, y, cardWidth, cardHeight, 'Operaciones', data.resumen ? `${data.resumen.totalOperaciones} (Pedidos: ${data.resumen.totalPedidos} | Eventos: ${data.resumen.totalEventos})` : '--');
  kpiCard(doc, PAGE.margin, y + cardHeight + 6, cardWidth, cardHeight, 'Ingresos pedidos', data.resumenes?.pedidos ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(data.resumenes.pedidos.ingresosTotales) : '--');
  kpiCard(doc, PAGE.margin + cardWidth + 6, y + cardHeight + 6, cardWidth, cardHeight, 'Ingresos eventos', data.resumenes?.eventos ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(data.resumenes.eventos.ingresosTotales) : '--');
  y += cardHeight * 2 + 12;

  // Seccion B - Ventas y tendencias (texto + placeholders)
  y = drawSectionTitle(doc, 'Seccion B - Ventas y tendencias', y + 6);
  ensure(40);
  doc.setFontSize(10);
  doc.text('Ingresos combinados, pedidos y eventos (ver gráficos en la app).', PAGE.margin, y);
  y += 6;
  doc.setDrawColor(COLORS.accent);
  doc.rect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 14);
  doc.text('Ingresos combinados', PAGE.margin + 2, y + 5);
  doc.rect(PAGE.margin, y + 16, (PAGE.width - PAGE.margin * 2 - 4) / 2, 14);
  doc.text('Ingresos pedidos', PAGE.margin + 2, y + 21);
  doc.rect(PAGE.margin + (PAGE.width - PAGE.margin * 2) / 2 + 2, y + 16, (PAGE.width - PAGE.margin * 2 - 4) / 2, 14);
  doc.text('Ingresos eventos', PAGE.margin + (PAGE.width - PAGE.margin * 2) / 2 + 4, y + 21);
  y += 32;
  doc.rect(PAGE.margin, y, (PAGE.width - PAGE.margin * 2 - 4) / 2, 14);
  doc.text('Pedidos por estado', PAGE.margin + 2, y + 5);
  doc.rect(PAGE.margin + (PAGE.width - PAGE.margin * 2) / 2 + 2, y, (PAGE.width - PAGE.margin * 2 - 4) / 2, 14);
  doc.text('Eventos por estado', PAGE.margin + (PAGE.width - PAGE.margin * 2) / 2 + 4, y + 5);
  y += 22;

  // Seccion C - Productos
  y = drawSectionTitle(doc, 'Seccion C - Rendimiento de productos', y + 8);
  ensure(10);
  doc.setFontSize(10);
  doc.text('Top tortas y bandejas, más detalle de productos.', PAGE.margin, y);
  y += 6;

  const renderList = (title: string, items: ProductoTop[] | undefined | null) => {
    if (!items?.length) return;
    ensure(6 + items.length * 5);
    doc.setFontSize(10);
    doc.text(title, PAGE.margin, y);
    doc.setFontSize(9);
    items.slice(0, 5).forEach((itm, idx) => {
      doc.text(`${idx + 1}. ${itm.nombre} - ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(itm.ingresos)}`, PAGE.margin + 2, y + 5 + idx * 5);
    });
    y += 5 + items.length * 5;
  };
  renderList('Top tortas', data.productos?.topTortas ?? []);
  renderList('Top bandejas', data.productos?.topBandejas ?? []);

  if (data.productos?.tablaProductos?.length) {
    ensure(10);
    doc.setFontSize(10);
    doc.text('Detalle de productos (top filas)', PAGE.margin, y);
    y += 4;
    const body = (data.productos.tablaProductos as ProductoDetalle[]).slice(0, 6).map((p) => [
      p.nombre,
      p.tipo === 'torta' ? 'Torta' : 'Bandeja',
      p.cantidadVendida,
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p.ingresosTotales),
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p.precioPromedio),
    ]);
    addTable(doc, ['Producto', 'Tipo', 'Cantidad', 'Ingresos', 'Precio promedio'], body, y + 2);
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Seccion D - Clientes
  y = drawSectionTitle(doc, 'Seccion D - Analisis de clientes', y + 8);
  doc.setFontSize(10);
  doc.text('Clientes destacados por monto (pedidos + eventos).', PAGE.margin, y);
  y += 4;
  const clientes: ClienteResumen[] = data.clientes?.top ?? [];
  if (clientes.length) {
    const body = clientes.slice(0, 8).map((c, idx) => [
      idx + 1,
      c.nombre,
      c.email || 'Sin email',
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(c.totalGastado),
      c.cantidadPedidos ?? 0,
      c.cantidadEventos ?? 0,
    ]);
    addTable(doc, ['#', 'Cliente', 'Email', 'Total', 'Pedidos', 'Eventos'], body, y + 2);
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Seccion E - Agenda
  y = drawSectionTitle(doc, 'Seccion E - Agenda proxima', y + 8);
  doc.setFontSize(10);
  doc.text('Próximas entregas de pedidos y eventos.', PAGE.margin, y);
  y += 4;
  const agendaRows: string[][] = [];
  (data.agenda?.pedidos || []).slice(0, 4).forEach((p) => {
    agendaRows.push(['Pedido', p.id ? String(p.id) : '-', p.fecha_entrega ? formatDateLabel(p.fecha_entrega) : 'Sin fecha', new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p.total_final ?? 0), p.cliente || 'Sin cliente']);
  });
  (data.agenda?.eventos || []).slice(0, 4).forEach((e) => {
    agendaRows.push(['Evento', e.id ? String(e.id) : '-', e.fecha_entrega ? formatDateLabel(e.fecha_entrega) : 'Sin fecha', new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(e.total_final ?? 0), e.cliente || 'Sin cliente']);
  });
  if (agendaRows.length) {
    addTable(doc, ['Tipo', 'ID', 'Fecha', 'Total', 'Cliente'], agendaRows, y + 2);
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  doc.save(filename);
};
