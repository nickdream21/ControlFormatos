export interface EmpresaDB {
  id: string;
  nombre: string;
  ruc?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  contacto?: string | null;
  activa: number; // SQLite usa 0/1 para boolean
  created_at: string;
  updated_at: string;
}

export interface EmpresaCreateInput {
  nombre: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activa?: boolean;
}

export interface EmpresaUpdateInput {
  nombre?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activa?: boolean;
}

// Función helper para convertir de DB a modelo de UI
export function empresaFromDB(empresaDB: EmpresaDB): import('../../types').Empresa {
  return {
    id: empresaDB.id,
    nombre: empresaDB.nombre,
    ruc: empresaDB.ruc || undefined,
    direccion: empresaDB.direccion || undefined,
    telefono: empresaDB.telefono || undefined,
    email: empresaDB.email || undefined,
    contacto: empresaDB.contacto || undefined,
    activa: empresaDB.activa === 1,
    created_at: empresaDB.created_at,
    updated_at: empresaDB.updated_at
  };
}

// Función helper para convertir de modelo UI a DB
export function empresaToDB(empresa: import('../../types').Empresa): EmpresaDB {
  return {
    id: empresa.id,
    nombre: empresa.nombre,
    ruc: empresa.ruc || null,
    direccion: empresa.direccion || null,
    telefono: empresa.telefono || null,
    email: empresa.email || null,
    contacto: empresa.contacto || null,
    activa: empresa.activa ? 1 : 0,
    created_at: empresa.created_at,
    updated_at: empresa.updated_at
  };
}