import ExcelJS from 'exceljs';
import { ServiceRecord } from '../types';
import { createServiceRecord, getUsers } from './serviceRecordService';

export const exportToExcel = async (
  records: ServiceRecord[],
  filename = 'service-records-export.xlsx'
): Promise<Blob> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Atendimentos Técnicos');

  // Define columns based on the spreadsheet template
  worksheet.columns = [
    { header: 'OF', key: 'orderNumber', width: 15 },
    { header: 'EQUIPAMENTO', key: 'equipment', width: 25 },
    { header: 'CHASSI / PLACA', key: 'chassisPlate', width: 20 },
    { header: 'CLIENTE', key: 'client', width: 30 },
    { header: 'DATA FABRICAÇÃO', key: 'manufacturingDate', width: 18 },
    { header: 'DATA ABERTURA CHAMADO', key: 'callOpeningDate', width: 25 },
    { header: 'TECNICO', key: 'technician', width: 25 },
    { header: 'TIPO ASSISTENCIA', key: 'assistanceType', width: 20 },
    { header: 'LOCAL ASSISTÊNCIA', key: 'assistanceLocation', width: 30 },
    { header: 'CONTATO', key: 'contactPerson', width: 25 },
    { header: 'TELEFONE', key: 'phone', width: 20 },
    { header: 'PROBLEMA APRESENTADO', key: 'reportedIssue', width: 35 },
    { header: 'FORNECEDOR', key: 'supplier', width: 25 },
    { header: 'PEÇA', key: 'part', width: 25 },
    { header: 'OBSERVAÇÕES', key: 'observations', width: 40 },
    { header: 'DATA ATENDIMENTO', key: 'serviceDate', width: 18 },
    { header: 'TÉCNICO RESPONSÁVEL', key: 'responsibleTechnician', width: 25 },
    { header: 'CUSTO PEÇA/MÃO DE OBRA', key: 'partLaborCost', width: 25 },
    { header: 'CUSTO VIAGEM / FRETE', key: 'travelFreightCost', width: 25 },
    { header: 'DEVOLUÇÃO PEÇA', key: 'partReturn', width: 20 },
    { header: 'GARANTIA FORNECEDOR', key: 'supplierWarranty', width: 20 },
    { header: 'SOLUÇÃO TÉCNICA', key: 'technicalSolution', width: 40 }
  ];

  // Add header row with styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }, // Primary blue color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  records.forEach((record) => {
    worksheet.addRow({
      orderNumber: record.order_number,
      equipment: record.equipment,
      chassisPlate: record.chassis_plate,
      client: record.client,
      manufacturingDate: record.manufacturing_date,
      callOpeningDate: record.call_opening_date,
      technician: record.technician,
      assistanceType: record.assistance_type,
      assistanceLocation: record.assistance_location,
      contactPerson: record.contact_person,
      phone: record.phone,
      reportedIssue: record.reported_issue,
      supplier: record.supplier,
      part: record.part,
      observations: record.observations,
      serviceDate: record.service_date,
      responsibleTechnician: record.responsible_technician,
      partLaborCost: record.part_labor_cost,
      travelFreightCost: record.travel_freight_cost,
      partReturn: record.part_return,
      supplierWarranty: record.supplier_warranty ? 'SIM' : 'NÃO',
      technicalSolution: record.technical_solution
    });
  });

  // Apply borders to all cells
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Generate the Excel file as a buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Convert buffer to Blob
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
};

export const downloadExcel = async (records: ServiceRecord[], filename: string): Promise<void> => {
  const blob = await exportToExcel(records, filename);
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  // Clean up
  URL.revokeObjectURL(url);
};

export const importFromExcel = async (file: File): Promise<ServiceRecord[]> => {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.getWorksheet('Atendimentos Técnicos');
  if (!worksheet) throw new Error('Planilha "Atendimentos Técnicos" não encontrada.');

  // Mapeamento das colunas para os campos snake_case do ServiceRecord
  const colMap: Record<string, string> = {
    'OF': 'order_number',
    'EQUIPAMENTO': 'equipment',
    'CHASSI / PLACA': 'chassis_plate',
    'CLIENTE': 'client',
    'DATA FABRICAÇÃO': 'manufacturing_date',
    'DATA ABERTURA CHAMADO': 'call_opening_date',
    'TECNICO': 'technician',
    'TIPO ASSISTENCIA': 'assistance_type',
    'LOCAL ASSISTÊNCIA': 'assistance_location',
    'CONTATO': 'contact_person',
    'TELEFONE': 'phone',
    'PROBLEMA APRESENTADO': 'reported_issue',
    'FORNECEDOR': 'supplier',
    'PEÇA': 'part',
    'OBSERVAÇÕES': 'observations',
    'DATA ATENDIMENTO': 'service_date',
    'TÉCNICO RESPONSÁVEL': 'responsible_technician',
    'CUSTO PEÇA/MÃO DE OBRA': 'part_labor_cost',
    'CUSTO VIAGEM / FRETE': 'travel_freight_cost',
    'DEVOLUÇÃO PEÇA': 'part_return',
    'GARANTIA FORNECEDOR': 'supplier_warranty',
    'SOLUÇÃO TÉCNICA': 'technical_solution'
  };

  // Pega o header da primeira linha
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell) => headers.push(cell.text));

  const importedRecords: ServiceRecord[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // pula header

    const rowData: any = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      const key = colMap[header];
      if (!key) return;
      let value = cell.value;

      // Conversão de tipos
      if (key === 'part_labor_cost' || key === 'travel_freight_cost') {
        value = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
      }
      if (key === 'supplier_warranty') {
        value = (cell.text || '').toUpperCase() === 'SIM';
      }
      rowData[key] = value ?? '';
    });

    importedRecords.push(rowData as ServiceRecord);
  });

  // Salva cada registro importado
  // Busca todos os usuários para associar created_by
  const users = await window.electronAPI.getUsers();

  const savedRecords: ServiceRecord[] = [];
  for (const rec of importedRecords) {
    const { id, createdAt, updatedAt, created_at, updated_at, ...data } = rec as any;

    // Corrigir o campo supplier_warranty para ser 0/1
    if (typeof data.supplier_warranty === 'boolean') {
      data.supplier_warranty = data.supplier_warranty ? 1 : 0;
    }

    // Definir created_by automaticamente com base no dia do registro (call_opening_date)
    let createdBy = null;
    if (data.call_opening_date) {
      // Busca usuário criado no mesmo dia (YYYY-MM-DD)
      const dateStr = data.call_opening_date.split('T')[0];
      const user = users.find(u => (u.created_at || '').startsWith(dateStr));
      if (user) {
        createdBy = user.id;
      }
    }
    data.created_by = createdBy;

    const saved = await createServiceRecord(data);
    savedRecords.push(saved);
  }
  return savedRecords;
};