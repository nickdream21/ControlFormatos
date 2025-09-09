export interface FormatoDB {
  id: string;
  numeracion: number;
  fecha_ingreso: string;
  ubicacion_actual: string;
  fecha_salida?: string | null;
  ubicacion_destino?: string | null;
  destinatario?: string | null;
  observaciones?: string | null;
  pedido_id: string;
  estado: 'disponible' | 'asignado' | 'entregado';
  created_at: string;
  updated_at: string;
}

export interface FormatoCreateInput {
  numeracion: number;
  fecha_ingreso: string;
  ubicacion_actual: string;
  fecha_salida?: string;
  ubicacion_destino?: string;
  destinatario?: string;
  observaciones?: string;
  pedido_id: string;
  estado: 'disponible' | 'asignado' | 'entregado';
}

export interface FormatoUpdateInput {
  numeracion?: number;
  fecha_ingreso?: string;
  ubicacion_actual?: string;
  fecha_salida?: string;
  ubicacion_destino?: string;
  destinatario?: string;
  observaciones?: string;
  pedido_id?: string;
  estado?: 'disponible' | 'asignado' | 'entregado';
}

// Función helper para convertir de DB a modelo de UI
export function formatoFromDB(formatoDB: FormatoDB): import('../../types').Formato {
  return {
    id: formatoDB.id,
    numeracion: formatoDB.numeracion,
    fecha_ingreso: formatoDB.fecha_ingreso,
    ubicacion_actual: formatoDB.ubicacion_actual,
    fecha_salida: formatoDB.fecha_salida || undefined,
    ubicacion_destino: formatoDB.ubicacion_destino || undefined,
    destinatario: formatoDB.destinatario || undefined,
    observaciones: formatoDB.observaciones || undefined,
    pedido_id: formatoDB.pedido_id,
    estado: formatoDB.estado,
    created_at: formatoDB.created_at,
    updated_at: formatoDB.updated_at
  };
}

// Función helper para convertir de modelo UI a DB
export function formatoToDB(formato: import('../../types').Formato): FormatoDB {
  return {
    id: formato.id,
    numeracion: formato.numeracion,
    fecha_ingreso: formato.fecha_ingreso,
    ubicacion_actual: formato.ubicacion_actual,
    fecha_salida: formato.fecha_salida || null,
    ubicacion_destino: formato.ubicacion_destino || null,
    destinatario: formato.destinatario || null,
    observaciones: formato.observaciones || null,
    pedido_id: formato.pedido_id,
    estado: formato.estado,
    created_at: formato.created_at,
    updated_at: formato.updated_at
  };
}