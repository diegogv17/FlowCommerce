/** Nombre legible de cada herramienta del asistente (mientras corre / al terminar). */
export const TOOL_LABELS: Record<string, { running: string; done: string }> = {
  buscar_leads: { running: 'Buscando leads', done: 'Consultó leads' },
  ver_lead: { running: 'Revisando el lead', done: 'Revisó el lead' },
  buscar_clientes: { running: 'Buscando clientes', done: 'Consultó clientes' },
  buscar_cotizaciones: { running: 'Buscando cotizaciones', done: 'Consultó cotizaciones' },
  resumen_dashboard: { running: 'Leyendo las métricas', done: 'Leyó las métricas' },
  catalogo_productos: { running: 'Revisando el catálogo', done: 'Revisó el catálogo' },
  seguimientos_pendientes: { running: 'Revisando seguimientos', done: 'Revisó seguimientos' },
  crear_seguimiento: { running: 'Preparando el seguimiento', done: 'Seguimiento programado' },
}

export const FOLLOW_UP_TYPE_LABELS: Record<string, string> = {
  CALL: 'Llamada',
  MEETING: 'Reunión',
  EMAIL: 'Correo',
  WHATSAPP: 'WhatsApp',
  TASK: 'Tarea',
}
