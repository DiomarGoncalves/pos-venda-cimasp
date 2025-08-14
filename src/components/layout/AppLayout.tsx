import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cacheService } from '../../services/cacheService';
import { UpdateNotification } from '../UpdateNotification';

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inicializa o cache quando o usuário está logado
  useEffect(() => {
    if (user && !loading) {
      const initializeCache = async () => {
        try {
          setSyncStatus('syncing');
          await cacheService.init();
          
          // Verifica se precisa sincronizar
          console.log('🔄 Sincronizando dados...');
          try {
            await cacheService.processSyncQueue();
          } catch (syncError) {
            console.error('Erro na sincronização inicial:', syncError);
            // Em produção, continua mesmo com erro de sincronização
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 5000);
            return;
          }
          
          setSyncStatus('idle');
        } catch (error) {
          console.error('Erro ao inicializar cache:', error);
          setSyncStatus('error');
          // Em produção, tenta novamente após um tempo
          setTimeout(() => {
            setSyncStatus('idle');
          }, 10000);
        }
      };
      
      initializeCache();
    }
  }, [user, loading]);

  // Display loading spinner while checking auth status
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-700 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect happens in useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Indicador de sincronização */}
      {syncStatus === 'syncing' && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Sincronizando dados...
        </div>
      )}
      
      {syncStatus === 'error' && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Erro na sincronização
        </div>
      )}
      
      {/* Componente de notificação de atualização */}
      <UpdateNotification />
      
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isMobileMenuOpen} 
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div 
            key={window.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="container mx-auto px-4 py-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};