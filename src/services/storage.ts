import { Pedido, Formato, Empresa, TipoFormato } from '../types';
import { sqliteStorageService } from './sqliteStorage';
import { migrationService } from './migrationService';

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
  private useSQLite = true; // Flag para controlar si usar SQLite o JSON
  private migrationCompleted = false;

  // Inicializar el servicio y realizar migración si es necesario
  private async initialize(): Promise<void> {
    if (this.migrationCompleted) return;

    try {
      // Verificar si SQLite está disponible
      const DatabaseManager = await import('../database/db');
      if (!DatabaseManager.default.isAvailable()) {
        console.log('SQLite not available, using JSON storage');
        this.useSQLite = false;
        this.migrationCompleted = true;
        return;
      }

      if (this.useSQLite) {
        console.log('Initializing SQLite storage...');
        
        // Intentar migrar datos existentes
        const migrationSuccess = await migrationService.migrateFromJSONToSQLite();
        
        if (!migrationSuccess) {
          console.warn('Migration failed, falling back to JSON storage');
          this.useSQLite = false;
        } else {
          console.log('SQLite storage initialized successfully');
        }
      }
      
      this.migrationCompleted = true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      console.warn('Falling back to JSON storage');
      this.useSQLite = false;
      this.migrationCompleted = true;
    }
  }

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
    await this.initialize();
    
    try {
      if (this.useSQLite) {
        return await sqliteStorageService.getPedidos();
      }
      
      // Fallback a JSON/localStorage
      if (window.electronAPI) {
        return await window.electronAPI.readFile(this.PEDIDOS_FILE);
      } else {
        return this.readFromLocalStorage(this.PEDIDOS_FILE);
      }
    } catch (error) {
      console.error('Error reading pedidos:', error);
      return [];
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
    await this.initialize();
    
    try {
      if (this.useSQLite) {
        return await sqliteStorageService.createPedido(pedidoData);
      }
      
      // Fallback a JSON/localStorage
      const pedidos = await this.getPedidos();
      const now = new Date().toISOString();
      
      const newPedido: Pedido = {
        ...pedidoData,
        id: `pedido_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: now,
        updated_at: now,
      };

      pedidos.push(newPedido);
      await this.savePedidos(pedidos);

      await this.createFormatosForPedido(newPedido);
      
      return newPedido;
    } catch (error) {
      console.error('Error creating pedido:', error);
      throw error;
    }
  }

  async updatePedido(id: string, updates: Partial<Pedido>): Promise<Pedido | null> {
    const pedidos = await this.getPedidos();
    const index = pedidos.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    pedidos[index] = {
      ...pedidos[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    await this.savePedidos(pedidos);
    return pedidos[index];
  }

  async deletePedido(id: string): Promise<boolean> {
    const pedidos = await this.getPedidos();
    const filteredPedidos = pedidos.filter(p => p.id !== id);
    
    if (filteredPedidos.length === pedidos.length) return false;
    
    const formatos = await this.getFormatos();
    const filteredFormatos = formatos.filter(f => f.pedido_id !== id);
    
    await this.savePedidos(filteredPedidos);
    await this.saveFormatos(filteredFormatos);
    
    return true;
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
      if (window.electronAPI) {
        return await window.electronAPI.getNextNumber(tipoFormato, empresa, blockSize);
      } else {
        // Fallback to calculating next number from existing formatos of the same type and empresa
        const formatos = await this.getFormatos();
        const pedidos = await this.getPedidos();
        
        // Filter formatos by the same formato type AND empresa
        const formatosDelMismoTipoYEmpresa = formatos.filter(formato => {
          const pedido = pedidos.find(p => p.id === formato.pedido_id);
          return pedido && pedido.formato === tipoFormato && pedido.empresa === empresa;
        });
        
        if (formatosDelMismoTipoYEmpresa.length === 0) {
          return 1; // First formato of this type for this empresa
        }
        
        const maxNumeracion = formatosDelMismoTipoYEmpresa.reduce((max, f) => Math.max(max, f.numeracion), 0);
        return maxNumeracion + 1;
      }
    } catch (error) {
      console.error('Error getting next numeracion:', error);
      // Fallback calculation
      const formatos = await this.getFormatos();
      const pedidos = await this.getPedidos();
      
      const formatosDelMismoTipoYEmpresa = formatos.filter(formato => {
        const pedido = pedidos.find(p => p.id === formato.pedido_id);
        return pedido && pedido.formato === tipoFormato && pedido.empresa === empresa;
      });
      
      if (formatosDelMismoTipoYEmpresa.length === 0) {
        return 1;
      }
      
      const maxNumeracion = formatosDelMismoTipoYEmpresa.reduce((max, f) => Math.max(max, f.numeracion), 0);
      return maxNumeracion + 1;
    }
  }

  async searchPedidos(query: string): Promise<Pedido[]> {
    const pedidos = await this.getPedidos();
    const lowercaseQuery = query.toLowerCase();
    
    return pedidos.filter(pedido => 
      pedido.empresa.toLowerCase().includes(lowercaseQuery) ||
      pedido.formato.toLowerCase().includes(lowercaseQuery) ||
      pedido.estado.toLowerCase().includes(lowercaseQuery)
    );
  }

  async filterPedidos(filters: {
    empresa?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Pedido[]> {
    const pedidos = await this.getPedidos();
    
    return pedidos.filter(pedido => {
      if (filters.empresa && !pedido.empresa.toLowerCase().includes(filters.empresa.toLowerCase())) {
        return false;
      }
      
      if (filters.estado && pedido.estado !== filters.estado) {
        return false;
      }
      
      if (filters.fecha_desde && pedido.fecha < filters.fecha_desde) {
        return false;
      }
      
      if (filters.fecha_hasta && pedido.fecha > filters.fecha_hasta) {
        return false;
      }
      
      return true;
    });
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