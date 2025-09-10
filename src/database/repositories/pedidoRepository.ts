import { DatabaseAdapter } from '../adapter';
import { 
  PedidoDB, 
  PedidoCreateInput, 
  PedidoUpdateInput,
  pedidoFromDB,
  pedidoToDB
} from '../models/pedido';
import { Pedido } from '../../types';

class PedidoRepository {
  private adapter: DatabaseAdapter;
  private initialized: boolean = false;

  constructor() {
    this.adapter = new DatabaseAdapter();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.adapter.initialize();
      this.initialized = true;
    }
  }

  // Crear un nuevo pedido
  async create(pedidoData: PedidoCreateInput): Promise<Pedido> {
    await this.ensureInitialized();
    
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

    await this.adapter.insert('pedidos', pedidoToInsert);
    return pedidoFromDB(pedidoToInsert);
  }

  // Obtener todos los pedidos
  async findAll(): Promise<Pedido[]> {
    await this.ensureInitialized();
    const pedidosDB = await this.adapter.findAll('pedidos', 'created_at DESC') as PedidoDB[];
    return pedidosDB.map(pedidoFromDB);
  }

  // Obtener pedido por ID
  async findById(id: string): Promise<Pedido | null> {
    await this.ensureInitialized();
    const pedidoDB = await this.adapter.findById('pedidos', id) as PedidoDB | null;
    return pedidoDB ? pedidoFromDB(pedidoDB) : null;
  }

  // Actualizar pedido
  async update(id: string, updates: PedidoUpdateInput): Promise<Pedido | null> {
    await this.ensureInitialized();
    const existingPedido = await this.findById(id);
    if (!existingPedido) return null;

    const now = new Date().toISOString();
    const updateData = {
      ...updates,
      pagado: updates.pagado !== undefined ? (updates.pagado ? 1 : 0) : (existingPedido.pagado ? 1 : 0),
      fecha_recojo: updates.fecha_recojo !== undefined ? updates.fecha_recojo || null : (existingPedido.fecha_recojo || null),
      fecha_pago: updates.fecha_pago !== undefined ? updates.fecha_pago || null : (existingPedido.fecha_pago || null),
      updated_at: now
    };

    await this.adapter.update('pedidos', id, updateData);
    
    const updatedPedido = await this.findById(id);
    return updatedPedido;
  }

  // Eliminar pedido
  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return await this.adapter.delete('pedidos', id);
  }

  // Buscar pedidos
  async search(query: string): Promise<Pedido[]> {
    await this.ensureInitialized();
    const searchFields = ['empresa', 'formato', 'estado'];
    const pedidosDB = await this.adapter.search('pedidos', searchFields, query, 'created_at DESC') as PedidoDB[];
    return pedidosDB.map(pedidoFromDB);
  }

  // Filtrar pedidos
  async filter(filters: {
    empresa?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Pedido[]> {
    await this.ensureInitialized();
    
    const filterParams: { [key: string]: any } = {};
    
    if (filters.empresa) {
      filterParams.empresa = `%${filters.empresa.toLowerCase()}%`;
    }
    
    if (filters.estado) {
      filterParams.estado = filters.estado;
    }
    
    if (filters.fecha_desde) {
      filterParams.fecha_desde = filters.fecha_desde;
    }
    
    if (filters.fecha_hasta) {
      filterParams.fecha_hasta = filters.fecha_hasta;
    }

    const pedidosDB = await this.adapter.filter('pedidos', filterParams, 'created_at DESC') as PedidoDB[];
    return pedidosDB.map(pedidoFromDB);
  }

  // Obtener siguiente numeración para un formato y empresa específicos
  async getNextNumeracion(formato: string, empresa: string): Promise<number> {
    await this.ensureInitialized();
    
    try {
      // Para SQLite, usar la consulta original
      const result = await this.adapter.customQuery(`
        SELECT MAX(numeracion) as max_numeracion 
        FROM formatos f
        JOIN pedidos p ON f.pedido_id = p.id
        WHERE p.formato = ? AND p.empresa = ?
      `, [formato, empresa]);
      
      return (result[0]?.max_numeracion || 0) + 1;
    } catch (error) {
      // Para navegador, implementar manualmente
      const pedidos = await this.filter({ empresa });
      let maxNumeracion = 0;
      
      // Necesitaríamos acceder a los formatos, por ahora devolver 1
      // TODO: Implementar correctamente cuando tengamos el FormatoRepository actualizado
      return maxNumeracion + 1;
    }
  }
}

export default new PedidoRepository();