import { ServiceRecord, Attachment } from '../types';

// Function to check if the app is online
export const isOnline = (): boolean => {
  return window.electronAPI.isOnline();
};

// Get offline service records
export const getOfflineServiceRecords = async (): Promise<ServiceRecord[]> => {
  return await window.electronAPI.getOfflineData('serviceRecords');
};

// Save a service record for offline use
export const saveOfflineServiceRecord = async (record: ServiceRecord): Promise<void> => {
  const offlineRecords = await getOfflineServiceRecords();
  
  // Check if record already exists (for updates)
  const index = offlineRecords.findIndex(r => r.id === record.id);
  
  if (index >= 0) {
    offlineRecords[index] = record;
  } else {
    offlineRecords.push(record);
  }
  
  await window.electronAPI.saveOfflineData('serviceRecords', offlineRecords);
};

// Get offline attachments
export const getOfflineAttachments = async (): Promise<Attachment[]> => {
  return await window.electronAPI.getOfflineData('attachments');
};

// Save an attachment for offline use
export const saveOfflineAttachment = async (attachment: Attachment): Promise<void> => {
  const offlineAttachments = await getOfflineAttachments();
  
  // Check if attachment already exists (for updates)
  const index = offlineAttachments.findIndex(a => a.id === attachment.id);
  
  if (index >= 0) {
    offlineAttachments[index] = attachment;
  } else {
    offlineAttachments.push(attachment);
  }
  
  await window.electronAPI.saveOfflineData('attachments', offlineAttachments);
};

// Function to sync offline data when online
export const syncOfflineData = async (
  syncFunction: (data: any[]) => Promise<void>
): Promise<boolean> => {
  if (!isOnline()) {
    return false;
  }
  
  try {
    const offlineServiceRecords = await getOfflineServiceRecords();
    if (offlineServiceRecords.length > 0) {
      await syncFunction(offlineServiceRecords);
      // Clear synced data
      await window.electronAPI.saveOfflineData('serviceRecords', []);
    }
    return true;
  } catch (error) {
    console.error('Failed to sync offline data:', error);
    return false;
  }
};