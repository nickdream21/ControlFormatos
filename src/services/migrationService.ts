import { storageService } from './storage';
import { sqliteStorageService } from './sqliteStorage';
import { Pedido, Formato, Empresa, TipoFormato } from '../types';

class MigrationService {
  private migrated = false;

  // Verificar si ya se migró
  private async checkMigrationStatus(): Promise<boolean> {
    try {
      // Si ya tenemos datos en SQLite, asumimos que ya se migró
      const pedidos = await sqliteStorageService.getPedidos();
      return pedidos.length > 0;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  // Migrar datos de JSON a SQLite
  async migrateFromJSONToSQLite(): Promise<boolean> {
    if (this.migrated) {
      console.log('Migration already completed');
      return true;
    }

    try {
      console.log('Starting migration from JSON to SQLite...');

      // Verificar si ya hay datos en SQLite
      const alreadyMigrated = await this.checkMigrationStatus();
      if (alreadyMigrated) {
        console.log('Data already exists in SQLite, skipping migration');
        this.migrated = true;
        return true;
      }

      // 1. Migrar empresas primero (para mantener integridad referencial)
      await this.migrateEmpresas();
      
      // 2. Migrar tipos de formato (dependen de empresas)
      await this.migrateTiposFormato();
      
      // 3. Migrar pedidos (pueden depender de empresas y tipos de formato)
      await this.migratePedidos();
      
      // 4. Migrar formatos (dependen de pedidos)
      await this.migrateFormatos();

      this.migrated = true;
      console.log('Migration completed successfully!');
      return true;

    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }

  private async migrateEmpresas(): Promise<void> {
    try {
      console.log('Migrating empresas...');
      const empresas = await storageService.getEmpresas();
      
      if (empresas.length === 0) {
        console.log('No empresas to migrate');
        return;
      }

      for (const empresa of empresas) {
        try {
          await sqliteStorageService.createEmpresa({
            nombre: empresa.nombre,
            ruc: empresa.ruc,
            direccion: empresa.direccion,
            telefono: empresa.telefono,
            email: empresa.email,
            contacto: empresa.contacto,
            activa: empresa.activa
          });
        } catch (error) {
          console.error(`Error migrating empresa ${empresa.nombre}:`, error);
        }
      }
      
      console.log(`Migrated ${empresas.length} empresas`);
    } catch (error) {
      console.error('Error migrating empresas:', error);
      throw error;
    }
  }

  private async migrateTiposFormato(): Promise<void> {
    try {
      console.log('Migrating tipos formato...');
      const tiposFormato = await storageService.getTiposFormato();
      
      if (tiposFormato.length === 0) {
        console.log('No tipos formato to migrate');
        return;
      }

      for (const tipoFormato of tiposFormato) {
        try {
          await sqliteStorageService.createTipoFormato({
            nombre: tipoFormato.nombre,
            descripcion: tipoFormato.descripcion,
            empresa_id: tipoFormato.empresa_id,
            imagen: tipoFormato.imagen,
            activo: tipoFormato.activo
          });
        } catch (error) {
          console.error(`Error migrating tipo formato ${tipoFormato.nombre}:`, error);
        }
      }
      
      console.log(`Migrated ${tiposFormato.length} tipos formato`);
    } catch (error) {
      console.error('Error migrating tipos formato:', error);
      throw error;
    }
  }

  private async migratePedidos(): Promise<void> {
    try {
      console.log('Migrating pedidos...');
      const pedidos = await storageService.getPedidos();
      
      if (pedidos.length === 0) {
        console.log('No pedidos to migrate');
        return;
      }

      for (const pedido of pedidos) {
        try {
          // Nota: createPedido también creará los formatos automáticamente
          // Por eso haremos la migración de formatos después, solo para los que no se crearon automáticamente
          await sqliteStorageService.createPedido({
            fecha: pedido.fecha,
            formato: pedido.formato,
            empresa: pedido.empresa,
            cantidad: pedido.cantidad,
            numeracion_inicial: pedido.numeracion_inicial,
            estado: pedido.estado,
            fecha_recojo: pedido.fecha_recojo,
            fecha_pago: pedido.fecha_pago,
            monto: pedido.monto,
            pagado: pedido.pagado
          });
        } catch (error) {
          console.error(`Error migrating pedido ${pedido.id}:`, error);
        }
      }
      
      console.log(`Migrated ${pedidos.length} pedidos`);
    } catch (error) {
      console.error('Error migrating pedidos:', error);
      throw error;
    }
  }

  private async migrateFormatos(): Promise<void> {
    try {
      console.log('Checking formatos migration...');
      
      // Los formatos ya se crearon automáticamente con los pedidos
      // Solo verificamos que todo esté correcto
      const formatosJSON = await storageService.getFormatos();
      const formatosSQLite = await sqliteStorageService.getFormatos();
      
      console.log(`JSON formatos: ${formatosJSON.length}, SQLite formatos: ${formatosSQLite.length}`);
      
      // Si hay diferencias significativas, podríamos hacer ajustes aquí
      if (formatosJSON.length > 0 && formatosSQLite.length === 0) {
        console.warn('No formatos found in SQLite despite having them in JSON. This might indicate an issue.');
      }
      
      console.log('Formatos migration completed');
    } catch (error) {
      console.error('Error checking formatos migration:', error);
      throw error;
    }
  }

  // Crear datos de ejemplo si no hay datos existentes
  async createSampleData(): Promise<boolean> {
    try {
      console.log('Creating sample data...');

      // Verificar si ya hay datos
      const existingPedidos = await sqliteStorageService.getPedidos();
      if (existingPedidos.length > 0) {
        console.log('Data already exists, skipping sample data creation');
        return true;
      }

      // Crear empresa de ejemplo
      const empresaEjemplo = await sqliteStorageService.createEmpresa({
        nombre: 'Empresa de Ejemplo S.A.C.',
        ruc: '20123456789',
        direccion: 'Av. Ejemplo 123, Lima',
        telefono: '01-234-5678',
        email: 'contacto@ejemplo.com',
        contacto: 'Juan Pérez',
        activa: true
      });

      // Crear tipo de formato de ejemplo
      const tipoFormatoEjemplo = await sqliteStorageService.createTipoFormato({
        nombre: 'Formato de Ejemplo',
        descripcion: 'Formato de ejemplo para pruebas',
        empresa_id: empresaEjemplo.id,
        activo: true
      });

      // Crear pedido de ejemplo
      await sqliteStorageService.createPedido({
        fecha: new Date().toISOString().split('T')[0],
        formato: tipoFormatoEjemplo.nombre,
        empresa: empresaEjemplo.nombre,
        cantidad: 50,
        numeracion_inicial: 1,
        estado: 'por recoger',
        monto: 250.00,
        pagado: false
      });

      console.log('Sample data created successfully');
      return true;

    } catch (error) {
      console.error('Error creating sample data:', error);
      return false;
    }
  }
}

export const migrationService = new MigrationService();