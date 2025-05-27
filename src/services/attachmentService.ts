import { Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const uploadAttachment = async (
  serviceRecordId: string,
  file: File
): Promise<Attachment | null> => {
  try {
    const fileId = uuidv4();
    const filename = `${fileId}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    // Salva o arquivo fisicamente
    const filePath = await window.electronAPI.saveAttachmentFile({
      buffer: Array.from(new Uint8Array(arrayBuffer)),
      filename,
    });

    const newAttachment: Attachment = {
      id: fileId,
      serviceRecordId,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      url: filePath, // Caminho real do arquivo
      createdAt: new Date().toISOString(),
    };

    // Salva no banco via IPC
    await window.electronAPI.addAttachment({
      service_record_id: serviceRecordId,
      filename: file.name,
      url: filePath,
      mimetype: file.type,
      size: file.size,
      uploaded_by: null, // ajuste conforme necessário
    });

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

// Para abrir o anexo:
export const openAttachment = async (filePath: string) => {
  try {
    await window.electronAPI.openAttachmentFile(filePath);
  } catch (error) {
    console.error('Open attachment error:', error);
  }
};