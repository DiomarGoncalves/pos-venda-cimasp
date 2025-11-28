import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Download, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdateNotificationProps {
  onClose?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onClose }) => {
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'none'>('none');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    // Listeners para eventos de atualização
    const handleUpdateAvailable = () => {
      setUpdateStatus('available');
      setIsVisible(true);
    };

    const handleUpdateDownloaded = () => {
      setUpdateStatus('downloaded');
      setIsVisible(true);
    };

    const handleDownloadProgress = (event: any, progressObj: any) => {
      setUpdateStatus('downloading');
      setDownloadProgress(Math.round(progressObj.percent));
      setIsVisible(true);
    };

    const handleUpdateError = (event: any, error: string) => {
      setUpdateStatus('error');
      setErrorMessage(error);
      setIsVisible(true);
    };

    // Registra os listeners
    window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
    window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
    window.electronAPI.onDownloadProgress(handleDownloadProgress);
    window.electronAPI.onUpdateError(handleUpdateError);

    // Cleanup
    return () => {
      // Note: electron IPC não tem removeListener direto, mas os listeners são limpos quando o componente desmonta
    };
  }, []);

  const handleCheckForUpdates = () => {
    setUpdateStatus('checking');
    setIsVisible(true);
    window.electronAPI.checkForUpdates();
    
    // Se não houver atualização em 10 segundos, esconde a notificação
    setTimeout(() => {
      if (updateStatus === 'checking') {
        setUpdateStatus('none');
        setIsVisible(false);
      }
    }, 10000);
  };

  const handleInstallUpdate = () => {
    window.electronAPI.installUpdateNow();
  };

  const handleRestartLater = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setUpdateStatus('none');
    if (onClose) onClose();
  };

  const getStatusContent = () => {
    switch (updateStatus) {
      case 'checking':
        return {
          icon: <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />,
          title: 'Verificando atualizações...',
          message: 'Aguarde enquanto verificamos se há novas versões disponíveis.',
          actions: null
        };

      case 'available':
        return {
          icon: <Download className="h-6 w-6 text-blue-600" />,
          title: 'Atualização disponível!',
          message: 'Uma nova versão está disponível e será baixada automaticamente.',
          actions: (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                OK
              </Button>
            </div>
          )
        };

      case 'downloading':
        return {
          icon: <Download className="h-6 w-6 text-blue-600" />,
          title: 'Baixando atualização...',
          message: (
            <div className="space-y-2">
              <p>Baixando nova versão... {downloadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          ),
          actions: null
        };

      case 'downloaded':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          title: 'Atualização pronta!',
          message: 'A nova versão foi baixada. Reinicie o aplicativo para aplicar as atualizações.',
          actions: (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstallUpdate}>
                Reiniciar agora
              </Button>
              <Button variant="outline" size="sm" onClick={handleRestartLater}>
                Reiniciar depois
              </Button>
            </div>
          )
        };

      case 'error':
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-600" />,
          title: 'Erro na atualização',
          message: `Ocorreu um erro ao verificar atualizações: ${errorMessage}`,
          actions: (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCheckForUpdates}>
                Tentar novamente
              </Button>
              <Button variant="outline" size="sm" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          )
        };

      default:
        return null;
    }
  };

  const statusContent = getStatusContent();

  return (
    <>
      {/* Botão flutuante para verificar atualizações manualmente */}
      {!isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 right-4 z-40"
        >
          <Button
            onClick={handleCheckForUpdates}
            className="rounded-full shadow-lg"
            size="icon"
            title="Verificar atualizações"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Notificação de atualização */}
      <AnimatePresence>
        {isVisible && statusContent && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50 w-80"
          >
            <Card className="shadow-lg border-l-4 border-l-blue-600">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusContent.icon}
                    <CardTitle className="text-sm">{statusContent.title}</CardTitle>
                  </div>
                  {updateStatus !== 'downloading' && updateStatus !== 'checking' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-gray-600 mb-3">
                  {statusContent.message}
                </div>
                {statusContent.actions}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};