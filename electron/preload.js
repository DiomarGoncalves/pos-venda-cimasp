const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // USERS
  getUsers: () => ipcRenderer.invoke('getUsers'),
  addUser: (user) => ipcRenderer.invoke('addUser', user),

  // SERVICE RECORDS
  getServiceRecords: () => ipcRenderer.invoke('getServiceRecords'),
  addServiceRecord: (record) => ipcRenderer.invoke('addServiceRecord', record),
  deleteServiceRecord: (id) => ipcRenderer.invoke('deleteServiceRecord', id),
  updateServiceRecord: (id, updated) => ipcRenderer.invoke('updateServiceRecord', id, updated),

  // ATTACHMENTS
  getAttachments: (service_record_id) => ipcRenderer.invoke('getAttachments', service_record_id),
  addAttachment: (attachment) => ipcRenderer.invoke('addAttachment', attachment),
  deleteAttachment: (id) => ipcRenderer.invoke('deleteAttachment', id),
  saveAttachmentFile: (data) => ipcRenderer.invoke('saveAttachmentFile', data),
  openAttachmentFile: (filePath) => ipcRenderer.invoke('openAttachmentFile', filePath),
  getAttachmentFile: (attachmentId) => ipcRenderer.invoke('getAttachmentFile', attachmentId),

  // SETTINGS
  getStoreValue: (key) => ipcRenderer.invoke('getStoreValue', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('setStoreValue', key, value),

  // IMPORTAÇÃO DE EXCEL (opcional, se quiser processar no backend)
  importExcel: (filePath) => ipcRenderer.invoke('importExcel', filePath),

  // Atualização automática
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onUpdateError: (callback) => ipcRenderer.on('update-error', callback),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  restartAppForUpdate: () => ipcRenderer.send('restart-app-for-update'),
  installUpdateNow: () => ipcRenderer.send('install-update-now'),

  // Adicione outros métodos conforme necessário
});