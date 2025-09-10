import DatabaseManager from './db';
import BrowserDatabaseManager from './browserDb';

export class DatabaseAdapter {
  private dbManager: DatabaseManager;
  private isBrowser: boolean;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.isBrowser = DatabaseManager.isBrowserMode();
  }

  async initialize(): Promise<void> {
    await this.dbManager.initialize();
  }

  // Método para insertar datos
  async insert(table: string, data: any): Promise<void> {
    if (this.isBrowser) {
      const browserDb = this.dbManager.getDatabase() as BrowserDatabaseManager;
      await browserDb.add(table as any, data);
    } else {
      const db = this.dbManager.getDatabase();
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const stmt = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
      stmt.run(...values);
    }
  }

  // Método para obtener todos los registros
  async findAll(table: string, orderBy?: string): Promise<any[]> {
    if (this.isBrowser) {
      const browserDb = this.dbManager.getDatabase() as BrowserDatabaseManager;
      const results = await browserDb.getAll(table as any);
      
      if (orderBy) {
        // Ordenar manualmente ya que IndexedDB no soporta ORDER BY complejo
        const [field, direction = 'ASC'] = orderBy.split(' ');
        results.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (direction.toUpperCase() === 'DESC') {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
      }
      
      return results;
    } else {
      const db = this.dbManager.getDatabase();
      const orderClause = orderBy ? ` ORDER BY ${orderBy}` : '';
      const stmt = db.prepare(`SELECT * FROM ${table}${orderClause}`);
      return stmt.all();
    }
  }

  // Método para obtener un registro por ID
  async findById(table: string, id: string): Promise<any | null> {
    if (this.isBrowser) {
      const browserDb = this.dbManager.getDatabase() as BrowserDatabaseManager;
      const result = await browserDb.get(table as any, id);
      return result || null;
    } else {
      const db = this.dbManager.getDatabase();
      const stmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
      return stmt.get(id) || null;
    }
  }

  // Método para actualizar un registro
  async update(table: string, id: string, data: any): Promise<void> {
    if (this.isBrowser) {
      const browserDb = this.dbManager.getDatabase() as BrowserDatabaseManager;
      const existing = await browserDb.get(table as any, id);
      if (existing) {
        const updatedData = { ...existing, ...data, id };
        await browserDb.update(table as any, updatedData);
      }
    } else {
      const db = this.dbManager.getDatabase();
      const columns = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = Object.values(data);
      
      const stmt = db.prepare(`UPDATE ${table} SET ${columns} WHERE id = ?`);
      stmt.run(...values, id);
    }
  }

  // Método para eliminar un registro
  async delete(table: string, id: string): Promise<boolean> {
    if (this.isBrowser) {
      const browserDb = this.dbManager.getDatabase() as BrowserDatabaseManager;
      await browserDb.delete(table as any, id);
      return true;
    } else {
      const db = this.dbManager.getDatabase();
      const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
      const result = stmt.run(id);
      return result.changes > 0;
    }
  }

  // Método para búsqueda con LIKE
  async search(table: string, searchFields: string[], query: string, orderBy?: string): Promise<any[]> {
    if (this.isBrowser) {
      const browserDb = this.dbManager.getDatabase() as BrowserDatabaseManager;
      const allRecords = await browserDb.getAll(table as any);
      
      // Filtrar manualmente
      const searchTerm = query.toLowerCase();
      const filtered = allRecords.filter(record => 
        searchFields.some(field => 
          record[field] && record[field].toString().toLowerCase().includes(searchTerm)
        )
      );

      if (orderBy) {
        const [field, direction = 'ASC'] = orderBy.split(' ');
        filtered.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (direction.toUpperCase() === 'DESC') {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
      }
      
      return filtered;
    } else {
      const db = this.dbManager.getDatabase();
      const conditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
      const searchTerm = `%${query.toLowerCase()}%`;
      const params = searchFields.map(() => searchTerm);
      const orderClause = orderBy ? ` ORDER BY ${orderBy}` : '';
      
      const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${conditions}${orderClause}`);
      return stmt.all(...params);
    }
  }

  // Método para filtros complejos
  async filter(table: string, filters: { [key: string]: any }, orderBy?: string): Promise<any[]> {
    if (this.isBrowser) {
      const browserDb = this.dbManager.getDatabase() as BrowserDatabaseManager;
      const allRecords = await browserDb.getAll(table as any);
      
      // Aplicar filtros manualmente
      const filtered = allRecords.filter(record => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === undefined) return true;
          
          // Manejar filtros especiales como fecha_desde, fecha_hasta
          if (key.endsWith('_desde')) {
            const dateField = key.replace('_desde', '');
            return record[dateField] >= value;
          }
          if (key.endsWith('_hasta')) {
            const dateField = key.replace('_hasta', '');
            return record[dateField] <= value;
          }
          
          // Filtro por igualdad o LIKE
          if (typeof value === 'string' && value.includes('%')) {
            const searchTerm = value.replace(/%/g, '');
            return record[key] && record[key].toString().toLowerCase().includes(searchTerm.toLowerCase());
          }
          
          return record[key] === value;
        });
      });

      if (orderBy) {
        const [field, direction = 'ASC'] = orderBy.split(' ');
        filtered.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (direction.toUpperCase() === 'DESC') {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
      }
      
      return filtered;
    } else {
      const db = this.dbManager.getDatabase();
      let sql = `SELECT * FROM ${table} WHERE 1=1`;
      const params: any[] = [];

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key.endsWith('_desde')) {
            const dateField = key.replace('_desde', '');
            sql += ` AND ${dateField} >= ?`;
            params.push(value);
          } else if (key.endsWith('_hasta')) {
            const dateField = key.replace('_hasta', '');
            sql += ` AND ${dateField} <= ?`;
            params.push(value);
          } else if (typeof value === 'string' && value.includes('%')) {
            sql += ` AND ${key} LIKE ?`;
            params.push(value);
          } else {
            sql += ` AND ${key} = ?`;
            params.push(value);
          }
        }
      });

      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }

      const stmt = db.prepare(sql);
      return stmt.all(...params);
    }
  }

  // Método para consultas personalizadas (solo SQLite)
  async customQuery(sql: string, params: any[] = []): Promise<any> {
    if (this.isBrowser) {
      throw new Error('Custom queries not supported in browser mode');
    }
    
    const db = this.dbManager.getDatabase();
    const stmt = db.prepare(sql);
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...params);
    } else {
      return stmt.run(...params);
    }
  }
}

export default DatabaseAdapter;