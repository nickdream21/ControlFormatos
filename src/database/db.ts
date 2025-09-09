import { getNodeModules, isNodeModulesAvailable } from './nodeModules';

// Determinar la ruta de la base de datos
const getDbPath = (): string => {
  const modules = getNodeModules();
  if (modules && modules.path) {
    // En modo Electron, usar la carpeta de la aplicación
    return modules.path.join(process.cwd(), 'data', 'control_formatos.db');
  } else {
    // En modo web, no se puede usar SQLite
    throw new Error('SQLite not available in browser environment');
  }
};

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: any = null;

  private constructor() {
    const modules = getNodeModules();
    
    if (!modules) {
      throw new Error('SQLite not available in browser environment');
    }

    const { Database, path, fs } = modules;
    const dbPath = getDbPath();
    
    // Crear directorio si no existe
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Conectar a la base de datos
    this.db = new Database(dbPath);
    
    // Configurar la base de datos
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    // Ejecutar migraciones
    this.runMigrations();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      try {
        DatabaseManager.instance = new DatabaseManager();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
      }
    }
    return DatabaseManager.instance;
  }

  public getDatabase(): any {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  public static isAvailable(): boolean {
    return isNodeModulesAvailable();
  }

  private runMigrations(): void {
    // Crear tabla de migraciones si no existe
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        executed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrations = [
      {
        version: '001_initial',
        sql: this.getInitialMigrationSQL()
      },
      {
        version: '002_add_indexes',
        sql: this.getIndexesMigrationSQL()
      }
    ];

    // Ejecutar migraciones pendientes
    for (const migration of migrations) {
      const exists = this.db.prepare('SELECT 1 FROM migrations WHERE version = ?').get(migration.version);
      
      if (!exists) {
        console.log(`Ejecutando migración: ${migration.version}`);
        this.db.exec(migration.sql);
        this.db.prepare('INSERT INTO migrations (version) VALUES (?)').run(migration.version);
      }
    }
  }

  private getInitialMigrationSQL(): string {
    return `
      -- Tabla de Empresas
      CREATE TABLE IF NOT EXISTS empresas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        ruc TEXT,
        direccion TEXT,
        telefono TEXT,
        email TEXT,
        contacto TEXT,
        activa INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de Tipos de Formato
      CREATE TABLE IF NOT EXISTS tipos_formato (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        empresa_id TEXT NOT NULL,
        imagen TEXT,
        activo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
      );

      -- Tabla de Pedidos
      CREATE TABLE IF NOT EXISTS pedidos (
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        formato TEXT NOT NULL,
        empresa TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        numeracion_inicial INTEGER NOT NULL,
        estado TEXT NOT NULL CHECK(estado IN ('por recoger', 'recogido', 'pagado', 'sin pagar')),
        fecha_recojo TEXT,
        fecha_pago TEXT,
        monto REAL NOT NULL DEFAULT 0,
        pagado INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de Formatos individuales
      CREATE TABLE IF NOT EXISTS formatos (
        id TEXT PRIMARY KEY,
        numeracion INTEGER NOT NULL,
        fecha_ingreso TEXT NOT NULL,
        ubicacion_actual TEXT NOT NULL,
        fecha_salida TEXT,
        ubicacion_destino TEXT,
        destinatario TEXT,
        observaciones TEXT,
        pedido_id TEXT NOT NULL,
        estado TEXT NOT NULL CHECK(estado IN ('disponible', 'asignado', 'entregado')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE
      );
    `;
  }

  private getIndexesMigrationSQL(): string {
    return `
      -- Índices para mejorar el rendimiento
      CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos (fecha);
      CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON pedidos (empresa);
      CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);
      CREATE INDEX IF NOT EXISTS idx_pedidos_pagado ON pedidos (pagado);
      
      CREATE INDEX IF NOT EXISTS idx_formatos_pedido_id ON formatos (pedido_id);
      CREATE INDEX IF NOT EXISTS idx_formatos_estado ON formatos (estado);
      CREATE INDEX IF NOT EXISTS idx_formatos_numeracion ON formatos (numeracion);
      
      CREATE INDEX IF NOT EXISTS idx_tipos_formato_empresa_id ON tipos_formato (empresa_id);
      CREATE INDEX IF NOT EXISTS idx_tipos_formato_activo ON tipos_formato (activo);
      
      CREATE INDEX IF NOT EXISTS idx_empresas_activa ON empresas (activa);
    `;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseManager;