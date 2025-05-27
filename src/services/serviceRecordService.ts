import { ServiceRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Função utilitária para converter camelCase para snake_case
function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const newObj: any = {};
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
}

// Garante que todos os campos obrigatórios do SQL estejam presentes
function fillMissingFieldsSnakeCase(obj: any): any {
  const requiredFields = [
    'id', 'order_number', 'equipment', 'chassis_plate', 'client', 'manufacturing_date',
    'call_opening_date', 'technician', 'assistance_type', 'assistance_location', 'contact_person',
    'phone', 'reported_issue', 'supplier', 'part', 'observations', 'service_date',
    'responsible_technician', 'part_labor_cost', 'travel_freight_cost', 'part_return',
    'supplier_warranty', 'technical_solution', 'created_by', 'created_at', 'updated_at'
  ];
  const filled: any = { ...obj };
  for (const field of requiredFields) {
    if (!(field in filled)) {
      // Para campos numéricos, use 0; para outros, use string vazia ou null
      if (field === 'part_labor_cost' || field === 'travel_freight_cost' || field === 'supplier_warranty') {
        filled[field] = 0;
      } else {
        filled[field] = '';
      }
    }
  }
  return filled;
}

export const createServiceRecord = async (record: Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceRecord> => {
  const newRecord: ServiceRecord = {
    ...record,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // Converte para snake_case e preenche campos obrigatórios
    const snake = toSnakeCase(newRecord);
    const filled = fillMissingFieldsSnakeCase(snake);
    await window.electronAPI.addServiceRecord(filled);
    return newRecord;
  } catch (error) {
    console.error('Create service record error:', error);
    return newRecord;
  }
};

export const getServiceRecords = async (filters?: Partial<ServiceRecord>): Promise<ServiceRecord[]> => {
  try {
    let records = await window.electronAPI.getServiceRecords();
    if (filters) {
      records = records.filter((record: any) =>
        Object.entries(filters).every(
          ([key, value]) => value === undefined || value === null || value === '' || record[key] === value
        )
      );
    }
    return records;
  } catch (error) {
    console.error('Get service records error:', error);
    return [];
  }
};

export const getServiceRecordById = async (id: string): Promise<ServiceRecord | null> => {
  try {
    const records = await window.electronAPI.getServiceRecords();
    return records.find((record: any) => record.id === id) || null;
  } catch (error) {
    console.error('Get service record by ID error:', error);
    return null;
  }
};

export const updateServiceRecord = async (id: string, record: Partial<ServiceRecord>): Promise<ServiceRecord | null> => {
  try {
    // Converte para snake_case e preenche campos obrigatórios
    const updated = { ...record, updatedAt: new Date().toISOString() };
    const snake = toSnakeCase(updated);
    const filled = fillMissingFieldsSnakeCase(snake);
    await window.electronAPI.updateServiceRecord(id, filled);
    // Retorne o registro atualizado (opcional: buscar novamente)
    const records = await window.electronAPI.getServiceRecords();
    return records.find((r: any) => r.id === id) || null;
  } catch (error) {
    console.error('Update service record error:', error);
    return null;
  }
};

export const deleteServiceRecord = async (id: string): Promise<boolean> => {
  try {
    await window.electronAPI.deleteServiceRecord(id);
    return true;
  } catch (error) {
    console.error('Delete service record error:', error);
    return false;
  }
};