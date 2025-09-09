export interface PedidoDB {
  id: string;
  fecha: string;
  formato: string;
  empresa: string;
  cantidad: number;
  numeracion_inicial: number;
  estado: 'por recoger' | 'recogido' | 'pagado' | 'sin pagar';
  fecha_recojo?: string | null;
  fecha_pago?: string | null;
  monto: number;
  pagado: number; // SQLite usa 0/1 para boolean
  created_at: string;
  updated_at: string;
}

export interface PedidoCreateInput {
  fecha: string;
  formato: string;
  empresa: string;
  cantidad: number;
  numeracion_inicial: number;
  estado: 'por recoger' | 'recogido' | 'pagado' | 'sin pagar';
  fecha_recojo?: string;
  fecha_pago?: string;
  monto: number;
  pagado: boolean;
}

export interface PedidoUpdateInput {
  fecha?: string;
  formato?: string;
  empresa?: string;
  cantidad?: number;
  numeracion_inicial?: number;
  estado?: 'por recoger' | 'recogido' | 'pagado' | 'sin pagar';
  fecha_recojo?: string;
  fecha_pago?: string;
  monto?: number;
  pagado?: boolean;
}

// Función helper para convertir de DB a modelo de UI
export function pedidoFromDB(pedidoDB: PedidoDB): import('../../types').Pedido {
  return {
    id: pedidoDB.id,
    fecha: pedidoDB.fecha,
    formato: pedidoDB.formato,
    empresa: pedidoDB.empresa,
    cantidad: pedidoDB.cantidad,
    numeracion_inicial: pedidoDB.numeracion_inicial,
    estado: pedidoDB.estado,
    fecha_recojo: pedidoDB.fecha_recojo || undefined,
    fecha_pago: pedidoDB.fecha_pago || undefined,
    monto: pedidoDB.monto,
    pagado: pedidoDB.pagado === 1,
    created_at: pedidoDB.created_at,
    updated_at: pedidoDB.updated_at
  };
}

// Función helper para convertir de modelo UI a DB
export function pedidoToDB(pedido: import('../../types').Pedido): PedidoDB {
  return {
    id: pedido.id,
    fecha: pedido.fecha,
    formato: pedido.formato,
    empresa: pedido.empresa,
    cantidad: pedido.cantidad,
    numeracion_inicial: pedido.numeracion_inicial,
    estado: pedido.estado,
    fecha_recojo: pedido.fecha_recojo || null,
    fecha_pago: pedido.fecha_pago || null,
    monto: pedido.monto,
    pagado: pedido.pagado ? 1 : 0,
    created_at: pedido.created_at,
    updated_at: pedido.updated_at
  };
}