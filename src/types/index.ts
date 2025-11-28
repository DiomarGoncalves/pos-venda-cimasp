// Type definitions for the application

// Electron API exposed via preload script
export interface ElectronAPI {
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, value: any) => Promise<boolean>;
  getOfflineData: (key: string) => Promise<any[]>;
  saveOfflineData: (key: string, data: any[]) => Promise<boolean>;
  appVersion: () => Promise<string>;
  isOnline: () => boolean;

  // Service Records
  getServiceRecords: (page?: number, limit?: number, search?: string) => Promise<{ records: ServiceRecord[], total: number, page: number, totalPages: number }>;
  addServiceRecord: (record: any) => Promise<ServiceRecord>;
  updateServiceRecord: (id: string, record: any) => Promise<boolean>;
  deleteServiceRecord: (id: string) => Promise<boolean>;

  // Users
  getUsers: () => Promise<User[]>;
  addUser: (user: any) => Promise<User>;

  // Attachments
  getAttachments: (serviceRecordId: string) => Promise<Attachment[]>;
  addAttachment: (attachment: any) => Promise<Attachment>;
  deleteAttachment: (id: string) => Promise<boolean>;
  getAttachmentFile: (attachmentId: string) => Promise<{ buffer: ArrayBuffer; mimetype: string; filename: string } | null>;

  // Import/Export
  importExcel: (filePath: string) => Promise<ServiceRecord[]>;

  // Update system
  onUpdateAvailable?: (callback: () => void) => void;
  onUpdateDownloaded?: (callback: () => void) => void;
  onDownloadProgress?: (callback: (event: any, progress: any) => void) => void;
  onUpdateError?: (callback: (event: any, error: string) => void) => void;
  checkForUpdates?: () => void;
  restartAppForUpdate?: () => void;
  installUpdateNow?: () => void;
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
  username: string;
  email?: string;
  name?: string;
  createdAt: string;
}

// Technical service record
export interface ServiceRecord {
  id: string;
  orderNumber?: string;
  order_number: string;
  equipment: string;
  chassisPlate?: string;
  chassis_plate?: string;
  client: string;
  manufacturingDate?: string;
  manufacturing_date?: string;
  callOpeningDate?: string;
  call_opening_date: string;
  technician: string;
  assistanceType?: 'CORTESIA' | 'ASSISTENCIA' | 'NÃO PROCEDE';
  assistance_type: 'CORTESIA' | 'ASSISTENCIA' | 'NÃO PROCEDE';
  assistanceLocation?: string;
  assistance_location?: string;
  contactPerson?: string;
  contact_person?: string;
  phone: string;
  reportedIssue?: 'ESTRUTURAL' | 'ELETRICA' | 'HIDRAULICA' | 'ELETRICA/HIDRAULICA' | 'ELETRICA/ESTRUTURAL' | 'HIDRAULICA/ESTRUTURAL' | 'ELETRICA/HIDRAULICA/ESTRUTURAL' | 'IMPLEMENTAÇÃO/ADEQUAÇÃO/ENTRE EIXO';
  reported_issue: 'ESTRUTURAL' | 'ELETRICA' | 'HIDRAULICA' | 'ELETRICA/HIDRAULICA' | 'ELETRICA/ESTRUTURAL' | 'HIDRAULICA/ESTRUTURAL' | 'ELETRICA/HIDRAULICA/ESTRUTURAL' | 'IMPLEMENTAÇÃO/ADEQUAÇÃO/ENTRE EIXO';
  supplier: string;
  part: string;
  observations: string;
  serviceDate?: string;
  service_date?: string;
  responsibleTechnician?: string;
  responsible_technician?: string;
  partLaborCost?: number;
  part_labor_cost?: number;
  travelFreightCost?: number;
  travel_freight_cost?: number;
  partReturn?: string;
  part_return?: string;
  supplierWarranty?: boolean;
  supplier_warranty?: boolean | number;
  technicalSolution?: string;
  technical_solution?: string;
  attachments?: Attachment[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  createdBy?: string;
  created_by?: string;
  additionalCosts?: AdditionalCost[];
}

// Additional cost model
export interface AdditionalCost {
  id: string;
  description: string;
  amount: number;
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