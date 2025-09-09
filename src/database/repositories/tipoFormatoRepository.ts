import DatabaseManager from '../db';
import { 
  TipoFormatoDB, 
  TipoFormatoCreateInput, 
  TipoFormatoUpdateInput,
  tipoFormatoFromDB,
  tipoFormatoToDB
} from '../models/tipoFormato';
import { TipoFormato } from '../../types';

class TipoFormatoRepository {
  private db: any;

  constructor() {
    this.db = DatabaseManager.getInstance().getDatabase();
  }

  // Crear un nuevo tipo de formato
  create(tipoFormatoData: TipoFormatoCreateInput): TipoFormato {
    const now = new Date().toISOString();
    const id = `tipo_formato_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const tipoFormatoToInsert: TipoFormatoDB = {
      id,
      nombre: tipoFormatoData.nombre,
      descripcion: tipoFormatoData.descripcion || null,
      empresa_id: tipoFormatoData.empresa_id,
      imagen: tipoFormatoData.imagen || null,
      activo: tipoFormatoData.activo !== false ? 1 : 0,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO tipos_formato (
        id, nombre, descripcion, empresa_id, imagen, activo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      tipoFormatoToInsert.id,
      tipoFormatoToInsert.nombre,
      tipoFormatoToInsert.descripcion,
      tipoFormatoToInsert.empresa_id,
      tipoFormatoToInsert.imagen,
      tipoFormatoToInsert.activo,
      tipoFormatoToInsert.created_at,
      tipoFormatoToInsert.updated_at
    );

    return tipoFormatoFromDB(tipoFormatoToInsert);
  }

  // Obtener todos los tipos de formato
  findAll(): TipoFormato[] {
    const stmt = this.db.prepare('SELECT * FROM tipos_formato ORDER BY nombre ASC');
    const tiposFormatoDB = stmt.all() as TipoFormatoDB[];
    return tiposFormatoDB.map(tipoFormatoFromDB);
  }

  // Obtener tipos de formato activos
  findActive(): TipoFormato[] {
    const stmt = this.db.prepare('SELECT * FROM tipos_formato WHERE activo = 1 ORDER BY nombre ASC');
    const tiposFormatoDB = stmt.all() as TipoFormatoDB[];
    return tiposFormatoDB.map(tipoFormatoFromDB);
  }

  // Obtener tipo de formato por ID
  findById(id: string): TipoFormato | null {
    const stmt = this.db.prepare('SELECT * FROM tipos_formato WHERE id = ?');
    const tipoFormatoDB = stmt.get(id) as TipoFormatoDB | undefined;
    return tipoFormatoDB ? tipoFormatoFromDB(tipoFormatoDB) : null;
  }

  // Obtener tipos de formato por empresa
  findByEmpresaId(empresaId: string): TipoFormato[] {
    const stmt = this.db.prepare('SELECT * FROM tipos_formato WHERE empresa_id = ? ORDER BY nombre ASC');
    const tiposFormatoDB = stmt.all(empresaId) as TipoFormatoDB[];
    return tiposFormatoDB.map(tipoFormatoFromDB);
  }

  // Obtener tipos de formato activos por empresa
  findActiveByEmpresaId(empresaId: string): TipoFormato[] {
    const stmt = this.db.prepare('SELECT * FROM tipos_formato WHERE empresa_id = ? AND activo = 1 ORDER BY nombre ASC');
    const tiposFormatoDB = stmt.all(empresaId) as TipoFormatoDB[];
    return tiposFormatoDB.map(tipoFormatoFromDB);
  }

  // Actualizar tipo de formato
  update(id: string, updates: TipoFormatoUpdateInput): TipoFormato | null {
    const existingTipoFormato = this.findById(id);
    if (!existingTipoFormato) return null;

    const now = new Date().toISOString();
    const updatedTipoFormato: TipoFormatoDB = {
      ...tipoFormatoToDB(existingTipoFormato),
      ...updates,
      activo: updates.activo !== undefined ? (updates.activo ? 1 : 0) : (existingTipoFormato.activo ? 1 : 0),
      descripcion: updates.descripcion !== undefined ? updates.descripcion || null : (existingTipoFormato.descripcion || null),
      imagen: updates.imagen !== undefined ? updates.imagen || null : (existingTipoFormato.imagen || null),
      updated_at: now
    };

    const stmt = this.db.prepare(`
      UPDATE tipos_formato SET 
        nombre = ?, descripcion = ?, empresa_id = ?, imagen = ?, activo = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedTipoFormato.nombre,
      updatedTipoFormato.descripcion,
      updatedTipoFormato.empresa_id,
      updatedTipoFormato.imagen,
      updatedTipoFormato.activo,
      updatedTipoFormato.updated_at,
      id
    );

    return tipoFormatoFromDB(updatedTipoFormato);
  }

  // Eliminar tipo de formato
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM tipos_formato WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Verificar si un tipo de formato tiene pedidos asociados
  hasRelatedRecords(id: string): boolean {
    const tipoFormato = this.findById(id);
    if (!tipoFormato) return false;

    // Verificar pedidos que usan este tipo de formato
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM pedidos WHERE formato = ?');
    const result = stmt.get(tipoFormato.nombre) as { count: number };
    
    return result.count > 0;
  }
}

export default new TipoFormatoRepository();