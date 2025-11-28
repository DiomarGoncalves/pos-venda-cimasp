import { ServiceRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createServiceRecord = async (record: Omit<ServiceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceRecord> => {
  const newRecord: ServiceRecord = {
    ...record,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const saved = await window.electronAPI.addServiceRecord(newRecord);
  return saved;
};

export const getServiceRecords = async (page = 1, limit = 50, search = ''): Promise<{ records: ServiceRecord[], total: number, page: number, totalPages: number }> => {
  return await window.electronAPI.getServiceRecords(page, limit, search);
};

export const getServiceRecordById = async (id: string): Promise<ServiceRecord | null> => {
  // Busca apenas o registro específico se possível, ou busca na lista (menos eficiente mas mantém compatibilidade)
  // Idealmente, deveríamos ter um endpoint específico para buscar por ID no backend
  const { records } = await window.electronAPI.getServiceRecords(1, 1000, ''); // Busca provisória
  return records.find((r: ServiceRecord) => r.id === id) || null;
};

export const updateServiceRecord = async (id: string, record: Partial<ServiceRecord>): Promise<ServiceRecord | null> => {
  const success = await window.electronAPI.updateServiceRecord(id, record);
  if (success) {
    return getServiceRecordById(id);
  }
  return null;
};

export const deleteServiceRecord = async (id: string): Promise<boolean> => {
  return await window.electronAPI.deleteServiceRecord(id);
};

export const getUsers = async () => {
  return await window.electronAPI.getUsers();
};