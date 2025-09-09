import DatabaseManager from '../db';
import { 
  EmpresaDB, 
  EmpresaCreateInput, 
  EmpresaUpdateInput,
  empresaFromDB,
  empresaToDB
} from '../models/empresa';
import { Empresa } from '../../types';

class EmpresaRepository {
  private db: any;

  constructor() {
    this.db = DatabaseManager.getInstance().getDatabase();
  }

  // Crear una nueva empresa
  create(empresaData: EmpresaCreateInput): Empresa {
    const now = new Date().toISOString();
    const id = `empresa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const empresaToInsert: EmpresaDB = {
      id,
      nombre: empresaData.nombre,
      ruc: empresaData.ruc || null,
      direccion: empresaData.direccion || null,
      telefono: empresaData.telefono || null,
      email: empresaData.email || null,
      contacto: empresaData.contacto || null,
      activa: empresaData.activa !== false ? 1 : 0,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO empresas (
        id, nombre, ruc, direccion, telefono, email, contacto, activa, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      empresaToInsert.id,
      empresaToInsert.nombre,
      empresaToInsert.ruc,
      empresaToInsert.direccion,
      empresaToInsert.telefono,
      empresaToInsert.email,
      empresaToInsert.contacto,
      empresaToInsert.activa,
      empresaToInsert.created_at,
      empresaToInsert.updated_at
    );

    return empresaFromDB(empresaToInsert);
  }

  // Obtener todas las empresas
  findAll(): Empresa[] {
    const stmt = this.db.prepare('SELECT * FROM empresas ORDER BY nombre ASC');
    const empresasDB = stmt.all() as EmpresaDB[];
    return empresasDB.map(empresaFromDB);
  }

  // Obtener empresas activas
  findActive(): Empresa[] {
    const stmt = this.db.prepare('SELECT * FROM empresas WHERE activa = 1 ORDER BY nombre ASC');
    const empresasDB = stmt.all() as EmpresaDB[];
    return empresasDB.map(empresaFromDB);
  }

  // Obtener empresa por ID
  findById(id: string): Empresa | null {
    const stmt = this.db.prepare('SELECT * FROM empresas WHERE id = ?');
    const empresaDB = stmt.get(id) as EmpresaDB | undefined;
    return empresaDB ? empresaFromDB(empresaDB) : null;
  }

  // Obtener empresa por nombre
  findByName(nombre: string): Empresa | null {
    const stmt = this.db.prepare('SELECT * FROM empresas WHERE nombre = ?');
    const empresaDB = stmt.get(nombre) as EmpresaDB | undefined;
    return empresaDB ? empresaFromDB(empresaDB) : null;
  }

  // Actualizar empresa
  update(id: string, updates: EmpresaUpdateInput): Empresa | null {
    const existingEmpresa = this.findById(id);
    if (!existingEmpresa) return null;

    const now = new Date().toISOString();
    const updatedEmpresa: EmpresaDB = {
      ...empresaToDB(existingEmpresa),
      ...updates,
      activa: updates.activa !== undefined ? (updates.activa ? 1 : 0) : (existingEmpresa.activa ? 1 : 0),
      ruc: updates.ruc !== undefined ? updates.ruc || null : (existingEmpresa.ruc || null),
      direccion: updates.direccion !== undefined ? updates.direccion || null : (existingEmpresa.direccion || null),
      telefono: updates.telefono !== undefined ? updates.telefono || null : (existingEmpresa.telefono || null),
      email: updates.email !== undefined ? updates.email || null : (existingEmpresa.email || null),
      contacto: updates.contacto !== undefined ? updates.contacto || null : (existingEmpresa.contacto || null),
      updated_at: now
    };

    const stmt = this.db.prepare(`
      UPDATE empresas SET 
        nombre = ?, ruc = ?, direccion = ?, telefono = ?, email = ?, contacto = ?, activa = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedEmpresa.nombre,
      updatedEmpresa.ruc,
      updatedEmpresa.direccion,
      updatedEmpresa.telefono,
      updatedEmpresa.email,
      updatedEmpresa.contacto,
      updatedEmpresa.activa,
      updatedEmpresa.updated_at,
      id
    );

    return empresaFromDB(updatedEmpresa);
  }

  // Eliminar empresa
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM empresas WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Verificar si una empresa tiene pedidos asociados
  hasRelatedRecords(id: string): boolean {
    const empresa = this.findById(id);
    if (!empresa) return false;

    // Verificar pedidos
    const pedidosStmt = this.db.prepare('SELECT COUNT(*) as count FROM pedidos WHERE empresa = ?');
    const pedidosResult = pedidosStmt.get(empresa.nombre) as { count: number };
    
    if (pedidosResult.count > 0) return true;

    // Verificar tipos de formato
    const tiposStmt = this.db.prepare('SELECT COUNT(*) as count FROM tipos_formato WHERE empresa_id = ?');
    const tiposResult = tiposStmt.get(id) as { count: number };
    
    return tiposResult.count > 0;
  }
}

export default new EmpresaRepository();