const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // USERS
  getUsers: () => ipcRenderer.invoke('getUsers'),
  addUser: (user) => ipcRenderer.invoke('addUser', user),
  validateUser: (username, password) => ipcRenderer.invoke('validateUser', username, password),

  // SERVICE RECORDS
  getServiceRecords: () => ipcRenderer.invoke('getServiceRecords'),
  addServiceRecord: (record) => ipcRenderer.invoke('addServiceRecord', record),
  deleteServiceRecord: (id) => ipcRenderer.invoke('deleteServiceRecord', id),
  updateServiceRecord: (id, updated) => ipcRenderer.invoke('updateServiceRecord', id, updated),

  // ATTACHMENTS
  getAttachments: (service_record_id) => ipcRenderer.invoke('getAttachments', service_record_id),
  addAttachment: (attachment) => ipcRenderer.invoke('addAttachment', attachment),
  deleteAttachment: (id) => ipcRenderer.invoke('deleteAttachment', id),
  getAttachmentFile: (attachmentId) => ipcRenderer.invoke('getAttachmentFile', attachmentId),

  // SETTINGS
  getStoreValue: (key) => ipcRenderer.invoke('getStoreValue', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('setStoreValue', key, value),

  // IMPORT
  importExcel: (filePath) => ipcRenderer.invoke('importExcel', filePath),
});