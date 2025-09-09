import { Pedido, Formato, Empresa, TipoFormato } from '../types';
import pedidoRepository from '../database/repositories/pedidoRepository';
import formatoRepository from '../database/repositories/formatoRepository';
import empresaRepository from '../database/repositories/empresaRepository';
import tipoFormatoRepository from '../database/repositories/tipoFormatoRepository';

class SQLiteStorageService {
  // ========== PEDIDOS ==========
  async getPedidos(): Promise<Pedido[]> {
    try {
      return pedidoRepository.findAll();
    } catch (error) {
      console.error('Error getting pedidos:', error);
      return [];
    }
  }

  async savePedidos(pedidos: Pedido[]): Promise<boolean> {
    // Este método no se usa en SQLite ya que guardamos individualmente
    console.warn('savePedidos is deprecated in SQLite storage');
    return true;
  }

  async createPedido(pedidoData: Omit<Pedido, 'id' | 'created_at' | 'updated_at'>): Promise<Pedido> {
    try {
      // Crear el pedido
      const nuevoPedido = pedidoRepository.create({
        fecha: pedidoData.fecha,
        formato: pedidoData.formato,
        empresa: pedidoData.empresa,
        cantidad: pedidoData.cantidad,
        numeracion_inicial: pedidoData.numeracion_inicial,
        estado: pedidoData.estado,
        fecha_recojo: pedidoData.fecha_recojo,
        fecha_pago: pedidoData.fecha_pago,
        monto: pedidoData.monto,
        pagado: pedidoData.pagado
      });

      // Crear los formatos individuales para este pedido
      await this.createFormatosForPedido(nuevoPedido);

      return nuevoPedido;
    } catch (error) {
      console.error('Error creating pedido:', error);
      throw error;
    }
  }

  async updatePedido(id: string, updates: Partial<Pedido>): Promise<Pedido | null> {
    try {
      return pedidoRepository.update(id, updates);
    } catch (error) {
      console.error('Error updating pedido:', error);
      return null;
    }
  }

  async deletePedido(id: string): Promise<boolean> {
    try {
      // Primero eliminar los formatos asociados
      formatoRepository.deleteByPedidoId(id);
      // Luego eliminar el pedido
      return pedidoRepository.delete(id);
    } catch (error) {
      console.error('Error deleting pedido:', error);
      return false;
    }
  }

  private async createFormatosForPedido(pedido: Pedido): Promise<void> {
    try {
      let nextNumeracion = pedido.numeracion_inicial;
      
      if (nextNumeracion === 0 || !nextNumeracion) {
        nextNumeracion = await this.getNextNumeracion(pedido.formato, pedido.empresa);
      }

      formatoRepository.createMultiple(pedido.id, pedido.cantidad, nextNumeracion);
    } catch (error) {
      console.error('Error creating formatos for pedido:', error);
      throw error;
    }
  }

  async searchPedidos(query: string): Promise<Pedido[]> {
    try {
      return pedidoRepository.search(query);
    } catch (error) {
      console.error('Error searching pedidos:', error);
      return [];
    }
  }

