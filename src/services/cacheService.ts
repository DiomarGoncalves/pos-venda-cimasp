// Cache service using IndexedDB for local storage and sync
import { ServiceRecord, Attachment, User } from '../types';

interface CacheData {
  data: any;
  timestamp: number;
  version: number;
}

interface SyncQueue {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'service_records' | 'attachments' | 'users';
  data: any;
  timestamp: number;
}

class CacheService {
  private dbName = 'TechnicalServiceCache';
  private version = 1;
  private db: IDBDatabase | null = null;
  private syncInProgress = false;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para service records
        if (!db.objectStoreNames.contains('service_records')) {
          db.createObjectStore('service_records', { keyPath: 'id' });
        }

        // Store para attachments
        if (!db.objectStoreNames.contains('attachments')) {
          const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' });
          attachmentStore.createIndex('service_record_id', 'service_record_id', { unique: false });
        }

        // Store para users
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // Store para sync queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }

        // Store para metadata
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Métodos para Service Records
  async getServiceRecords(): Promise<ServiceRecord[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['service_records'], 'readonly');
      const store = transaction.objectStore('service_records');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getServiceRecordById(id: string): Promise<ServiceRecord | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['service_records'], 'readonly');
      const store = transaction.objectStore('service_records');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveServiceRecord(record: ServiceRecord): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['service_records'], 'readwrite');
      const store = transaction.objectStore('service_records');
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteServiceRecord(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['service_records'], 'readwrite');
      const store = transaction.objectStore('service_records');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Métodos para Attachments
  async getAttachments(serviceRecordId: string): Promise<Attachment[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['attachments'], 'readonly');
      const store = transaction.objectStore('attachments');
      const index = store.index('service_record_id');
      const request = index.getAll(serviceRecordId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAttachment(attachment: Attachment): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['attachments'], 'readwrite');
      const store = transaction.objectStore('attachments');
      const request = store.put(attachment);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAttachment(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['attachments'], 'readwrite');
      const store = transaction.objectStore('attachments');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Métodos para Users
  async getUsers(): Promise<User[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveUser(user: User): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue Methods
  async addToSyncQueue(item: Omit<SyncQueue, 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();
    
    const syncItem: SyncQueue = {
      ...item,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.put(syncItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueue[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Metadata methods
  async setLastSyncTime(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key: 'lastSync', value: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSyncTime(): Promise<number | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get('lastSync');

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync methods
  async syncWithServer(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    console.log('🔄 Iniciando sincronização...');

    try {
      // 1. Baixar dados do servidor e salvar no cache
      await this.downloadFromServer();
      
      // 2. Enviar alterações pendentes para o servidor
      await this.uploadPendingChanges();
      
      // 3. Atualizar timestamp da última sincronização
      await this.setLastSyncTime();
      
      console.log('✅ Sincronização concluída!');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async downloadFromServer(): Promise<void> {
    try {
      // Baixar service records
      const serviceRecords = await window.electronAPI.getServiceRecords();
      for (const record of serviceRecords) {
        await this.saveServiceRecord(record);
      }

      // Baixar users
      const users = await window.electronAPI.getUsers();
      for (const user of users) {
        await this.saveUser(user);
      }

      // Baixar attachments para cada service record
      for (const record of serviceRecords) {
        const attachments = await window.electronAPI.getAttachments(record.id);
        for (const attachment of attachments) {
          await this.saveAttachment(attachment);
        }
      }

      console.log(`📥 Baixados: ${serviceRecords.length} atendimentos, ${users.length} usuários`);
    } catch (error) {
      console.error('Erro ao baixar dados do servidor:', error);
      throw error;
    }
  }

  private async uploadPendingChanges(): Promise<void> {
    const syncQueue = await this.getSyncQueue();
    
    if (syncQueue.length === 0) {
      console.log('📤 Nenhuma alteração pendente para sincronizar');
      return;
    }

    console.log(`📤 Sincronizando ${syncQueue.length} alterações pendentes...`);

    for (const item of syncQueue) {
      try {
        switch (item.table) {
          case 'service_records':
            await this.syncServiceRecord(item);
            break;
          case 'attachments':
            await this.syncAttachment(item);
            break;
          case 'users':
            await this.syncUser(item);
            break;
        }
        
        // Remove item da fila após sincronização bem-sucedida
        await this.removeSyncItem(item.id);
      } catch (error) {
        console.error(`Erro ao sincronizar item ${item.id}:`, error);
        // Não remove da fila para tentar novamente depois
      }
    }
  }

  private async syncServiceRecord(item: SyncQueue): Promise<void> {
    switch (item.type) {
      case 'create':
        await window.electronAPI.addServiceRecord(item.data);
        break;
      case 'update':
        await window.electronAPI.updateServiceRecord(item.data.id, item.data);
        break;
      case 'delete':
        await window.electronAPI.deleteServiceRecord(item.data.id);
        break;
    }
  }

  private async syncAttachment(item: SyncQueue): Promise<void> {
    switch (item.type) {
      case 'create':
        await window.electronAPI.addAttachment(item.data);
        break;
      case 'delete':
        await window.electronAPI.deleteAttachment(item.data.id);
        break;
    }
  }

  private async syncUser(item: SyncQueue): Promise<void> {
    switch (item.type) {
      case 'create':
        await window.electronAPI.addUser(item.data);
        break;
    }
  }

  // Limpar cache
  async clearCache(): Promise<void> {
    if (!this.db) await this.init();
    
    const stores = ['service_records', 'attachments', 'users', 'sync_queue', 'metadata'];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, 'readwrite');
      
      let completed = 0;
      const total = stores.length;
      
      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            console.log('🗑️ Cache limpo com sucesso');
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Verificar se precisa sincronizar
  async needsSync(): Promise<boolean> {
    const lastSync = await this.getLastSyncTime();
    if (!lastSync) return true;
    
    const now = Date.now();
    const timeDiff = now - lastSync;
    const maxAge = 10 * 60 * 1000; // 10 minutos
    
    return timeDiff > maxAge;
  }
}

export const cacheService = new CacheService();