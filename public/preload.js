const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filename) => ipcRenderer.invoke('read-file', filename),
  writeFile: (filename, data) => ipcRenderer.invoke('write-file', filename, data),
  getNextNumber: (type, empresa, blockSize) => ipcRenderer.invoke('get-next-number', type, empresa, blockSize)
});