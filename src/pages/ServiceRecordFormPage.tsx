import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { ServiceRecord, AdditionalCost } from '../types';
import { 
  createServiceRecord, 
  getServiceRecordById, 
  updateServiceRecord 
} from '../services/serviceRecordService';
import { useAuth } from '../contexts/AuthContext';
import { FileUpload } from '../components/ui/FileUpload';
import { uploadAttachment } from '../services/attachmentService';
import { ChevronLeft, Save, Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ServiceRecordFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ServiceRecord>();

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      const loadServiceRecord = async () => {
        try {
          setLoading(true);
          const record = await getServiceRecordById(id);

          if (record) {
            // Ajusta manufacturingDate para formato YYYY-MM-DD
            let manufacturingDate = record.manufacturingDate ?? record.manufacturing_date ?? '';
            if (manufacturingDate && manufacturingDate.length > 10) {
              manufacturingDate = manufacturingDate.slice(0, 10);
            }
            
            // Carrega custos adicionais
            const costs = record.additional_costs || [];
            setAdditionalCosts(costs);
            
            reset({
              id: record.id,
              orderNumber: record.orderNumber ?? record.order_number ?? '',
              equipment: record.equipment ?? '',
              chassisPlate: record.chassisPlate ?? record.chassis_plate ?? '',
              client: record.client ?? '',
              manufacturingDate,
              callOpeningDate: record.callOpeningDate ?? record.call_opening_date ?? '',
              technician: record.technician ?? '',
              assistanceType: record.assistanceType ?? record.assistance_type ?? '',
              assistanceLocation: record.assistanceLocation ?? record.assistance_location ?? '',
              contactPerson: record.contactPerson ?? record.contact_person ?? '',
              phone: record.phone ?? '',
              reportedIssue: record.reportedIssue ?? record.reported_issue ?? '',
              supplier: record.supplier ?? '',
              part: record.part ?? '',
              observations: record.observations ?? '',
              serviceDate: record.serviceDate ?? record.service_date ?? '',
              responsibleTechnician: record.responsibleTechnician ?? record.responsible_technician ?? '',
              partLaborCost: record.partLaborCost ?? record.part_labor_cost ?? 0,
              travelFreightCost: record.travelFreightCost ?? record.travel_freight_cost ?? 0,
              partReturn: record.partReturn ?? record.part_return ?? '',
              supplierWarranty: record.supplierWarranty ?? record.supplier_warranty ?? false,
              technicalSolution: record.technicalSolution ?? record.technical_solution ?? '',
              createdBy: record.createdBy ?? record.created_by ?? '',
              createdAt: record.createdAt ?? record.created_at ?? '',
              updatedAt: record.updatedAt ?? record.updated_at ?? '',
            } as any);
          } else {
            navigate('/service-records', { replace: true });
          }
        } catch (error) {
          console.error('Error loading service record:', error);
          setSaveError('Erro ao carregar os dados do atendimento');
        } finally {
          setLoading(false);
        }
      };

      loadServiceRecord();
    } else {
      // Set default values for new record
      reset({
        callOpeningDate: new Date().toISOString().split('T')[0],
        technician: user?.name || '',
        createdBy: user?.id || '',
        manufacturingDate: '', // Garante campo vazio
        supplierWarranty: false, // Garante valor booleano padrão
      } as any);
    }
  }, [id, navigate, reset, setValue, user]);

  const onSubmit = async (data: ServiceRecord) => {
    try {
      setLoading(true);
      setSaveError(null);

      // Garante que manufacturingDate está no formato YYYY-MM-DD ou vazio
      let manufacturingDate = data.manufacturingDate || '';
      if (manufacturingDate && manufacturingDate.length > 10) {
        manufacturingDate = manufacturingDate.slice(0, 10);
      }

      let savedRecord: ServiceRecord | null;

      if (isEditing && id) {
        const { createdBy, ...updateData } = data;
        // Garante que supplierWarranty seja convertido para inteiro
        const processedData = {
          ...updateData,
          manufacturingDate,
          additional_costs: additionalCosts,
          supplier_warranty: updateData.supplierWarranty ? 1 : 0,
        };
        savedRecord = await updateServiceRecord(id, {
          ...processedData,
        } as ServiceRecord);
      } else {
        // Garante que supplierWarranty seja convertido para inteiro
        const processedData = {
          ...data,
          createdBy: user?.id || '',
          manufacturingDate,
          additional_costs: additionalCosts,
          supplier_warranty: data.supplierWarranty ? 1 : 0,
        };
        savedRecord = await createServiceRecord({
          ...processedData,
        });
      }

      if (!savedRecord) {
        throw new Error('Failed to save service record');
      }

      // Upload attachments if any
      if (selectedFiles.length > 0 && savedRecord.id) {
        await Promise.all(
          selectedFiles.map(file => uploadAttachment(savedRecord!.id, file))
        );
      }

      // Aguarda um pouco para garantir que o registro esteja disponível
      setTimeout(() => {
        navigate(`/service-records/${savedRecord.id}`);
      }, 500);
    } catch (error) {
      console.error('Error saving service record:', error);
      setSaveError('Erro ao salvar o atendimento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const addAdditionalCost = () => {
    const newCost: AdditionalCost = {
      id: uuidv4(),
      description: '',
      amount: 0
    };
    setAdditionalCosts([...additionalCosts, newCost]);
  };

  const removeAdditionalCost = (id: string) => {
    setAdditionalCosts(additionalCosts.filter(cost => cost.id !== id));
  };

  const updateAdditionalCost = (id: string, field: 'description' | 'amount', value: string | number) => {
    setAdditionalCosts(additionalCosts.map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    ));
  };

  const assistanceTypeOptions = [
    { value: 'CORTESIA', label: 'Cortesia' },
    { value: 'ASSISTENCIA', label: 'Assistência' },
    { value: 'NÃO PROCEDE', label: 'Não Procede' },
  ];

  const reportedIssueOptions = [
    { value: 'ESTRUTURAL', label: 'Estrutural' },
    { value: 'ELETRICA', label: 'Elétrica' },
    { value: 'HIDRAULICA', label: 'Hidráulica' },
    { value: 'ELETRICA/HIDRAULICA', label: 'Elétrica/Hidráulica' },
    { value: 'ELETRICA/ESTRUTURAL', label: 'Elétrica/Estrutural' },
    { value: 'HIDRAULICA/ESTRUTURAL', label: 'Hidráulica/Estrutural' },
    { value: 'ELETRICA/HIDRAULICA/ESTRUTURAL', label: 'Elétrica/Hidráulica/Estrutural' },
    { value: 'IMPLEMENTAÇÃO/ADEQUAÇÃO/ENTRE EIXO', label: 'Implementação/Adequação/Entre Eixo' },
  ];

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Ordem de Fabricação (OF)"
                  {...register('orderNumber', { required: 'Campo obrigatório' })}
                  error={errors.orderNumber?.message}
                />
                
                <Input
                  label="Equipamento"
                  {...register('equipment', { required: 'Campo obrigatório' })}
                  error={errors.equipment?.message}
                />
                
                <Input
                  label="Chassi / Placa"
                  {...register('chassisPlate')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Cliente"
                  {...register('client', { required: 'Campo obrigatório' })}
                  error={errors.client?.message}
                />
                
                <Input
                  label="Data de Fabricação"
                  type="date"
                  {...register('manufacturingDate')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Data de Abertura do Chamado"
                  type="date"
                  {...register('callOpeningDate', { required: 'Campo obrigatório' })}
                  error={errors.callOpeningDate?.message}
                />
                
                <Input
                  label="Técnico"
                  {...register('technician', { required: 'Campo obrigatório' })}
                  error={errors.technician?.message}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Assistência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select
                  label="Tipo de Assistência"
                  options={assistanceTypeOptions}
                  {...register('assistanceType', { required: 'Campo obrigatório' })}
                  error={errors.assistanceType?.message}
                />
                
                <Input
                  label="Local da Assistência"
                  {...register('assistanceLocation')}
                />
                
                <Select
                  label="Problema Apresentado"
                  options={reportedIssueOptions}
                  {...register('reportedIssue', { required: 'Campo obrigatório' })}
                  error={errors.reportedIssue?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Contato"
                  {...register('contactPerson')}
                />
                
                <Input
                  label="Telefone"
                  {...register('phone')}
                />
              </div>

              <Textarea
                label="Observações"
                {...register('observations')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Fornecedor"
                  {...register('supplier')}
                />
                
                <Input
                  label="Peça"
                  {...register('part')}
                />
                
                <Input
                  label="Data do Atendimento"
                  type="date"
                  {...register('serviceDate')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Técnico Responsável"
                  {...register('responsibleTechnician')}
                />
                
                <Input
                  label="Custo Peça/Mão de Obra"
                  type="number"
                  step="0.01"
                  {...register('partLaborCost', {
                    setValueAs: value => value === '' ? 0 : parseFloat(value)
                  })}
                />
                
                <Input
                  label="Custo Viagem/Frete"
                  type="number"
                  step="0.01"
                  {...register('travelFreightCost', {
                    setValueAs: value => value === '' ? 0 : parseFloat(value)
                  })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Devolução de Peça"
                  {...register('partReturn')}
                />
                
                <div className="flex items-center space-x-2 pt-7">
                  <input
                    type="checkbox"
                    id="supplierWarranty"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    {...register('supplierWarranty')}
                  />
                  <label htmlFor="supplierWarranty" className="text-sm font-medium text-gray-700">
                    Garantia do Fornecedor
                  </label>
                </div>
              </div>

              <Textarea
                label="Solução Técnica"
                {...register('technicalSolution')}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Custos Adicionais</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdditionalCost}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Custo
                  </Button>
                </div>
                
                {additionalCosts.length > 0 && (
                  <div className="space-y-3">
                    {additionalCosts.map((cost) => (
                      <div key={cost.id} className="flex items-center gap-3 p-3 border rounded-md bg-gray-50">
                        <div className="flex-1">
                          <Input
                            placeholder="Descrição do custo"
                            value={cost.description}
                            onChange={(e) => updateAdditionalCost(cost.id, 'description', e.target.value)}
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={cost.amount}
                            onChange={(e) => updateAdditionalCost(cost.id, 'amount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAdditionalCost(cost.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesSelected={handleFilesSelected}
                label="Adicionar arquivos (PDF, imagens, vídeos, documentos)"
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm'],
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                }}
              />
            </CardContent>
          </Card>

          {saveError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              {saveError}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={loading}
            >
              {!loading && <Save className="mr-2 h-4 w-4" />}
              Salvar Atendimento
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};