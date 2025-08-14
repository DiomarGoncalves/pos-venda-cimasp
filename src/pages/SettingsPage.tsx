import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ApiConfig } from '../types';
import { Save, RefreshCw, Key } from 'lucide-react';
import { cacheService } from '../services/cacheService';

const DEFAULT_DB_PATH = 'Padrão: <userData>/database.sqlite';
const DEFAULT_ATTACHMENTS_PATH = 'Padrão: \\\\192.168.1.2\\publica\\POS-VENDAS\\sistema\\anexos';

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>({
    dbPath: '',
    attachmentsPath: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Redefinição de senha
  const [resetUser, setResetUser] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Teste de conexão/caminhos
  const [testResult, setTestResult] = useState<string | null>(null);

  // Nova variável de ambiente para conexão do banco de dados
  const [dbUrl, setDbUrl] = useState('');

  // Estado para update automático
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  
  // Estados para cache
  const [cacheSize, setCacheSize] = useState<string>('Calculando...');
  const [lastSync, setLastSync] = useState<string>('Nunca');
  const [clearingCache, setClearingCache] = useState(false);
  
  // Estados para atualização
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await window.electronAPI.getStoreValue('apiConfig');
        if (savedConfig) {
          setConfig(savedConfig);
        }

        // Carrega valor salvo da nova variável de ambiente
        const savedDbUrl = await window.electronAPI.getStoreValue('NEON_DATABASE_URL');
        if (savedDbUrl) {
          setDbUrl(savedDbUrl);
        }
        
        // Carrega informações do cache
        await loadCacheInfo();
      } catch (error) {
        setSaveError('Erro ao carregar configuração');
        console.error('Error loading configuration:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();

    // Escuta eventos de update automático
    const handleUpdateAvailable = () => setUpdateAvailable(true);
    const handleUpdateDownloaded = () => setUpdateDownloaded(true);

    if (window.electronAPI?.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
    }
    if (window.electronAPI?.onUpdateDownloaded) {
      window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
    }

    // Cleanup para evitar múltiplos listeners
    return () => {
      if (window.electronAPI?.onUpdateAvailable) {
        window.electronAPI.onUpdateAvailable(() => {});
      }
      if (window.electronAPI?.onUpdateDownloaded) {
        window.electronAPI.onUpdateDownloaded(() => {});
      }
    };
  }, []);

  const loadCacheInfo = async () => {
    try {
      // Calcula tamanho do cache (aproximado)
      const serviceRecords = await cacheService.getServiceRecords();
      const users = await cacheService.getUsers();
      setCacheSize(`${serviceRecords.length} atendimentos, ${users.length} usuários`);
      
      // Última sincronização
      const lastSyncTime = await cacheService.getLastSyncTime();
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime).toLocaleString('pt-BR'));
      }
    } catch (error) {
      console.error('Erro ao carregar informações do cache:', error);
      setCacheSize('Erro ao calcular');
      setLastSync('Erro ao verificar');
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      setSaving(true);
      await window.electronAPI.setStoreValue('apiConfig', config);
      // Solicita ao backend para aplicar os novos caminhos (se implementado)
      if (window.electronAPI.applyAppConfig) {
        await window.electronAPI.applyAppConfig(config);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Erro ao salvar configuração');
      console.error('Error saving configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof ApiConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    try {
      // Testa se os caminhos existem e são acessíveis
      if (window.electronAPI.testPaths) {
        const result = await window.electronAPI.testPaths(config);
        setTestResult(result.success ? 'Caminhos válidos e acessíveis!' : result.message || 'Falha ao acessar caminhos.');
      } else {
        setTestResult('Função de teste de caminhos não implementada no backend.');
      }
    } catch (err) {
      setTestResult('Erro ao testar caminhos.');
    }
  };

  // Redefinição de senha de usuário
  const handleResetPassword = async () => {
    setResetSuccess(null);
    setResetError(null);
    try {
      if (!resetUser || !resetPassword) {
        setResetError('Preencha o usuário e a nova senha.');
        return;
      }
      const result = await window.electronAPI.resetUserPassword(resetUser, resetPassword);
      if (result) {
        setResetSuccess('Senha redefinida com sucesso!');
      } else {
        setResetError('Usuário não encontrado ou erro ao redefinir senha.');
      }
    } catch (err) {
      setResetError('Erro ao redefinir senha.');
    }
  };

  // Salva a nova variável de ambiente
  const handleSaveDbUrl = async () => {
    setLoading(true);
    try {
      await window.electronAPI.setStoreValue('NEON_DATABASE_URL', dbUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Erro ao salvar configuração da variável de ambiente');
      console.error('Error saving DB URL configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Tem certeza que deseja limpar o cache? Isso irá remover todos os dados locais e será necessário sincronizar novamente.')) {
      return;
    }
    
    try {
      setClearingCache(true);
      await cacheService.clearCache();
      await loadCacheInfo();
      alert('Cache limpo com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      alert('Erro ao limpar cache.');
    } finally {
      setClearingCache(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSaving(true);
      await cacheService.processSyncQueue();
      await loadCacheInfo();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      setSaveError('Erro ao sincronizar dados');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckUpdates = () => {
    setCheckingUpdates(true);
    setUpdateMessage(null);
    
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates();
      setUpdateMessage('Verificando atualizações...');
      
      // Simula feedback após 3 segundos
      setTimeout(() => {
        setCheckingUpdates(false);
        if (!updateAvailable && !updateDownloaded) {
          setUpdateMessage('Nenhuma atualização disponível no momento.');
        }
      }, 3000);
    } else {
      setCheckingUpdates(false);
      setUpdateMessage('Função de atualização não disponível.');
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Caminhos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Caminho do Banco de Dados"
              value={config.dbPath || ''}
              onChange={(e) => handleInputChange('dbPath', e.target.value)}
              placeholder={DEFAULT_DB_PATH}
            />
            <Input
              label="Caminho dos Anexos"
              value={config.attachmentsPath || ''}
              onChange={(e) => handleInputChange('attachmentsPath', e.target.value)}
              placeholder={DEFAULT_ATTACHMENTS_PATH}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button 
              onClick={handleSave} 
              isLoading={saving}
              className="flex-1"
            >
              {!saving && <Save className="mr-2 h-4 w-4" />}
              Salvar Configurações
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Testar Caminhos
            </Button>
          </div>
          {saveSuccess && (
            <div className="p-3 bg-green-50 text-green-600 rounded-md mt-4">
              Configurações salvas com sucesso!
            </div>
          )}
          {saveError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md mt-4">
              {saveError}
            </div>
          )}
          {testResult && (
            <div className={`p-3 rounded-md mt-4 ${testResult.includes('sucesso') || testResult.includes('válidos') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {testResult}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redefinir Senha de Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Usuário"
              value={resetUser}
              onChange={e => setResetUser(e.target.value)}
              placeholder="Nome do usuário"
            />
            <Input
              label="Nova Senha"
              type="password"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
              placeholder="Nova senha"
            />
          </div>
          <Button 
            onClick={handleResetPassword}
            variant="outline"
            className="mt-2"
          >
            <Key className="mr-2 h-4 w-4" />
            Redefinir Senha
          </Button>
          {resetSuccess && (
            <div className="p-3 bg-green-50 text-green-600 rounded-md mt-4">
              {resetSuccess}
            </div>
          )}
          {resetError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md mt-4">
              {resetError}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do Aplicativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Versão do Aplicativo</h3>
              <p className="text-gray-600">1.0.0</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Atualizações</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCheckUpdates}
                isLoading={checkingUpdates}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Verificar Atualizações
              </Button>
              {updateMessage && (
                <p className="text-xs text-gray-600 mt-1">{updateMessage}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Cache Local</h3>
              <p className="text-gray-600 text-sm">{cacheSize}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Última Sincronização</h3>
              <p className="text-gray-600 text-sm">{lastSync}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Ações</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleForceSync}
                  isLoading={saving}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sincronizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearCache}
                  isLoading={clearingCache}
                  className="text-red-600 hover:text-red-700"
                >
                  Limpar Cache
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do Banco de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="block mb-2 font-medium">String de conexão do banco (PostgreSQL/Neon):</label>
          <Input
            value={dbUrl}
            onChange={e => setDbUrl(e.target.value)}
            placeholder="postgresql://usuario:senha@host:porta/banco?sslmode=require"
          />
          <Button className="mt-4" onClick={handleSaveDbUrl} isLoading={loading}>
            Salvar
          </Button>
          {saveSuccess && <div className="mt-2 text-green-600">Configuração salva!</div>}
          {saveError && <div className="mt-2 text-red-600">{saveError}</div>}
        </CardContent>
      </Card>

    </div>
  );
};