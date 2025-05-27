import ExcelJS from 'exceljs';
import { ServiceRecord } from '../types';

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
      orderNumber: record.orderNumber,
      equipment: record.equipment,
      chassisPlate: record.chassisPlate,
      client: record.client,
      manufacturingDate: record.manufacturingDate,
      callOpeningDate: record.callOpeningDate,
      technician: record.technician,
      assistanceType: record.assistanceType,
      assistanceLocation: record.assistanceLocation,
      contactPerson: record.contactPerson,
      phone: record.phone,
      reportedIssue: record.reportedIssue,
      supplier: record.supplier,
      part: record.part,
      observations: record.observations,
      serviceDate: record.serviceDate,
      responsibleTechnician: record.responsibleTechnician,
      partLaborCost: record.partLaborCost,
      travelFreightCost: record.travelFreightCost,
      partReturn: record.partReturn,
      supplierWarranty: record.supplierWarranty ? 'SIM' : 'NÃO',
      technicalSolution: record.technicalSolution
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