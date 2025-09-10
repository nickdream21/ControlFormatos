import { Pedido, Formato, Empresa, TipoFormato } from '../types';
import pedidoRepository from '../database/repositories/pedidoRepository';

declare global {
  interface Window {
    electronAPI?: {
      readFile: (filename: string) => Promise<any[]>;
      writeFile: (filename: string, data: any[]) => Promise<boolean>;
      getNextNumber: (type: string, empresa: string, blockSize?: number) => Promise<number>;
    };
  }
}

class StorageService {
  private readonly PEDIDOS_FILE = 'pedidos.json';
  private readonly FORMATOS_FILE = 'formatos.json';
  private readonly EMPRESAS_FILE = 'empresas.json';
  private readonly TIPOS_FORMATO_FILE = 'tipos_formato.json';

  // Fallback functions for web mode (localStorage)
  private readFromLocalStorage(filename: string): any[] {
    try {
      const data = localStorage.getItem(filename);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage (${filename}):`, error);
      return [];
    }
  }

  private writeToLocalStorage(filename: string, data: any[]): boolean {
    try {
      localStorage.setItem(filename, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${filename}):`, error);
      return false;
    }
  }

  async getPedidos(): Promise<Pedido[]> {
    try {
      return await pedidoRepository.findAll();
    } catch (error) {
      console.error('Error reading pedidos:', error);
      // Fallback a localStorage para navegador
      return this.readFromLocalStorage(this.PEDIDOS_FILE);
    }
  }

  async savePedidos(pedidos: Pedido[]): Promise<boolean> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.writeFile(this.PEDIDOS_FILE, pedidos);
      } else {
        // Fallback to localStorage for web mode
        return this.writeToLocalStorage(this.PEDIDOS_FILE, pedidos);
      }
    } catch (error) {
      console.error('Error saving pedidos:', error);
      return false;
    }
  }

  async getFormatos(): Promise<Formato[]> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.readFile(this.FORMATOS_FILE);
      } else {
        // Fallback to localStorage for web mode
        return this.readFromLocalStorage(this.FORMATOS_FILE);
      }
    } catch (error) {
      console.error('Error reading formatos:', error);
      return [];
    }
  }

  async saveFormatos(formatos: Formato[]): Promise<boolean> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.writeFile(this.FORMATOS_FILE, formatos);
      } else {
        // Fallback to localStorage for web mode
        return this.writeToLocalStorage(this.FORMATOS_FILE, formatos);
      }
    } catch (error) {
      console.error('Error saving formatos:', error);
      return false;
    }
  }

  async createPedido(pedidoData: Omit<Pedido, 'id' | 'created_at' | 'updated_at'>): Promise<Pedido> {
    try {
      // Convertir el objeto para que coincida con el repositorio
      const createData = {
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
      };
      
      const newPedido = await pedidoRepository.create(createData);
      
      // Crear formatos para el pedido
      await this.createFormatosForPedido(newPedido);
      
      return newPedido;
    } catch (error) {
      console.error('Error creating pedido:', error);
      throw error;
    }
  }

  async updatePedido(id: string, updates: Partial<Pedido>): Promise<Pedido | null> {
    try {
      return await pedidoRepository.update(id, updates);
    } catch (error) {
      console.error('Error updating pedido:', error);
      return null;
    }
  }

  async deletePedido(id: string): Promise<boolean> {
    try {
      return await pedidoRepository.delete(id);
    } catch (error) {
      console.error('Error deleting pedido:', error);
      return false;
    }
  }

  private async createFormatosForPedido(pedido: Pedido): Promise<void> {
    const formatos = await this.getFormatos();
    const now = new Date().toISOString();
    
    const newFormatos: Formato[] = [];
    
    // Get the next number for this specific format type and empresa
    let nextNumeracion = pedido.numeracion_inicial;
    if (nextNumeracion === 0 || !nextNumeracion) {
      nextNumeracion = await this.getNextNumeracion(pedido.formato, pedido.empresa);
    }
    
    for (let i = 0; i < pedido.cantidad; i++) {
      const numeracion = nextNumeracion + i;
      
      const formato: Formato = {
        id: `formato_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        numeracion,
        fecha_ingreso: now,
        ubicacion_actual: 'Almacén',
        pedido_id: pedido.id,
        estado: 'disponible',
        created_at: now,
        updated_at: now,
      };
      
      newFormatos.push(formato);
    }
    
    formatos.push(...newFormatos);
    await this.saveFormatos(formatos);
  }

  async updateFormato(id: string, updates: Partial<Formato>): Promise<Formato | null> {
    const formatos = await this.getFormatos();
    const index = formatos.findIndex(f => f.id === id);
    
    if (index === -1) return null;
    
    formatos[index] = {
      ...formatos[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    await this.saveFormatos(formatos);
    return formatos[index];
  }

  async getNextNumeracion(tipoFormato: string, empresa: string, blockSize: number = 50): Promise<number> {
    try {
      return await pedidoRepository.getNextNumeracion(tipoFormato, empresa);
    } catch (error) {
      console.error('Error getting next numeracion:', error);
      return 1;
    }
  }

  async searchPedidos(query: string): Promise<Pedido[]> {
    try {
      return await pedidoRepository.search(query);
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
      return await pedidoRepository.filter(filters);
    } catch (error) {
      console.error('Error filtering pedidos:', error);
      return [];
    }
  }

  // Empresas methods
  async getEmpresas(): Promise<Empresa[]> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.readFile(this.EMPRESAS_FILE);
      } else {
        return this.readFromLocalStorage(this.EMPRESAS_FILE);
      }
    } catch (error) {
      console.error('Error reading empresas:', error);
      return [];
    }
  }

  async saveEmpresas(empresas: Empresa[]): Promise<boolean> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.writeFile(this.EMPRESAS_FILE, empresas);
      } else {
        return this.writeToLocalStorage(this.EMPRESAS_FILE, empresas);
      }
    } catch (error) {
      console.error('Error saving empresas:', error);
      return false;
    }
  }

  async createEmpresa(empresaData: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>): Promise<Empresa> {
    const empresas = await this.getEmpresas();
    const now = new Date().toISOString();
    
    const newEmpresa: Empresa = {
      ...empresaData,
      id: `empresa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: now,
      updated_at: now,
    };

    empresas.push(newEmpresa);
    await this.saveEmpresas(empresas);
    
    return newEmpresa;
  }

  async updateEmpresa(id: string, updates: Partial<Empresa>): Promise<Empresa | null> {
    const empresas = await this.getEmpresas();
    const index = empresas.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    empresas[index] = {
      ...empresas[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    await this.saveEmpresas(empresas);
    return empresas[index];
  }

  async deleteEmpresa(id: string): Promise<boolean> {
    const empresas = await this.getEmpresas();
    const filteredEmpresas = empresas.filter(e => e.id !== id);
    
    if (filteredEmpresas.length === empresas.length) return false;
    
    await this.saveEmpresas(filteredEmpresas);
    return true;
  }

  // Tipos de Formato methods
  async getTiposFormato(): Promise<TipoFormato[]> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.readFile(this.TIPOS_FORMATO_FILE);
      } else {
        return this.readFromLocalStorage(this.TIPOS_FORMATO_FILE);
      }
    } catch (error) {
      console.error('Error reading tipos formato:', error);
      return [];
    }
  }

  async saveTiposFormato(tiposFormato: TipoFormato[]): Promise<boolean> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.writeFile(this.TIPOS_FORMATO_FILE, tiposFormato);
      } else {
        return this.writeToLocalStorage(this.TIPOS_FORMATO_FILE, tiposFormato);
      }
    } catch (error) {
      console.error('Error saving tipos formato:', error);
      return false;
    }
  }

  async createTipoFormato(tipoFormatoData: Omit<TipoFormato, 'id' | 'created_at' | 'updated_at'>): Promise<TipoFormato> {
    const tiposFormato = await this.getTiposFormato();
    const now = new Date().toISOString();
    
    const newTipoFormato: TipoFormato = {
      ...tipoFormatoData,
      id: `tipo_formato_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: now,
      updated_at: now,
    };

    tiposFormato.push(newTipoFormato);
    await this.saveTiposFormato(tiposFormato);
    
    return newTipoFormato;
  }

  async updateTipoFormato(id: string, updates: Partial<TipoFormato>): Promise<TipoFormato | null> {
    const tiposFormato = await this.getTiposFormato();
    const index = tiposFormato.findIndex(tf => tf.id === id);
    
    if (index === -1) return null;
    
    tiposFormato[index] = {
      ...tiposFormato[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    await this.saveTiposFormato(tiposFormato);
    return tiposFormato[index];
  }

  async deleteTipoFormato(id: string): Promise<boolean> {
    const tiposFormato = await this.getTiposFormato();
    const filteredTiposFormato = tiposFormato.filter(tf => tf.id !== id);
    
    if (filteredTiposFormato.length === tiposFormato.length) return false;
    
    await this.saveTiposFormato(filteredTiposFormato);
    return true;
  }

  async getTiposFormatoPorEmpresa(empresaId: string): Promise<TipoFormato[]> {
    const tiposFormato = await this.getTiposFormato();
    return tiposFormato.filter(tf => tf.empresa_id === empresaId && tf.activo);
  }
}

export const storageService = new StorageService();