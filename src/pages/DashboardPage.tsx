import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  Users, 
  ClipboardList, 
  Clock, 
  CheckCircle,
  Calendar
} from 'lucide-react';
import { getServiceRecords } from '../services/serviceRecordService';
import { ServiceRecord } from '../types';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const DashboardPage: React.FC = () => {
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const records = await getServiceRecords();
        setServiceRecords(records);
      } catch (err) {
        console.error('Error loading service records:', err);
        setError('Falha ao carregar os dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate stats
  const totalRecords = serviceRecords.length;
  const pendingRecords = serviceRecords.filter(
    record => !record.service_date
  ).length;
  const completedRecords = totalRecords - pendingRecords;

  // Get recent records
  const recentRecords = [...serviceRecords]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error}
        <Button
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/service-records/new">
          <Button>Novo Atendimento</Button>
        </Link>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total de Atendimentos
              </CardTitle>
              <ClipboardList className="h-5 w-5 text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRecords}</div>
              <p className="text-xs text-gray-500 mt-1">
                Todos os atendimentos registrados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Atendimentos Pendentes
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRecords}</div>
              <p className="text-xs text-gray-500 mt-1">
                Aguardando atendimento
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Atendimentos Concluídos
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedRecords}</div>
              <p className="text-xs text-gray-500 mt-1">
                Atendimentos finalizados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Atendimentos do Mês
              </CardTitle>
              <Calendar className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serviceRecords.filter(r => {
                  const date = new Date(r.service_date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && 
                         date.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Registrados neste mês
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Atendimentos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentRecords.length > 0 ? (
                <div className="space-y-2">
                  {recentRecords.map((record) => (
                    <Link 
                      key={record.id} 
                      to={`/service-records/${record.id}`}
                      className="block"
                    >
                      <div className="p-3 rounded-md hover:bg-gray-50 transition-colors border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              {(record.orderNumber || record.order_number) + ' - ' + record.equipment}
                            </h3>
                            <p className="text-sm text-gray-600">{record.client}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs pxflex justify-between items-start-2 py-1 rounded-full ${
                              record.service_date 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {record.service_date ? 'Concluído' : 'Pendente'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {record.service_date
                                ? new Date(record.service_date.replace(' ', 'T')).toLocaleDateString('pt-BR')
                                : 'Data não informada'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum atendimento registrado ainda
                </div>
              )}
              
              <div className="mt-4 flex justify-center">
                <Link to="/service-records">
                  <Button variant="outline">Ver Todos os Atendimentos</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};