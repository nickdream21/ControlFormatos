export interface TipoFormatoDB {
  id: string;
  nombre: string;
  descripcion?: string | null;
  empresa_id: string;
  imagen?: string | null;
  activo: number; // SQLite usa 0/1 para boolean
  created_at: string;
  updated_at: string;
}

export interface TipoFormatoCreateInput {
  nombre: string;
  descripcion?: string;
  empresa_id: string;
  imagen?: string;
  activo?: boolean;
}

export interface TipoFormatoUpdateInput {
  nombre?: string;
  descripcion?: string;
  empresa_id?: string;
  imagen?: string;
  activo?: boolean;
}

// Función helper para convertir de DB a modelo de UI
export function tipoFormatoFromDB(tipoFormatoDB: TipoFormatoDB): import('../../types').TipoFormato {
  return {
    id: tipoFormatoDB.id,
    nombre: tipoFormatoDB.nombre,
    descripcion: tipoFormatoDB.descripcion || undefined,
    empresa_id: tipoFormatoDB.empresa_id,
    imagen: tipoFormatoDB.imagen || undefined,
    activo: tipoFormatoDB.activo === 1,
    created_at: tipoFormatoDB.created_at,
    updated_at: tipoFormatoDB.updated_at
  };
}

// Función helper para convertir de modelo UI a DB
export function tipoFormatoToDB(tipoFormato: import('../../types').TipoFormato): TipoFormatoDB {
  return {
    id: tipoFormato.id,
    nombre: tipoFormato.nombre,
    descripcion: tipoFormato.descripcion || null,
    empresa_id: tipoFormato.empresa_id,
    imagen: tipoFormato.imagen || null,
    activo: tipoFormato.activo ? 1 : 0,
    created_at: tipoFormato.created_at,
    updated_at: tipoFormato.updated_at
  };
}