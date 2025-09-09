export interface Pedido {
  id: string;
  fecha: string;
  formato: string;
  empresa: string;
  cantidad: number;
  numeracion_inicial: number;
  estado: 'por recoger' | 'recogido' | 'pagado' | 'sin pagar';
  fecha_recojo?: string;
  monto: number;
  pagado: boolean;
  fecha_pago?: string;
  created_at: string;
  updated_at: string;
}

export interface Formato {
  id: string;
  numeracion: number;
  fecha_ingreso: string;
  ubicacion_actual: string;
  fecha_salida?: string;
  ubicacion_destino?: string;
  destinatario?: string;
  observaciones?: string;
  pedido_id: string;
  estado: 'disponible' | 'asignado' | 'entregado';
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_pedidos: number;
  pedidos_pendientes: number;
  pedidos_completados: number;
  monto_total: number;
  monto_pagado: number;
  monto_pendiente: number;
  formatos_disponibles: number;
  formatos_asignados: number;
  formatos_entregados: number;
}

export interface Empresa {
  id: string;
  nombre: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoFormato {
  id: string;
  nombre: string;
  descripcion?: string;
  empresa_id: string;
  imagen?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilterOptions {
  empresa?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}