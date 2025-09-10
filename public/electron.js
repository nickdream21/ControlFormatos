const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Control de Formatos SGV',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: true
  });

  // Always use dev server for now
  const startUrl = 'http://localhost:3001';
  
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Add error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, errorDescription);
  });
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const getDataPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'data');
};

const ensureDataDirectory = async () => {
  const dataPath = getDataPath();
  try {
    await mkdir(dataPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

ipcMain.handle('read-file', async (event, filename) => {
  try {
    await ensureDataDirectory();
    const filePath = path.join(getDataPath(), filename);
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
});

ipcMain.handle('write-file', async (event, filename, data) => {
  try {
    await ensureDataDirectory();
    const filePath = path.join(getDataPath(), filename);
    await writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
});

ipcMain.handle('get-next-number', async (event, formatType, empresa, blockSize = 50) => {
  try {
    // Use format type and empresa as filename (sanitized)
    const sanitizedType = formatType.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedEmpresa = empresa.replace(/[^a-zA-Z0-9]/g, '_');
    const numbersFile = `${sanitizedEmpresa}_${sanitizedType}_numbers.json`;
    
    // Also check existing formatos to find the real max number for this format and empresa
    let maxExistingNumber = 0;
    try {
      const formatosData = await readFile(path.join(getDataPath(), 'formatos.json'), 'utf8');
      const formatos = JSON.parse(formatosData);
      const pedidosData = await readFile(path.join(getDataPath(), 'pedidos.json'), 'utf8');
      const pedidos = JSON.parse(pedidosData);
      
      // Filter formatos by the same format type AND empresa
      const formatosDelMismoTipoYEmpresa = formatos.filter(formato => {
        const pedido = pedidos.find(p => p.id === formato.pedido_id);
        return pedido && pedido.formato === formatType && pedido.empresa === empresa;
      });
      
      if (formatosDelMismoTipoYEmpresa.length > 0) {
        maxExistingNumber = formatosDelMismoTipoYEmpresa.reduce((max, f) => Math.max(max, f.numeracion), 0);
      }
    } catch (error) {
      // If files don't exist, that's OK - we start from 1
    }
    
    // Read stored numbers for this format type and empresa
    let numbers = [];
    try {
      await ensureDataDirectory();
      const filePath = path.join(getDataPath(), numbersFile);
      const data = await readFile(filePath, 'utf8');
      numbers = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    let nextNumber;
    if (numbers.length === 0) {
      // First time for this format type and empresa
      nextNumber = maxExistingNumber + 1;
    } else {
      const maxStoredNumber = Math.max(...numbers);
      nextNumber = Math.max(maxExistingNumber + 1, maxStoredNumber);
      // Remove this number from stored numbers
      numbers = numbers.filter(n => n !== nextNumber);
    }
    
    // Save updated numbers
    const filePath = path.join(getDataPath(), numbersFile);
    await writeFile(filePath, JSON.stringify(numbers, null, 2));
    
    return nextNumber;
  } catch (error) {
    console.error('Error getting next number:', error);
    return null;
  }
});