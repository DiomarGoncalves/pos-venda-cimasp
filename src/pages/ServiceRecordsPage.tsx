import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { getServiceRecords } from '../services/serviceRecordService';
import { ServiceRecord } from '../types';
import { motion } from 'framer-motion';
import { Plus, Search, FileDown, Clock, CheckCircle } from 'lucide-react';
import { Select } from '../components/ui/Select';

export const ServiceRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getServiceRecords();
        setRecords(data);
        setFilteredRecords(data);
      } catch (err) {
        console.error('Error loading service records:', err);
        setError('Falha ao carregar os atendimentos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let result = records;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(record => {
        const hasServiceDate = !!record.serviceDate;
        return statusFilter === 'completed' ? hasServiceDate : !hasServiceDate;
      });
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(record => 
        record.orderNumber.toLowerCase().includes(term) ||
        record.client.toLowerCase().includes(term) ||
        record.equipment.toLowerCase().includes(term) ||
        record.chassisPlate.toLowerCase().includes(term)
      );
    }
    
    setFilteredRecords(result);
  }, [searchTerm, statusFilter, records]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Atendimentos Técnicos</h1>
        <Link to="/service-records/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Atendimento
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <Input
                placeholder="Buscar por OF, cliente, equipamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Todos os status' },
                { value: 'pending', label: 'Pendentes' },
                { value: 'completed', label: 'Concluídos' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OF / Equipamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Abertura
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Técnico
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <motion.tr 
                    key={record.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.order_number}</div>
                      <div className="text-sm text-gray-500">{record.equipment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.client}</div>
                      <div className="text-sm text-gray-500">{record.contact_person}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(record.callOpeningDate).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.service_date
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {record.service_date ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Concluído
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-1" />
                            Pendente
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.technician}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/service-records/${record.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Visualizar
                      </Link>
                      <Link 
                        to={`/service-records/${record.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? (
                      <>
                        Nenhum atendimento encontrado com os filtros aplicados.
                        <button 
                          className="ml-2 text-blue-600 hover:underline"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                        >
                          Limpar filtros
                        </button>
                      </>
                    ) : (
                      <>
                        Nenhum atendimento registrado ainda.
                        <Link 
                          to="/service-records/new"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          Criar novo atendimento
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};