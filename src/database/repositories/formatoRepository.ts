import DatabaseManager from '../db';
import { 
  FormatoDB, 
  FormatoCreateInput, 
  FormatoUpdateInput,
  formatoFromDB,
  formatoToDB
} from '../models/formato';
import { Formato } from '../../types';

class FormatoRepository {
  private db: any;

  constructor() {
    this.db = DatabaseManager.getInstance().getDatabase();
  }

  // Crear un nuevo formato
  create(formatoData: FormatoCreateInput): Formato {
    const now = new Date().toISOString();
    const id = `formato_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const formatoToInsert: FormatoDB = {
      id,
      numeracion: formatoData.numeracion,
      fecha_ingreso: formatoData.fecha_ingreso,
      ubicacion_actual: formatoData.ubicacion_actual,
      fecha_salida: formatoData.fecha_salida || null,
      ubicacion_destino: formatoData.ubicacion_destino || null,
      destinatario: formatoData.destinatario || null,
      observaciones: formatoData.observaciones || null,
      pedido_id: formatoData.pedido_id,
      estado: formatoData.estado,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO formatos (
        id, numeracion, fecha_ingreso, ubicacion_actual, fecha_salida,
        ubicacion_destino, destinatario, observaciones, pedido_id, estado,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      formatoToInsert.id,
      formatoToInsert.numeracion,
      formatoToInsert.fecha_ingreso,
      formatoToInsert.ubicacion_actual,
      formatoToInsert.fecha_salida,
      formatoToInsert.ubicacion_destino,
      formatoToInsert.destinatario,
      formatoToInsert.observaciones,
      formatoToInsert.pedido_id,
      formatoToInsert.estado,
      formatoToInsert.created_at,
      formatoToInsert.updated_at
    );

    return formatoFromDB(formatoToInsert);
  }

  // Crear múltiples formatos para un pedido
  createMultiple(pedidoId: string, cantidad: number, numeracionInicial: number): Formato[] {
    const now = new Date().toISOString();
    const formatos: Formato[] = [];

    const stmt = this.db.prepare(`
      INSERT INTO formatos (
        id, numeracion, fecha_ingreso, ubicacion_actual, fecha_salida,
        ubicacion_destino, destinatario, observaciones, pedido_id, estado,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Usar una transacción para insertar múltiples formatos
    const transaction = this.db.transaction((pedidoId: string, cantidad: number, numeracionInicial: number) => {
      for (let i = 0; i < cantidad; i++) {
        const id = `formato_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        const numeracion = numeracionInicial + i;
        
        const formatoToInsert: FormatoDB = {
          id,
          numeracion,
          fecha_ingreso: now,
          ubicacion_actual: 'Almacén',
          fecha_salida: null,
          ubicacion_destino: null,
          destinatario: null,
          observaciones: null,
          pedido_id: pedidoId,
          estado: 'disponible',
          created_at: now,
          updated_at: now
        };

        stmt.run(
          formatoToInsert.id,
          formatoToInsert.numeracion,
          formatoToInsert.fecha_ingreso,
          formatoToInsert.ubicacion_actual,
          formatoToInsert.fecha_salida,
          formatoToInsert.ubicacion_destino,
          formatoToInsert.destinatario,
          formatoToInsert.observaciones,
          formatoToInsert.pedido_id,
          formatoToInsert.estado,
          formatoToInsert.created_at,
          formatoToInsert.updated_at
        );

        formatos.push(formatoFromDB(formatoToInsert));
      }
    });

    transaction(pedidoId, cantidad, numeracionInicial);
    return formatos;
  }

  // Obtener todos los formatos
  findAll(): Formato[] {
    const stmt = this.db.prepare('SELECT * FROM formatos ORDER BY numeracion ASC');
    const formatosDB = stmt.all() as FormatoDB[];
    return formatosDB.map(formatoFromDB);
  }

  // Obtener formato por ID
  findById(id: string): Formato | null {
    const stmt = this.db.prepare('SELECT * FROM formatos WHERE id = ?');
    const formatoDB = stmt.get(id) as FormatoDB | undefined;
    return formatoDB ? formatoFromDB(formatoDB) : null;
  }

  // Obtener formatos por pedido ID
  findByPedidoId(pedidoId: string): Formato[] {
    const stmt = this.db.prepare('SELECT * FROM formatos WHERE pedido_id = ? ORDER BY numeracion ASC');
    const formatosDB = stmt.all(pedidoId) as FormatoDB[];
    return formatosDB.map(formatoFromDB);
  }

  // Actualizar formato
  update(id: string, updates: FormatoUpdateInput): Formato | null {
    const existingFormato = this.findById(id);
    if (!existingFormato) return null;

    const now = new Date().toISOString();
    const updatedFormato: FormatoDB = {
      ...formatoToDB(existingFormato),
      ...updates,
      fecha_salida: updates.fecha_salida !== undefined ? updates.fecha_salida || null : (existingFormato.fecha_salida || null),
      ubicacion_destino: updates.ubicacion_destino !== undefined ? updates.ubicacion_destino || null : (existingFormato.ubicacion_destino || null),
      destinatario: updates.destinatario !== undefined ? updates.destinatario || null : (existingFormato.destinatario || null),
      observaciones: updates.observaciones !== undefined ? updates.observaciones || null : (existingFormato.observaciones || null),
      updated_at: now
    };

    const stmt = this.db.prepare(`
      UPDATE formatos SET 
        numeracion = ?, fecha_ingreso = ?, ubicacion_actual = ?, fecha_salida = ?,
        ubicacion_destino = ?, destinatario = ?, observaciones = ?, pedido_id = ?,
        estado = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedFormato.numeracion,
      updatedFormato.fecha_ingreso,
      updatedFormato.ubicacion_actual,
      updatedFormato.fecha_salida,
      updatedFormato.ubicacion_destino,
      updatedFormato.destinatario,
      updatedFormato.observaciones,
      updatedFormato.pedido_id,
      updatedFormato.estado,
      updatedFormato.updated_at,
      id
    );

    return formatoFromDB(updatedFormato);
  }

  // Eliminar formato
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM formatos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Eliminar formatos por pedido ID
  deleteByPedidoId(pedidoId: string): number {
    const stmt = this.db.prepare('DELETE FROM formatos WHERE pedido_id = ?');
    const result = stmt.run(pedidoId);
    return result.changes;
  }

  // Obtener conteos por estado
  getCountsByEstado(): { [estado: string]: number } {
    const stmt = this.db.prepare('SELECT estado, COUNT(*) as count FROM formatos GROUP BY estado');
    const results = stmt.all() as { estado: string; count: number }[];
    
    const counts = {
      disponible: 0,
      asignado: 0,
      entregado: 0
    };

    results.forEach(result => {
      counts[result.estado as keyof typeof counts] = result.count;
    });

    return counts;
  }
}

export default new FormatoRepository();