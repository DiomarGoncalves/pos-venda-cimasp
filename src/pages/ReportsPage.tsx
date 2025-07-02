import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { getServiceRecords } from '../services/serviceRecordService';
import { downloadExcel, importFromExcel } from '../services/exportService';
import { ServiceRecord } from '../types';
import { 
  FileDown, 
  FilterIcon, 
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Função utilitária para formatar valores monetários
function formatCurrencyBR(value: number | undefined | null) {
  if (typeof value !== 'number') value = Number(value) || 0;
  // Garante separador de milhar e centavos no padrão brasileiro
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

// Função para exportar lista resumida (apenas colunas visíveis)
async function exportResumoExcel(records: ServiceRecord[], filename = 'lista-resumida.xlsx') {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Lista Resumida');

  worksheet.columns = [
    { header: 'OF', key: 'order_number', width: 12 },
    { header: 'Cliente', key: 'client', width: 25 },
    { header: 'Equipamento', key: 'equipment', width: 18 },
    { header: 'Data Abertura', key: 'call_opening_date', width: 16 },
    { header: 'Técnico', key: 'technician', width: 18 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Custos', key: 'custos', width: 16 },
  ];

  // Header style
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  records.forEach(record => {
    const custos = (record.part_labor_cost || 0) + (record.travel_freight_cost || 0);
    worksheet.addRow({
      order_number: record.order_number,
      client: record.client,
      equipment: record.equipment,
      call_opening_date: record.call_opening_date && record.call_opening_date.length >= 10
        ? (() => {
            const [year, month, day] = record.call_opening_date.slice(0, 10).split('-');
            return `${day}/${month}/${year}`;
          })()
        : record.call_opening_date || '',
      technician: record.technician,
      status: record.service_date ? 'Concluído' : 'Pendente',
      custos: formatCurrencyBR(custos),
    });
  });

  // Borders
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

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ReportsPage: React.FC = () => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [client, setClient] = useState('');
  const [technician, setTechnician] = useState('');
  const [assistanceType, setAssistanceType] = useState('');
  const [status, setStatus] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalRecords: 0,
    pendingRecords: 0,
    completedRecords: 0,
    totalCost: 0,
    averageCost: 0,
  });

  // Altere o carregamento inicial para ordenar por data de abertura (mais recente primeiro)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let data = await getServiceRecords();
        // Ordena por call_opening_date decrescente (mais recente primeiro)
        data = data.sort((a, b) => {
          const dateA = new Date(a.call_opening_date).getTime();
          const dateB = new Date(b.call_opening_date).getTime();
          return dateB - dateA;
        });
        setRecords(data);
        setFilteredRecords(data);
        calculateStats(data);
      } catch (err) {
        console.error('Error loading service records:', err);
        setError('Falha ao carregar os dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateStats = (data: ServiceRecord[]) => {
    const pendingRecords = data.filter(r => !r.service_date).length;
    const completedRecords = data.filter(r => r.service_date).length;

    const totalCost = data.reduce((sum, record) => {
      return sum + (record.part_labor_cost || 0) + (record.travel_freight_cost || 0);
    }, 0);
    
    const averageCost = data.length > 0 ? totalCost / data.length : 0;
    
    setStats({
      totalRecords: data.length,
      pendingRecords,
      completedRecords,
      totalCost,
      averageCost,
    });
  };

  const applyFilters = () => {
    let filtered = [...records];
    
    if (dateFrom) {
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.call_opening_date);
        const fromDate = new Date(dateFrom);
        return recordDate >= fromDate;
      });
    }
    
    if (dateTo) {
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.call_opening_date);
        const toDate = new Date(dateTo);
        // Set time to end of day
        toDate.setHours(23, 59, 59, 999);
        return recordDate <= toDate;
      });
    }
    
    if (client) {
      filtered = filtered.filter(r => 
        r.client.toLowerCase().includes(client.toLowerCase())
      );
    }
    
    if (technician) {
      filtered = filtered.filter(r => 
        r.technician.toLowerCase().includes(technician.toLowerCase())
      );
    }
    
    if (assistanceType) {
      filtered = filtered.filter(r => r.assistanceType === assistanceType);
    }
    
    if (status) {
      if (status === 'pending') {
        filtered = filtered.filter(r => !r.serviceDate);
      } else if (status === 'completed') {
        filtered = filtered.filter(r => !!r.serviceDate);
      }
    }
    
    // Ordena novamente após filtrar
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.call_opening_date).getTime();
      const dateB = new Date(b.call_opening_date).getTime();
      return dateB - dateA;
    });
    setFilteredRecords(filtered);
    calculateStats(filtered);
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setClient('');
    setTechnician('');
    setAssistanceType('');
    setStatus('');
    setFilteredRecords(records);
    calculateStats(records);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadExcel(
        filteredRecords, 
        `relatorio-atendimentos-${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Erro ao exportar para Excel. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Arquivo selecionado para importação:', e.target.files?.[0]);
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const imported = await importFromExcel(file);
      setImportSuccess(`${imported.length} registros importados com sucesso!`);
      // Atualiza a lista
      const data = await getServiceRecords();
      setRecords(data);
      setFilteredRecords(data);
      calculateStats(data);
    } catch (err: any) {
      setImportError('Erro ao importar planilha: ' + (err?.message || ''));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // Função para exportar a página (exceto menu lateral e filtros) para PDF
  const handleExportPDF = async () => {
    const mainContent = document.querySelector('.space-y-6');
    if (!mainContent) {
      alert('Conteúdo não encontrado para exportação.');
      return;
    }
    const sidebar = document.querySelector('.app-sidebar') as HTMLElement | null;
    if (sidebar) sidebar.style.display = 'none';

    // Esconde a seção de filtros temporariamente
    const filterCard = Array.from(mainContent.children).find(
      (el) =>
        el.querySelector &&
        el.querySelector('input[type="date"]') // identifica pelo input de data
    ) as HTMLElement | undefined;
    if (filterCard) filterCard.style.display = 'none';

    // Captura a tela visível (primeira página)
    const canvasMain = await html2canvas(mainContent as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fff'
    });
    const imgDataMain = canvasMain.toDataURL('image/png');

    // Agora captura só a tabela (para as próximas páginas, se necessário)
    const tableCard = mainContent.querySelector('table');
    let tablePages: string[] = [];
    if (tableCard) {
      // Mostra só a tabela para capturar o restante (caso a tabela seja longa)
      // Cria um clone da tabela para evitar scroll e cortes
      const tableClone = tableCard.cloneNode(true) as HTMLElement;
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.background = '#fff';
      wrapper.appendChild(tableClone);
      document.body.appendChild(wrapper);

      // Divide a tabela em páginas se necessário
      const pageHeightPx = 1122; // Aproximadamente 1122px para A4 em 96dpi
      let scrollTop = 0;
      let totalHeight = wrapper.offsetHeight;
      while (scrollTop < totalHeight) {
        wrapper.scrollTop = scrollTop;
        const canvasTable = await html2canvas(wrapper, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#fff',
          height: pageHeightPx,
          y: scrollTop
        });
        tablePages.push(canvasTable.toDataURL('image/png'));
        scrollTop += pageHeightPx;
      }
      document.body.removeChild(wrapper);
    }

    // Monta o PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Primeira página: tela visível (sem filtros)
    const imgPropsMain = new window.Image();
    imgPropsMain.src = imgDataMain;
    await new Promise((resolve) => (imgPropsMain.onload = resolve));
    const imgWidthMain = pageWidth;
    const imgHeightMain = (imgPropsMain.height * imgWidthMain) / imgPropsMain.width;
    pdf.addImage(imgDataMain, 'PNG', 0, 0, imgWidthMain, imgHeightMain > pageHeight ? pageHeight : imgHeightMain);

    // Demais páginas: tabela (caso necessário)
    for (let i = 1; i < tablePages.length; i++) {
      pdf.addPage();
      const imgProps = new window.Image();
      imgProps.src = tablePages[i];
      await new Promise((resolve) => (imgProps.onload = resolve));
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(tablePages[i], 'PNG', 0, 0, imgWidth, imgHeight > pageHeight ? pageHeight : imgHeight);
    }

    pdf.save(`relatorio-atendimentos-${new Date().toISOString().split('T')[0]}.pdf`);

    // Restaura filtros e sidebar
    if (filterCard) filterCard.style.display = '';
    if (sidebar) sidebar.style.display = '';
  };

  // Get unique clients and technicians for filters
  const clients = [...new Set(records.map(r => r.client))];
  const technicians = [...new Set(records.map(r => r.technician))];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleExport}
            isLoading={exporting}
            disabled={filteredRecords.length === 0}
          >
            {!exporting && <FileDown className="mr-2 h-4 w-4" />}
            Exportar para Excel
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={filteredRecords.length === 0}
            className="bg-blue-700 hover:bg-blue-800 text-white"
            type="button"
          >
            Exportar para PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
          <Button
            type="button"
            variant="outline"
            isLoading={importing}
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            Importar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
              <CardDescription>No período selecionado</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500">
                <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1"></span>
                Pendentes: {stats.pendingRecords}
              </div>
              <div className="text-xs text-gray-500">
                <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-1"></span>
                Concluídos: {stats.completedRecords}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
              <CardDescription>Peças e serviços</CardDescription>
            </div>
            <PieChart className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyBR(stats.totalCost)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Custo médio: {formatCurrencyBR(stats.averageCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Período do Relatório</CardTitle>
              <CardDescription>Intervalo de datas</CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {dateFrom && dateTo ? (
                `${new Date(dateFrom).toLocaleDateString('pt-BR')} até ${new Date(dateTo).toLocaleDateString('pt-BR')}`
              ) : dateFrom ? (
                `A partir de ${new Date(dateFrom).toLocaleDateString('pt-BR')}`
              ) : dateTo ? (
                `Até ${new Date(dateTo).toLocaleDateString('pt-BR')}`
              ) : (
                'Todos os registros'
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {filteredRecords.length} registros encontrados
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Data Inicial"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            
            <Input
              label="Data Final"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            
            <Select
              label="Cliente"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              options={clients.map(c => ({ value: c, label: c }))}
            />
            
            <Select
              label="Técnico"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              options={technicians.map(t => ({ value: t, label: t }))}
            />
            
            <Select
              label="Tipo de Assistência"
              value={assistanceType}
              onChange={(e) => setAssistanceType(e.target.value)}
              options={[
                { value: 'CORTESIA', label: 'Cortesia' },
                { value: 'ASSISTENCIA', label: 'Assistência' },
                { value: 'NÃO PROCEDE', label: 'Não Procede' },
              ]}
            />
            
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'pending', label: 'Pendentes' },
                { value: 'completed', label: 'Concluídos' },
              ]}
            />
          </div>
          
          <div className="flex justify-end mt-6 space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
            <Button
              type="button"
              onClick={applyFilters}
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipamento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Abertura
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.equipment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Exibe a data manualmente, sem new Date para evitar problemas de timezone */}
                        {record.call_opening_date && record.call_opening_date.length >= 10
                          ? (() => {
                              const [year, month, day] = record.call_opening_date.slice(0, 10).split('-');
                              return `${day}/${month}/${year}`;
                            })()
                          : record.call_opening_date || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.technician}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.service_date
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {record.service_date ? 'Concluído' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrencyBR(
                          (record.part_labor_cost || 0) + (record.travel_freight_cost || 0)
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      Nenhum registro encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};