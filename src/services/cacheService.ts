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
  retries: number;
}

class CacheService {
  private dbName = 'TechnicalServiceCache';
  private version = 1;
  private db: IDBDatabase | null = null;
  private syncInProgress = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.startAutoSync();
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

  // Inicia sincronização automática a cada 10 segundos
  private startAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    
    this.autoSyncInterval = setInterval(() => {
      // Só executa auto-sync se não estiver já processando e houver itens na fila
      if (!this.syncInProgress) {
        this.getSyncQueue().then(queue => {
          if (queue.length > 0) {
            this.processSyncQueue().catch(error => {
              console.warn('Auto-sync falhou:', error);
            });
          }
        });
      }
    }, 30000); // 30 segundos - menos frequente para evitar spam
  }

  // Para a sincronização automática
  private stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  // NOVA ESTRATÉGIA: Sempre tenta servidor primeiro, cache como fallback
  async saveToServerFirst<T>(
    operation: () => Promise<T>,
    fallbackCacheOperation: () => Promise<void>,
    syncQueueItem?: Omit<SyncQueue, 'timestamp' | 'retries'>
  ): Promise<T> {
    try {
      // SEMPRE tenta servidor primeiro
      if (navigator.onLine && window.electronAPI) {
        console.log('💾 Salvando diretamente no servidor...');
        const result = await operation();
        
        // Se salvou no servidor, também salva no cache para performance
        await fallbackCacheOperation();
        console.log('✅ Salvo no servidor e cache atualizado');
        
        return result;
      } else {
        throw new Error('Offline - usando cache');
      }
    } catch (error) {
      console.warn('⚠️ Falha no servidor, salvando no cache:', error);
      
      // Salva no cache como fallback
      await fallbackCacheOperation();
      
      // Adiciona à fila de sincronização se fornecido
      if (syncQueueItem) {
        await this.addToSyncQueue(syncQueueItem);
      }
      
      // Retorna um resultado padrão ou relança o erro dependendo do contexto
      throw new Error('Salvo offline - será sincronizado quando possível');
    }
  }

  // NOVA ESTRATÉGIA: Sempre busca do servidor primeiro, cache como fallback
  async getFromServerFirst<T>(
    serverOperation: () => Promise<T>,
    cacheOperation: () => Promise<T>,
    updateCacheOperation?: (data: T) => Promise<void>
  ): Promise<T> {
    try {
      // SEMPRE tenta servidor primeiro
      if (navigator.onLine && window.electronAPI) {
        console.log('📡 Buscando dados do servidor...');
        const serverData = await serverOperation();
        
        // Atualiza o cache com os dados do servidor
        if (updateCacheOperation) {
          await updateCacheOperation(serverData);
        }
        
        console.log('✅ Dados obtidos do servidor e cache atualizado');
        return serverData;
      } else {
        throw new Error('Offline - usando cache');
      }
    } catch (error) {
      console.warn('⚠️ Falha no servidor, usando cache:', error);
      
      // Usa cache como fallback
      const cacheData = await cacheOperation();
      console.log('📱 Dados obtidos do cache local');
      
      return cacheData;
    }
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

  async saveMultipleServiceRecords(records: ServiceRecord[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['service_records'], 'readwrite');
      const store = transaction.objectStore('service_records');
      
      let completed = 0;
      const total = records.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      records.forEach(record => {
        const request = store.put(record);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
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

  async saveMultipleAttachments(attachments: Attachment[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['attachments'], 'readwrite');
      const store = transaction.objectStore('attachments');
      
      let completed = 0;
      const total = attachments.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      attachments.forEach(attachment => {
        const request = store.put(attachment);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
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

  async saveMultipleUsers(users: User[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      let completed = 0;
      const total = users.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      users.forEach(user => {
        const request = store.put(user);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Sync Queue Methods
  async addToSyncQueue(item: Omit<SyncQueue, 'timestamp' | 'retries'>): Promise<void> {
    if (!this.db) await this.init();
    
    const syncItem: SyncQueue = {
      ...item,
      timestamp: Date.now(),
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.put(syncItem);

      request.onsuccess = () => {
        resolve();
        console.log('📤 Item adicionado à fila de sincronização:', item.type, item.table);
        // NÃO processa automaticamente - evita duplicação
      };
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

  async updateSyncItemRetries(id: string, retries: number): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retries = retries;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
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

  // NOVO: Processa fila de sincronização (mais eficiente)
  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }
    
    if (!navigator.onLine || !window.electronAPI) {
      console.log('🔄 Offline - aguardando conexão para sincronizar');
      return;
    }
    
    const syncQueue = await this.getSyncQueue();
    
    if (syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`🔄 Processando ${syncQueue.length} itens da fila de sincronização...`);

    let successCount = 0;
    let errorCount = 0;

    // Ordena por timestamp para processar na ordem correta
    const sortedQueue = syncQueue.sort((a, b) => a.timestamp - b.timestamp);

    for (const item of sortedQueue) {
      try {
        // Verifica se já tentou muitas vezes
        if (item.retries >= 3) {
          console.warn(`⚠️ Item ${item.id} excedeu limite de tentativas, removendo da fila`);
          await this.removeSyncItem(item.id);
          errorCount++;
          continue;
        }

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
        successCount++;
        
        console.log(`✅ Item ${item.id} sincronizado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar item ${item.id}:`, error);
        
        // Incrementa contador de tentativas
        await this.updateSyncItemRetries(item.id, item.retries + 1);
        errorCount++;
      }
    }

    console.log(`🔄 Sincronização concluída: ${successCount} sucessos, ${errorCount} erros`);
    
    if (successCount > 0) {
      await this.setLastSyncTime();
    }
    
    this.syncInProgress = false;
  }

  private async syncServiceRecord(item: SyncQueue): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('ElectronAPI não disponível');
    }

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
    if (!window.electronAPI) {
      throw new Error('ElectronAPI não disponível');
    }

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
    if (!window.electronAPI) {
      throw new Error('ElectronAPI não disponível');
    }

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

  // Verifica se há itens pendentes na fila de sincronização
  async hasPendingSync(): Promise<boolean> {
    const syncQueue = await this.getSyncQueue();
    return syncQueue.length > 0;
  }

  // Verifica se precisa sincronizar (alias para hasPendingSync para compatibilidade)
  async needsSync(): Promise<boolean> {
    return await this.hasPendingSync();
  }

  // Alias para processSyncQueue para compatibilidade
  async syncWithServer(): Promise<void> {
    return await this.processSyncQueue();
  }

  // Método para verificar status da sincronização
  async getSyncStatus(): Promise<{
    lastSync: number | null;
    pendingItems: number;
    isOnline: boolean;
  }> {
    const lastSync = await this.getLastSyncTime();
    const syncQueue = await this.getSyncQueue();
    const isOnline = navigator.onLine && !!window.electronAPI;
    
    return {
      lastSync,
      pendingItems: syncQueue.length,
      isOnline
    };
  }

  // Cleanup quando o serviço é destruído
  destroy(): void {
    this.stopAutoSync();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const cacheService = new CacheService();