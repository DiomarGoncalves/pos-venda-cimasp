import React, { useState, useEffect } from 'react';
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
import { downloadExcel } from '../services/exportService';
import { ServiceRecord } from '../types';
import { 
  FileDown, 
  FilterIcon, 
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getServiceRecords();
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
    const pendingRecords = data.filter(r => !r.serviceDate).length;
    const completedRecords = data.filter(r => r.serviceDate).length;
    
    const totalCost = data.reduce((sum, record) => {
      return sum + (record.partLaborCost || 0) + (record.travelFreightCost || 0);
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
        const recordDate = new Date(r.callOpeningDate);
        const fromDate = new Date(dateFrom);
        return recordDate >= fromDate;
      });
    }
    
    if (dateTo) {
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.callOpeningDate);
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
        
        <Button 
          onClick={handleExport} 
          isLoading={exporting}
          disabled={filteredRecords.length === 0}
        >
          {!exporting && <FileDown className="mr-2 h-4 w-4" />}
          Exportar para Excel
        </Button>
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
              R$ {stats.totalCost.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Custo médio: R$ {stats.averageCost.toFixed(2).replace('.', ',')}
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

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
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
                        {record.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.equipment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.callOpeningDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.technician}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.serviceDate
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {record.serviceDate ? 'Concluído' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ {((record.partLaborCost || 0) + (record.travelFreightCost || 0)).toFixed(2).replace('.', ',')}
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