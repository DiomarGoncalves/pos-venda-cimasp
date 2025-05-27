import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getServiceRecords } from '../services/serviceRecordService';
import { getAttachments, openAttachment } from '../services/attachmentService';
import { ServiceRecord, Attachment } from '../types';
import { motion } from 'framer-motion';
import { 
  Search, 
  FileIcon, 
  Download, 
  Paperclip, 
  Calendar,
  ExternalLink
} from 'lucide-react';

export const AttachmentsPage: React.FC = () => {
  const [attachments, setAttachments] = useState<(Attachment & { record: ServiceRecord })[]>([]);
  const [filteredAttachments, setFilteredAttachments] = useState<(Attachment & { record: ServiceRecord })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Busca todos os atendimentos
        const records = await getServiceRecords();
        // Para cada atendimento, busca os anexos
        let allAttachments: (Attachment & { record: ServiceRecord })[] = [];
        for (const record of records) {
          const recordAttachments = await getAttachments(record.id);
          if (recordAttachments && recordAttachments.length > 0) {
            allAttachments = allAttachments.concat(
              recordAttachments.map(att => ({
                ...att,
                record,
              }))
            );
          }
        }
        setAttachments(allAttachments);
        setFilteredAttachments(allAttachments);
      } catch (err) {
        console.error('Error loading attachments:', err);
        setError('Falha ao carregar os anexos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = attachments.filter(attachment => 
        (attachment.filename?.toLowerCase().includes(term) ?? false) ||
        (attachment.record?.orderNumber?.toLowerCase().includes(term) ?? false) ||
        (attachment.record?.client?.toLowerCase().includes(term) ?? false) ||
        (attachment.record?.equipment?.toLowerCase().includes(term) ?? false)
      );
      setFilteredAttachments(filtered);
    } else {
      setFilteredAttachments(attachments);
    }
  }, [searchTerm, attachments]);

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
      <h1 className="text-2xl font-bold text-gray-900">Anexos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome do arquivo, OF, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredAttachments.length > 0 ? (
          filteredAttachments.map((attachment) => (
            <motion.div key={attachment.id} variants={itemVariants}>
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-md mr-3">
                          <FileIcon className="h-6 w-6 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 break-all line-clamp-1" title={attachment.filename}>
                            {attachment.filename}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {(attachment.size ? attachment.size : attachment.fileSize || 0) / 1024 > 0
                              ? ((attachment.size ? attachment.size : attachment.fileSize || 0) / 1024).toFixed(1) + ' KB'
                              : ''}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openAttachment(attachment.url)}
                        title="Abrir"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center">
                          <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            Atendimento: {attachment.record.orderNumber}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            {new Date(attachment.createdAt ?? attachment.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <Link 
                          to={`/service-records/${attachment.record.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver atendimento
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg shadow">
            {searchTerm ? (
              <>
                Nenhum anexo encontrado com os filtros aplicados.
                <button 
                  className="ml-2 text-blue-600 hover:underline"
                  onClick={() => setSearchTerm('')}
                >
                  Limpar filtro
                </button>
              </>
            ) : (
              'Nenhum anexo disponível.'
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};