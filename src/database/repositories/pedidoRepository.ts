import DatabaseManager from '../db';
import { 
  PedidoDB, 
  PedidoCreateInput, 
  PedidoUpdateInput,
  pedidoFromDB,
  pedidoToDB
} from '../models/pedido';
import { Pedido } from '../../types';

class PedidoRepository {
  private db: any;

  constructor() {
    this.db = DatabaseManager.getInstance().getDatabase();
  }

  // Crear un nuevo pedido
  create(pedidoData: PedidoCreateInput): Pedido {
    const now = new Date().toISOString();
    const id = `pedido_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pedidoToInsert: PedidoDB = {
      id,
      fecha: pedidoData.fecha,
      formato: pedidoData.formato,
      empresa: pedidoData.empresa,
      cantidad: pedidoData.cantidad,
      numeracion_inicial: pedidoData.numeracion_inicial,
      estado: pedidoData.estado,
      fecha_recojo: pedidoData.fecha_recojo || null,
      fecha_pago: pedidoData.fecha_pago || null,
      monto: pedidoData.monto,
      pagado: pedidoData.pagado ? 1 : 0,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO pedidos (
        id, fecha, formato, empresa, cantidad, numeracion_inicial, 
        estado, fecha_recojo, fecha_pago, monto, pagado, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      pedidoToInsert.id,
      pedidoToInsert.fecha,
      pedidoToInsert.formato,
      pedidoToInsert.empresa,
      pedidoToInsert.cantidad,
      pedidoToInsert.numeracion_inicial,
      pedidoToInsert.estado,
      pedidoToInsert.fecha_recojo,
      pedidoToInsert.fecha_pago,
      pedidoToInsert.monto,
      pedidoToInsert.pagado,
      pedidoToInsert.created_at,
      pedidoToInsert.updated_at
    );

    return pedidoFromDB(pedidoToInsert);
  }

  // Obtener todos los pedidos
  findAll(): Pedido[] {
    const stmt = this.db.prepare('SELECT * FROM pedidos ORDER BY created_at DESC');
    const pedidosDB = stmt.all() as PedidoDB[];
    return pedidosDB.map(pedidoFromDB);
  }

  // Obtener pedido por ID
  findById(id: string): Pedido | null {
    const stmt = this.db.prepare('SELECT * FROM pedidos WHERE id = ?');
    const pedidoDB = stmt.get(id) as PedidoDB | undefined;
    return pedidoDB ? pedidoFromDB(pedidoDB) : null;
  }

  // Actualizar pedido
  update(id: string, updates: PedidoUpdateInput): Pedido | null {
    const existingPedido = this.findById(id);
    if (!existingPedido) return null;

    const now = new Date().toISOString();
    const updatedPedido: PedidoDB = {
      ...pedidoToDB(existingPedido),
      ...updates,
      pagado: updates.pagado !== undefined ? (updates.pagado ? 1 : 0) : (existingPedido.pagado ? 1 : 0),
      fecha_recojo: updates.fecha_recojo !== undefined ? updates.fecha_recojo || null : (existingPedido.fecha_recojo || null),
      fecha_pago: updates.fecha_pago !== undefined ? updates.fecha_pago || null : (existingPedido.fecha_pago || null),
      updated_at: now
    };

    const stmt = this.db.prepare(`
      UPDATE pedidos SET 
        fecha = ?, formato = ?, empresa = ?, cantidad = ?, numeracion_inicial = ?,
        estado = ?, fecha_recojo = ?, fecha_pago = ?, monto = ?, pagado = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedPedido.fecha,
      updatedPedido.formato,
      updatedPedido.empresa,
      updatedPedido.cantidad,
      updatedPedido.numeracion_inicial,
      updatedPedido.estado,
      updatedPedido.fecha_recojo,
      updatedPedido.fecha_pago,
      updatedPedido.monto,
      updatedPedido.pagado,
      updatedPedido.updated_at,
      id
    );

    return pedidoFromDB(updatedPedido);
  }

  // Eliminar pedido
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM pedidos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Buscar pedidos
  search(query: string): Pedido[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pedidos 
      WHERE empresa LIKE ? OR formato LIKE ? OR estado LIKE ?
      ORDER BY created_at DESC
    `);
    const searchTerm = `%${query.toLowerCase()}%`;
    const pedidosDB = stmt.all(searchTerm, searchTerm, searchTerm) as PedidoDB[];
    return pedidosDB.map(pedidoFromDB);
  }

  // Filtrar pedidos
  filter(filters: {
    empresa?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Pedido[] {
    let sql = 'SELECT * FROM pedidos WHERE 1=1';
    const params: any[] = [];

    if (filters.empresa) {
      sql += ' AND empresa LIKE ?';
      params.push(`%${filters.empresa.toLowerCase()}%`);
    }

    if (filters.estado) {
      sql += ' AND estado = ?';
      params.push(filters.estado);
    }

    if (filters.fecha_desde) {
      sql += ' AND fecha >= ?';
      params.push(filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      sql += ' AND fecha <= ?';
      params.push(filters.fecha_hasta);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    const pedidosDB = stmt.all(...params) as PedidoDB[];
    return pedidosDB.map(pedidoFromDB);
  }

  // Obtener siguiente numeración para un formato y empresa específicos
  getNextNumeracion(formato: string, empresa: string): number {
    const stmt = this.db.prepare(`
      SELECT MAX(numeracion) as max_numeracion 
      FROM formatos f
      JOIN pedidos p ON f.pedido_id = p.id
      WHERE p.formato = ? AND p.empresa = ?
    `);
    
    const result = stmt.get(formato, empresa) as { max_numeracion: number | null };
    return (result.max_numeracion || 0) + 1;
  }
}

export default new PedidoRepository();