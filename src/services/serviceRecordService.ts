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
  
  // Garante que supplier_warranty seja sempre um inteiro
  if ('supplier_warranty' in filled) {
    if (filled.supplier_warranty === true || filled.supplier_warranty === 1 || filled.supplier_warranty === '1' || filled.supplier_warranty === 'true') {
      filled.supplier_warranty = 1;
    } else {
      filled.supplier_warranty = 0;
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
    // SEMPRE tenta salvar no servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('💾 Salvando atendimento no servidor...');
      const serverRecord = await window.electronAPI.addServiceRecord(fillMissingFieldsSnakeCase(toSnakeCase(newRecord)));
      
      // Salva no cache após sucesso no servidor
      await cacheService.saveServiceRecord(newRecord);
      console.log('✅ Atendimento salvo no servidor e cache atualizado');
      
      // Aguarda um pouco para garantir que o registro esteja disponível para busca
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return newRecord;
    } else {
      throw new Error('Offline - salvando no cache');
    }
  } catch (error) {
    console.warn('⚠️ Falha no servidor, salvando no cache:', error);
    
    // Salva no cache como fallback
    await cacheService.saveServiceRecord(newRecord);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'create',
      table: 'service_records',
      data: fillMissingFieldsSnakeCase(toSnakeCase(newRecord))
    });
    
    console.log('📱 Atendimento salvo no cache - será sincronizado quando possível');
    return newRecord;
  }
};

export const getServiceRecords = async (filters?: Partial<ServiceRecord>): Promise<ServiceRecord[]> => {
  try {
    // SEMPRE tenta buscar do servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('📡 Buscando atendimentos do servidor...');
      const serverRecords = await window.electronAPI.getServiceRecords();
      
      // Atualiza o cache com os dados do servidor
      await cacheService.saveMultipleServiceRecords(serverRecords);
      console.log('✅ Dados obtidos do servidor e cache atualizado');
      
      let records = serverRecords;
      
      if (filters) {
        records = records.filter((record: any) =>
          Object.entries(filters).every(
            ([key, value]) => value === undefined || value === null || value === '' || record[key] === value
          )
        );
      }
      return records;
    } else {
      throw new Error('Offline - usando cache');
    }
  } catch (error) {
    console.warn('⚠️ Falha no servidor, usando cache:', error);
    
    // Usa cache como fallback
    let records = await cacheService.getServiceRecords();
    console.log('📱 Dados obtidos do cache local');
    
    if (filters) {
      records = records.filter((record: any) =>
        Object.entries(filters).every(
          ([key, value]) => value === undefined || value === null || value === '' || record[key] === value
        )
      );
    }
    return records;
  }
};

export const getServiceRecordById = async (id: string): Promise<ServiceRecord | null> => {
  try {
    // SEMPRE tenta buscar do servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('📡 Buscando atendimento do servidor...');
      const serverRecords = await window.electronAPI.getServiceRecords();
      const record = serverRecords.find((r: any) => r.id === id);
      
      if (record) {
        // Atualiza o cache com o registro encontrado
        await cacheService.saveServiceRecord(record);
        console.log('✅ Atendimento obtido do servidor e cache atualizado');
        return record;
      } else {
        // Se não encontrou no servidor, tenta no cache
        console.log('📱 Atendimento não encontrado no servidor, tentando cache...');
        const cacheRecord = await cacheService.getServiceRecordById(id);
        if (cacheRecord) {
          console.log('✅ Atendimento encontrado no cache');
          return cacheRecord;
        }
      }
      
      return null;
    } else {
      throw new Error('Offline - usando cache');
    }
  } catch (error) {
    console.warn('⚠️ Falha no servidor, usando cache:', error);
    
    // Usa cache como fallback
    const record = await cacheService.getServiceRecordById(id);
    console.log('📱 Atendimento obtido do cache local');
    
    return record;
  }
};

export const updateServiceRecord = async (id: string, record: Partial<ServiceRecord>): Promise<ServiceRecord | null> => {
  try {
    // SEMPRE tenta atualizar no servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('💾 Atualizando atendimento no servidor...');
      
      // Busca o registro atual do servidor
      const serverRecords = await window.electronAPI.getServiceRecords();
      const currentRecord = serverRecords.find((r: any) => r.id === id);
      
      if (!currentRecord) {
        throw new Error('Registro não encontrado no servidor');
      }
      
      // Atualiza o registro
      const updated = { ...record, updatedAt: new Date().toISOString() };
      const updatedRecord = { ...currentRecord, ...updated };
      
      // Atualiza no servidor
      const success = await window.electronAPI.updateServiceRecord(id, fillMissingFieldsSnakeCase(toSnakeCase(updatedRecord)));
      
      if (success) {
        // Atualiza o cache após sucesso no servidor
        await cacheService.saveServiceRecord(updatedRecord);
        console.log('✅ Atendimento atualizado no servidor e cache atualizado');
        return updatedRecord;
      } else {
        throw new Error('Falha ao atualizar no servidor');
      }
    } else {
      throw new Error('Offline - salvando no cache');
    }
  } catch (error) {
    console.warn('⚠️ Falha no servidor, salvando no cache:', error);
    
    // Busca o registro atual do cache
    const currentRecord = await cacheService.getServiceRecordById(id);
    if (!currentRecord) {
      throw new Error('Registro não encontrado');
    }
    
    // Atualiza o registro no cache
    const updated = { ...record, updatedAt: new Date().toISOString() };
    const updatedRecord = { ...currentRecord, ...updated };
    
    // Salva no cache
    await cacheService.saveServiceRecord(updatedRecord);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'update',
      table: 'service_records',
      data: fillMissingFieldsSnakeCase(toSnakeCase(updatedRecord))
    });
    
    console.log('📱 Atendimento atualizado no cache - será sincronizado quando possível');
    return updatedRecord;
  }
};

export const deleteServiceRecord = async (id: string): Promise<boolean> => {
  try {
    // SEMPRE tenta deletar do servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('💾 Deletando atendimento do servidor...');
      const success = await window.electronAPI.deleteServiceRecord(id);
      
      if (success) {
        // Remove do cache após sucesso no servidor
        await cacheService.deleteServiceRecord(id);
        console.log('✅ Atendimento deletado do servidor e cache atualizado');
        return true;
      } else {
        throw new Error('Falha ao deletar do servidor');
      }
    } else {
      throw new Error('Offline - salvando no cache');
    }
  } catch (error) {
    console.warn('⚠️ Falha no servidor, salvando no cache:', error);
    
    // Remove do cache
    await cacheService.deleteServiceRecord(id);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'delete',
      table: 'service_records',
      data: { id }
    });
    
    console.log('📱 Atendimento marcado para exclusão - será sincronizado quando possível');
    return true;
  }
};

// Função para buscar usuários (também com cache)
export const getUsers = async (): Promise<any[]> => {
  try {
    // SEMPRE tenta buscar do servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('📡 Buscando usuários do servidor...');
      const serverUsers = await window.electronAPI.getUsers();
      
      // Atualiza o cache com os dados do servidor
      await cacheService.saveMultipleUsers(serverUsers);
      console.log('✅ Usuários obtidos do servidor e cache atualizado');
      
      return serverUsers;
    } else {
      throw new Error('Offline - usando cache');
    }
  } catch (error) {
    console.warn('⚠️ Falha no servidor, usando cache:', error);
    
    // Usa cache como fallback
    const users = await cacheService.getUsers();
    console.log('📱 Usuários obtidos do cache local');
    
    return users;
  }
};