  async filterPedidos(filters: {
    empresa?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Pedido[]> {
    try {
      return pedidoRepository.filter(filters);
    } catch (error) {
      console.error('Error filtering pedidos:', error);
      return [];
    }
  }

  // ========== FORMATOS ==========
  async getFormatos(): Promise<Formato[]> {
    try {
      return formatoRepository.findAll();
    } catch (error) {
      console.error('Error getting formatos:', error);
      return [];
    }
  }

  async saveFormatos(formatos: Formato[]): Promise<boolean> {
    // Este método no se usa en SQLite ya que guardamos individualmente
    console.warn('saveFormatos is deprecated in SQLite storage');
    return true;
  }

  async updateFormato(id: string, updates: Partial<Formato>): Promise<Formato | null> {
    try {
      return formatoRepository.update(id, updates);
    } catch (error) {
      console.error('Error updating formato:', error);
      return null;
    }
  }

  async getNextNumeracion(tipoFormato: string, empresa: string, blockSize: number = 50): Promise<number> {
    try {
      return pedidoRepository.getNextNumeracion(tipoFormato, empresa);
    } catch (error) {
      console.error('Error getting next numeracion:', error);
      return 1;
    }
  }

  // ========== EMPRESAS ==========
  async getEmpresas(): Promise<Empresa[]> {
    try {
      return empresaRepository.findAll();
    } catch (error) {
      console.error('Error getting empresas:', error);
      return [];
    }
  }

  async saveEmpresas(empresas: Empresa[]): Promise<boolean> {
    // Este método no se usa en SQLite ya que guardamos individualmente
    console.warn('saveEmpresas is deprecated in SQLite storage');
    return true;
  }

  async createEmpresa(empresaData: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>): Promise<Empresa> {
    try {
      return empresaRepository.create({
        nombre: empresaData.nombre,
        ruc: empresaData.ruc,
        direccion: empresaData.direccion,
        telefono: empresaData.telefono,
        email: empresaData.email,
        contacto: empresaData.contacto,
        activa: empresaData.activa
      });
    } catch (error) {
      console.error('Error creating empresa:', error);
      throw error;
    }
  }

  async updateEmpresa(id: string, updates: Partial<Empresa>): Promise<Empresa | null> {
    try {
      return empresaRepository.update(id, updates);
    } catch (error) {
      console.error('Error updating empresa:', error);
      return null;
    }
  }

  async deleteEmpresa(id: string): Promise<boolean> {
    try {
      // Verificar si tiene registros relacionados
      if (empresaRepository.hasRelatedRecords(id)) {
        console.warn('Cannot delete empresa with related records');
        return false;
      }
      return empresaRepository.delete(id);
    } catch (error) {
      console.error('Error deleting empresa:', error);
      return false;
    }
  }

  // ========== TIPOS DE FORMATO ==========
  async getTiposFormato(): Promise<TipoFormato[]> {
    try {
      return tipoFormatoRepository.findAll();
    } catch (error) {
      console.error('Error getting tipos formato:', error);
      return [];
    }
  }

  async saveTiposFormato(tiposFormato: TipoFormato[]): Promise<boolean> {
    // Este método no se usa en SQLite ya que guardamos individualmente
    console.warn('saveTiposFormato is deprecated in SQLite storage');
    return true;
  }

  async createTipoFormato(tipoFormatoData: Omit<TipoFormato, 'id' | 'created_at' | 'updated_at'>): Promise<TipoFormato> {
    try {
      return tipoFormatoRepository.create({
        nombre: tipoFormatoData.nombre,
        descripcion: tipoFormatoData.descripcion,
        empresa_id: tipoFormatoData.empresa_id,
        imagen: tipoFormatoData.imagen,
        activo: tipoFormatoData.activo
      });
    } catch (error) {
      console.error('Error creating tipo formato:', error);
      throw error;
    }
  }

  async updateTipoFormato(id: string, updates: Partial<TipoFormato>): Promise<TipoFormato | null> {
    try {
      return tipoFormatoRepository.update(id, updates);
    } catch (error) {
      console.error('Error updating tipo formato:', error);
      return null;
    }
  }

  async deleteTipoFormato(id: string): Promise<boolean> {
    try {
      // Verificar si tiene registros relacionados
      if (tipoFormatoRepository.hasRelatedRecords(id)) {
        console.warn('Cannot delete tipo formato with related records');
        return false;
      }
      return tipoFormatoRepository.delete(id);
    } catch (error) {
      console.error('Error deleting tipo formato:', error);
      return false;
    }
  }

  async getTiposFormatoPorEmpresa(empresaId: string): Promise<TipoFormato[]> {
    try {
      return tipoFormatoRepository.findActiveByEmpresaId(empresaId);
    } catch (error) {
      console.error('Error getting tipos formato por empresa:', error);
      return [];
    }
  }
}

export const sqliteStorageService = new SQLiteStorageService();