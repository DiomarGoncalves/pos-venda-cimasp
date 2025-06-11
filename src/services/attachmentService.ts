import { Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const uploadAttachment = async (
  serviceRecordId: string,
  file: File
): Promise<Attachment | null> => {
  try {
    const fileId = uuidv4();
    const arrayBuffer = await file.arrayBuffer();

    // Salva no banco via IPC, incluindo o buffer do arquivo
    await window.electronAPI.addAttachment({
      service_record_id: serviceRecordId,
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      uploaded_by: null, // ajuste conforme necessário
      buffer: Array.from(new Uint8Array(arrayBuffer)), // envia o conteúdo do arquivo
    });

    const newAttachment: Attachment = {
      id: fileId,
      serviceRecordId,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      url: '', // não há url local, pode ser preenchido com id ou vazio
      createdAt: new Date().toISOString(),
    };

    return newAttachment;
  } catch (error) {
    console.error('Upload attachment error:', error);
    return null;
  }
};

export const getAttachments = async (serviceRecordId: string): Promise<Attachment[]> => {
  try {
    const attachments = await window.electronAPI.getAttachments(serviceRecordId);
    return attachments || [];
  } catch (error) {
    console.error('Get attachments error:', error);
    return [];
  }
};

export const deleteAttachment = async (id: string): Promise<boolean> => {
  try {
    await window.electronAPI.deleteAttachment(id);
    return true;
  } catch (error) {
    console.error('Delete attachment error:', error);
    return false;
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