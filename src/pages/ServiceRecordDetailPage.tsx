import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  getServiceRecordById, 
  deleteServiceRecord 
} from '../services/serviceRecordService';
import { downloadAttachment, getAttachments, deleteAttachment } from '../services/attachmentService';
import { ServiceRecord, Attachment, AdditionalCost } from '../types';
import { ChevronLeft, Edit, Trash2, FileIcon, Download, Calendar, User, MapPin, PenTool as Tool, DollarSign, Clipboard, Check, X, AlertCircle, Clock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export const ServiceRecordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/service-records');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const serviceRecord = await getServiceRecordById(id);
        
        if (!serviceRecord) {
          throw new Error('Atendimento não encontrado');
        }
        
        setRecord(serviceRecord);
        
        // Load attachments
        const recordAttachments = await getAttachments(id);
        setAttachments(recordAttachments);
      } catch (err) {
        console.error('Error loading service record:', err);
        setError('Erro ao carregar os dados do atendimento');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleteError(null);
    setShowDeleteConfirm(false);
    try {
      setDeleting(true);
      const success = await deleteServiceRecord(id);
      if (success) {
        navigate('/service-records');
      } else {
        setDeleteError('Erro ao excluir o atendimento');
      }
    } catch (err) {
      console.error('Error deleting service record:', err);
      setDeleteError('Erro ao excluir o atendimento');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    setAttachmentError(null);
    try {
      const success = await deleteAttachment(attachmentToDelete);
      if (success) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete));
      } else {
        setAttachmentError('Erro ao excluir o anexo');
      }
    } catch (err) {
      console.error('Error deleting attachment:', err);
      setAttachmentError('Erro ao excluir o anexo');
    } finally {
      setAttachmentToDelete(null);
    }
  };

  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      // Chama o IPC para buscar o buffer do anexo
      const result = await window.electronAPI.getAttachmentFile(attachmentId);
      if (result && result.buffer) {
        // Cria um blob e faz o download
        const blob = new Blob([new Uint8Array(result.buffer)], { type: result.mimetype || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Arquivo não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
      alert('Erro ao baixar anexo.');
    }
  };

  // Função para visualizar anexo diretamente
  const handleViewAttachment = async (attachmentId: string, filename: string) => {
    try {
      // @ts-ignore
      const result = await window.electronAPI.getAttachmentFile(attachmentId);
      if (result && result.buffer) {
        const blob = new Blob([new Uint8Array(result.buffer)], { type: result.mimetype || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Opcional: window.URL.revokeObjectURL(url) pode ser chamado depois, mas só após o usuário fechar a aba
      } else {
        alert('Arquivo não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao visualizar anexo:', error);
      alert('Erro ao visualizar anexo.');
    }
  };

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

  if (error || !record) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error || 'Atendimento não encontrado'}
        <Button
          className="mt-2"
          onClick={() => navigate('/service-records')}
        >
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mensagem de erro ao excluir atendimento */}
      {deleteError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {deleteError}
        </div>
      )}

      {/* Mensagem de erro ao excluir anexo */}
      {attachmentError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {attachmentError}
        </div>
      )}

      {/* Modal de confirmação de exclusão de atendimento */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirmar exclusão</h2>
            <p className="mb-4">Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
              <Button variant="destructive" isLoading={deleting} onClick={handleDelete}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão de anexo */}
      {attachmentToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirmar exclusão</h2>
            <p className="mb-4">Tem certeza que deseja excluir este anexo? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAttachmentToDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteAttachment}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Atendimento {record.orderNumber}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link to={`/service-records/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
            isLoading={deleting}
          >
            {!deleting && <Trash2 className="mr-2 h-4 w-4" />}
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Equipamento</h3>
                  <p className="mt-1 text-lg">{record.equipment}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Chassi / Placa</h3>
                  <p className="mt-1 text-lg">{record.chassis_plate || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                  <p className="mt-1 text-lg">{record.client}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Fabricação</h3>
                  <p className="mt-1 text-lg">
                    {record.manufacturing_date
                      ? record.manufacturing_date.length >= 10
                        ? record.manufacturing_date.slice(8, 10) + '/' + record.manufacturing_date.slice(5, 7) + '/' + record.manufacturing_date.slice(0, 4)
                        : record.manufacturing_date
                      : '—'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Assistência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Abertura</h3>
                    <p className="mt-1">
                      {new Date(record.call_opening_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Técnico</h3>
                    <p className="mt-1">{record.technician}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tool className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tipo de Assistência</h3>
                    <p className="mt-1">{record.assistance_type}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Local da Assistência</h3>
                    <p className="mt-1">{record.assistance_location || '—'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contato</h3>
                    <p className="mt-1">{record.contact_person || '—'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Problema Apresentado</h3>
                    <p className="mt-1">{record.reported_issue}</p>
                  </div>
                </div>
              </div>
              
              {record.observations && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500">Observações</h3>
                  <p className="mt-2 whitespace-pre-line">{record.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Atendimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data do Atendimento</h3>
                    <p className="mt-1">
                      {record.service_date
                        ? new Date(record.service_date).toLocaleDateString('pt-BR')
                        : '—'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Técnico Responsável</h3>
                    <p className="mt-1">{record.responsible_technician || '—'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custo Peça/Mão de Obra</h3>
                    <p className="mt-1">
                      {record.part_labor_cost
                        ? `R$ ${record.part_labor_cost.toFixed(2).replace('.', ',')}`
                        : 'R$ 0,00'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custo Viagem/Frete</h3>
                    <p className="mt-1">
                      {record.travel_freight_cost
                        ? `R$ ${record.travel_freight_cost.toFixed(2).replace('.', ',')}`
                        : 'R$ 0,00'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custo Total</h3>
                    <p className="mt-1 text-lg font-semibold text-blue-600">
                      {(() => {
                        const baseCost = (record.part_labor_cost || 0) + (record.travel_freight_cost || 0);
                        const additionalCost = record.additional_costs ? 
                          record.additional_costs.reduce((sum, cost) => sum + cost.amount, 0) : 0;
                        const total = baseCost + additionalCost;
                        return `R$ ${total.toFixed(2).replace('.', ',')}`;
                      })()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clipboard className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Devolução de Peça</h3>
                    <p className="mt-1">{record.part_return || '—'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  {record.supplier_warranty ? (
                    <Check className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                  ) : (
                    <X className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Garantia do Fornecedor</h3>
                    <p className="mt-1">{record.supplier_warranty ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              </div>

              {/* Custos Adicionais */}
              {record.additional_costs && record.additional_costs.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Custos Adicionais</h3>
                  <div className="space-y-2">
                    {record.additional_costs.map((cost: AdditionalCost) => (
                      <div key={cost.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{cost.description}</span>
                        <span className="text-sm font-medium">
                          R$ {cost.amount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded font-medium">
                      <span className="text-sm">Total Custos Adicionais:</span>
                      <span className="text-sm">
                        R$ {record.additional_costs.reduce((sum, cost) => sum + cost.amount, 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {record.technical_solution && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500">Solução Técnica</h3>
                  <p className="mt-2 whitespace-pre-line">{record.technical_solution}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className={`p-3 rounded-full ${
                  record.service_date ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {record.service_date ? (
                    <Check className="h-6 w-6 text-green-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                <p className="mt-2 font-medium">
                  {record.service_date ? 'Concluído' : 'Pendente'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {record.service_date
                    ? `Atendido em ${new Date(record.service_date).toLocaleDateString('pt-BR')}`
                    : 'Aguardando atendimento'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fornecedor</h3>
                  <p className="mt-1">{record.supplier || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Peça</h3>
                  <p className="mt-1">{record.part || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Criação</h3>
                  <p className="mt-1">
                    {new Date(record.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Última Atualização</h3>
                  <p className="mt-1">
                    {new Date(record.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length > 0 ? (
                <ul className="space-y-2">
                  {attachments.map((attachment) => (
                    <li key={attachment.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <FileIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm truncate max-w-[150px]">{attachment.filename}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewAttachment(attachment.id, attachment.filename)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadAttachment(attachment.id, attachment.filename)}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setAttachmentToDelete(attachment.id)}
                          className="text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  Nenhum anexo disponível
                </p>
              )}
              
              <div className="mt-4">
                <Link to={`/service-records/${id}/edit`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Adicionar Anexos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};