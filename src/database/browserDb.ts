// Base de datos compatible con navegador usando IndexedDB
interface DBSchema {
  empresas: {
    key: string;
    value: {
      id: string;
      nombre: string;
      ruc?: string;
      direccion?: string;
      telefono?: string;
      email?: string;
      contacto?: string;
      activa: number;
      created_at: string;
      updated_at: string;
    };
  };
  tipos_formato: {
    key: string;
    value: {
      id: string;
      nombre: string;
      descripcion?: string;
      empresa_id: string;
      imagen?: string;
      activo: number;
      created_at: string;
      updated_at: string;
    };
  };
  pedidos: {
    key: string;
    value: {
      id: string;
      fecha: string;
      formato: string;
      empresa: string;
      cantidad: number;
      numeracion_inicial: number;
      estado: 'por recoger' | 'recogido' | 'pagado' | 'sin pagar';
      fecha_recojo?: string;
      fecha_pago?: string;
      monto: number;
      pagado: number;
      created_at: string;
      updated_at: string;
    };
  };
  formatos: {
    key: string;
    value: {
      id: string;
      numeracion: number;
      fecha_ingreso: string;
      ubicacion_actual: string;
      fecha_salida?: string;
      ubicacion_destino?: string;
      destinatario?: string;
      observaciones?: string;
      pedido_id: string;
      estado: 'disponible' | 'asignado' | 'entregado';
      created_at: string;
      updated_at: string;
    };
  };
}

class BrowserDatabaseManager {
  private static instance: BrowserDatabaseManager;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'control_formatos_sgv';
  private readonly DB_VERSION = 1;

  private constructor() {}

  public static getInstance(): BrowserDatabaseManager {
    if (!BrowserDatabaseManager.instance) {
      BrowserDatabaseManager.instance = new BrowserDatabaseManager();
    }
    return BrowserDatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Error al abrir la base de datos IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear tabla empresas
        if (!db.objectStoreNames.contains('empresas')) {
          const empresasStore = db.createObjectStore('empresas', { keyPath: 'id' });
          empresasStore.createIndex('nombre', 'nombre', { unique: false });
          empresasStore.createIndex('activa', 'activa', { unique: false });
        }

        // Crear tabla tipos_formato
        if (!db.objectStoreNames.contains('tipos_formato')) {
          const tiposFormatoStore = db.createObjectStore('tipos_formato', { keyPath: 'id' });
          tiposFormatoStore.createIndex('empresa_id', 'empresa_id', { unique: false });
          tiposFormatoStore.createIndex('activo', 'activo', { unique: false });
        }

        // Crear tabla pedidos
        if (!db.objectStoreNames.contains('pedidos')) {
          const pedidosStore = db.createObjectStore('pedidos', { keyPath: 'id' });
          pedidosStore.createIndex('fecha', 'fecha', { unique: false });
          pedidosStore.createIndex('empresa', 'empresa', { unique: false });
          pedidosStore.createIndex('estado', 'estado', { unique: false });
          pedidosStore.createIndex('pagado', 'pagado', { unique: false });
        }

        // Crear tabla formatos
        if (!db.objectStoreNames.contains('formatos')) {
          const formatosStore = db.createObjectStore('formatos', { keyPath: 'id' });
          formatosStore.createIndex('pedido_id', 'pedido_id', { unique: false });
          formatosStore.createIndex('estado', 'estado', { unique: false });
          formatosStore.createIndex('numeracion', 'numeracion', { unique: false });
        }
      };
    });
  }

  public getDatabase(): IDBDatabase {
    if (!this.db) {
      throw new Error('Base de datos no inicializada. Llama a initialize() primero.');
    }
    return this.db;
  }

  // Métodos de utilidad para operaciones comunes
  public async add<T extends keyof DBSchema>(storeName: T, data: DBSchema[T]['value']): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.getDatabase().transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async get<T extends keyof DBSchema>(storeName: T, key: string): Promise<DBSchema[T]['value'] | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.getDatabase().transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getAll<T extends keyof DBSchema>(storeName: T): Promise<DBSchema[T]['value'][]> {
    return new Promise((resolve, reject) => {
      const transaction = this.getDatabase().transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async update<T extends keyof DBSchema>(storeName: T, data: DBSchema[T]['value']): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.getDatabase().transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async delete<T extends keyof DBSchema>(storeName: T, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.getDatabase().transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getAllByIndex<T extends keyof DBSchema>(
    storeName: T, 
    indexName: string, 
    value: any
  ): Promise<DBSchema[T]['value'][]> {
    return new Promise((resolve, reject) => {
      const transaction = this.getDatabase().transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default BrowserDatabaseManager;