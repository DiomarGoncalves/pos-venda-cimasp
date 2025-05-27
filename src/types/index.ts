// Type definitions for the application

// Electron API exposed via preload script
export interface ElectronAPI {
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, value: any) => Promise<boolean>;
  getOfflineData: (key: string) => Promise<any[]>;
  saveOfflineData: (key: string, data: any[]) => Promise<boolean>;
  appVersion: () => Promise<string>;
  isOnline: () => boolean;
}

// Add ElectronAPI to the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// User model
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'technician';
  createdAt: string;
}

// Technical service record
export interface ServiceRecord {
  id: string;
  orderNumber: string;
  equipment: string;
  chassisPlate: string;
  client: string;
  manufacturingDate: string;
  callOpeningDate: string;
  technician: string;
  assistanceType: 'CORTESIA' | 'ASSISTENCIA' | 'NÃO PROCEDE';
  assistanceLocation: string;
  contactPerson: string;
  phone: string;
  reportedIssue: 'ESTRUTURAL' | 'ELETRICA' | 'HIDRAULICA' | 'ELETRICA/HIDRAULICA' | 'ELETRICA/ESTRUTURAL' | 'HIDRAULICA/ESTRUTURAL' | 'ELETRICA/HIDRAULICA/ESTRUTURAL' | 'IMPLEMENTAÇÃO/ADEQUAÇÃO/ENTRE EIXO';
  supplier: string;
  part: string;
  observations: string;
  serviceDate: string;
  responsibleTechnician: string;
  partLaborCost: number;
  travelFreightCost: number;
  partReturn: string;
  supplierWarranty: boolean;
  technicalSolution: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Attachment model
export interface Attachment {
  id: string;
  serviceRecordId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

// API configuration
export interface ApiConfig {
  url: string;
  apiKey: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}