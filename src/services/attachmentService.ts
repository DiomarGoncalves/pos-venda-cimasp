import { Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const uploadAttachment = async (serviceRecordId: string, file: File): Promise<Attachment | null> => {
  const arrayBuffer = await file.arrayBuffer();

  const attachmentData = {
    service_record_id: serviceRecordId,
    filename: file.name,
    mimetype: file.type,
    size: file.size,
    buffer: Array.from(new Uint8Array(arrayBuffer)),
  };

  const newAttachment: Attachment = {
    id: uuidv4(),
    serviceRecordId,
    filename: file.name,
    fileType: file.type,
    fileSize: file.size,
    url: '',
    createdAt: new Date().toISOString(),
  };

  await window.electronAPI.addAttachment(attachmentData);
  return newAttachment;
};

export const getAttachments = async (serviceRecordId: string): Promise<Attachment[]> => {
  return await window.electronAPI.getAttachments(serviceRecordId);
};

export const deleteAttachment = async (id: string): Promise<boolean> => {
  return await window.electronAPI.deleteAttachment(id);
};

export const openAttachment = async (url: string) => {
  if (!url) return;
  window.open(url, '_blank');
};

export const downloadAttachment = async (attachmentId: string, filename: string) => {
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
  }
};