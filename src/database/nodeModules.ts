// Wrapper seguro para módulos Node.js que solo se cargan en Electron
let modules: {
  Database: any;
  path: any;
  fs: any;
} | null = null;

export const getNodeModules = () => {
  // Solo cargar en Electron
  if (typeof window !== 'undefined' && 
      window.electronAPI && 
      (window as any).require && 
      !modules) {
    try {
      const require = (window as any).require;
      modules = {
        Database: require('better-sqlite3'),
        path: require('path'),
        fs: require('fs')
      };
    } catch (error) {
      console.log('Error loading Node.js modules:', error);
      modules = null;
    }
  }
  
  return modules;
};

export const isNodeModulesAvailable = (): boolean => {
  const nodeModules = getNodeModules();
  return nodeModules !== null && 
         nodeModules.Database && 
         nodeModules.path && 
         nodeModules.fs;
};