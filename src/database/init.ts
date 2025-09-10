import DatabaseManager from './db';

// Función para inicializar la base de datos
export async function initializeDatabase(): Promise<boolean> {
  try {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

export default initializeDatabase;