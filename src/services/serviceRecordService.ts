import { ServiceRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { cacheService } from './cacheService';

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
    'supplier_warranty', 'technical_solution', 'additional_costs', 'created_by', 'created_at', 'updated_at'
  ];
  const filled: any = { ...obj };
  for (const field of requiredFields) {
    if (!(field in filled)) {
      // Para campos numéricos, use 0; para outros, use string vazia ou null
      if (field === 'part_labor_cost' || field === 'travel_freight_cost' || field === 'supplier_warranty') {
        filled[field] = 0;
      } else if (field === 'additional_costs') {
        filled[field] = [];
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
    // Salva no cache local primeiro
    await cacheService.saveServiceRecord(newRecord);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'create',
      table: 'service_records',
      data: fillMissingFieldsSnakeCase(toSnakeCase(newRecord))
    });
    
    // Tenta sincronizar imediatamente (em background)
    cacheService.syncWithServer().catch(console.error);
    
    return newRecord;
  } catch (error) {
    console.error('Create service record error:', error);
    throw error;
  }
};

export const getServiceRecords = async (filters?: Partial<ServiceRecord>): Promise<ServiceRecord[]> => {
  try {
    // Tenta buscar do cache local primeiro
    let records = await cacheService.getServiceRecords();
    
    // Se não tem dados no cache ou precisa sincronizar, busca do servidor
    if (records.length === 0 || await cacheService.needsSync()) {
      console.log('📡 Buscando dados do servidor...');
      try {
        await cacheService.syncWithServer();
        records = await cacheService.getServiceRecords();
      } catch (error) {
        console.error('Erro ao sincronizar, usando dados do cache:', error);
        // Usa dados do cache mesmo se a sincronização falhar
      }
    }
    
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
    // Busca primeiro no cache local
    let record = await cacheService.getServiceRecordById(id);
    
    // Se não encontrou no cache, tenta sincronizar e buscar novamente
    if (!record) {
      try {
        await cacheService.syncWithServer();
        record = await cacheService.getServiceRecordById(id);
      } catch (error) {
        console.error('Erro ao sincronizar:', error);
      }
    }
    
    return record;
  } catch (error) {
    console.error('Get service record by ID error:', error);
    return null;
  }
};

export const updateServiceRecord = async (id: string, record: Partial<ServiceRecord>): Promise<ServiceRecord | null> => {
  try {
    // Busca o registro atual do cache
    const currentRecord = await cacheService.getServiceRecordById(id);
    if (!currentRecord) {
      throw new Error('Registro não encontrado');
    }
    
    // Atualiza o registro
    const updated = { ...record, updatedAt: new Date().toISOString() };
    const updatedRecord = { ...currentRecord, ...updated };
    
    // Salva no cache local
    await cacheService.saveServiceRecord(updatedRecord);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'update',
      table: 'service_records',
      data: fillMissingFieldsSnakeCase(toSnakeCase(updatedRecord))
    });
    
    // Tenta sincronizar imediatamente (em background)
    cacheService.syncWithServer().catch(console.error);
    
    return updatedRecord;
  } catch (error) {
    console.error('Update service record error:', error);
    throw error;
  }
};

export const deleteServiceRecord = async (id: string): Promise<boolean> => {
  try {
    // Remove do cache local
    await cacheService.deleteServiceRecord(id);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'delete',
      table: 'service_records',
      data: { id }
    });
    
    // Tenta sincronizar imediatamente (em background)
    cacheService.syncWithServer().catch(console.error);
    
    return true;
  } catch (error) {
    console.error('Delete service record error:', error);
    return false;
  }
};

// Função para buscar usuários (também com cache)
export const getUsers = async (): Promise<any[]> => {
  try {
    // Tenta buscar do cache local primeiro
    let users = await cacheService.getUsers();
    
    // Se não tem dados no cache, busca do servidor
    if (users.length === 0) {
      try {
        const serverUsers = await window.electronAPI.getUsers();
        for (const user of serverUsers) {
          await cacheService.saveUser(user);
        }
        users = serverUsers;
      } catch (error) {
        console.error('Erro ao buscar usuários do servidor:', error);
      }
    }
    
    return users;
  } catch (error) {
    console.error('Get users error:', error);
    return [];
  }
};