import { Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { cacheService } from './cacheService';

export const uploadAttachment = async (
  serviceRecordId: string,
  file: File
): Promise<Attachment | null> => {
  try {
    const fileId = uuidv4();
    const arrayBuffer = await file.arrayBuffer();

    const attachmentData = {
      service_record_id: serviceRecordId,
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      uploaded_by: null, // ajuste conforme necessário
      buffer: Array.from(new Uint8Array(arrayBuffer)), // envia o conteúdo do arquivo
    };

    const newAttachment: Attachment = {
      id: fileId,
      serviceRecordId,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      url: '',
      createdAt: new Date().toISOString(),
    };


    // SEMPRE tenta salvar no servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('💾 Salvando anexo no servidor...');
      const serverAttachment = await window.electronAPI.addAttachment(attachmentData);
      
      // Salva no cache após sucesso no servidor
      await cacheService.saveAttachment(newAttachment);
      console.log('✅ Anexo salvo no servidor e cache atualizado');
      
      return newAttachment;
    } else {
      throw new Error('Offline - salvando no cache');
    }
  } catch (error) {
    console.warn('⚠️ Falha no servidor, salvando no cache:', error);
    
    // Salva no cache como fallback
    await cacheService.saveAttachment(newAttachment);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'create',
      table: 'attachments',
      data: attachmentData
    });
    
    console.log('📱 Anexo salvo no cache - será sincronizado quando possível');
    return newAttachment;
  }
};

export const getAttachments = async (serviceRecordId: string): Promise<Attachment[]> => {
  try {
    // SEMPRE tenta buscar do servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('📡 Buscando anexos do servidor...');
      const serverAttachments = await window.electronAPI.getAttachments(serviceRecordId);
      
      // Atualiza o cache com os dados do servidor
      await cacheService.saveMultipleAttachments(serverAttachments);
      console.log('✅ Anexos obtidos do servidor e cache atualizado');
      
      return serverAttachments;
    } else {
      throw new Error('Offline - usando cache');
    }
  } catch (error) {
    console.warn('⚠️ Falha no servidor, usando cache:', error);
    
    // Usa cache como fallback
    const attachments = await cacheService.getAttachments(serviceRecordId);
    console.log('📱 Anexos obtidos do cache local');
    
    return attachments;
  }
};

export const deleteAttachment = async (id: string): Promise<boolean> => {
  try {
    // SEMPRE tenta deletar do servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('💾 Deletando anexo do servidor...');
      const success = await window.electronAPI.deleteAttachment(id);
      
      if (success) {
        // Remove do cache após sucesso no servidor
        await cacheService.deleteAttachment(id);
        console.log('✅ Anexo deletado do servidor e cache atualizado');
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
    await cacheService.deleteAttachment(id);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'delete',
      table: 'attachments',
      data: { id }
    });
    
    console.log('📱 Anexo marcado para exclusão - será sincronizado quando possível');
    return true;
  }
};

// Para abrir o anexo online:
export const openAttachment = async (url: string) => {
  try {
    if (!url) {
      console.error('Open attachment error: url está indefinido ou vazio');
      return;
    }
    window.open(url, '_blank');
  } catch (error) {
    console.error('Open attachment error:', error);
  }
};

export const downloadAttachment = async (attachmentId: string, filename: string) => {
  try {
    // @ts-ignore
    const result = await window.electronAPI.getAttachmentFile(attachmentId);
    if (result && result.buffer) {
      const blob = new Blob([new Uint8Array(result.buffer)], { type: result.mimetype || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } else {
      alert('Arquivo não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao baixar anexo:', error);
    alert('Erro ao baixar anexo.');
  }
};