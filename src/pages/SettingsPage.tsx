import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Save, RefreshCw, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [dbUrl, setDbUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedDbUrl = await window.electronAPI.getStoreValue('NEON_DATABASE_URL');
        if (savedDbUrl) {
          setDbUrl(savedDbUrl);
        }
      } catch (error) {
        setSaveError('Erro ao carregar configuração');
        console.error('Error loading configuration:', error);
      }
    };

    loadConfig();
  }, []);

  const handleSaveDbUrl = async () => {
    setLoading(true);
    try {
      await window.electronAPI.setStoreValue('NEON_DATABASE_URL', dbUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Erro ao salvar configuração');
      console.error('Error saving configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetSuccess(null);
    setResetError(null);
    try {
      if (!resetUser || !resetPassword) {
        setResetError('Preencha o usuário e a nova senha.');
        return;
      }
      // TODO: Implementar reset de senha via IPC se necessário
      setResetSuccess('Funcionalidade a implementar');
    } catch (err) {
      setResetError('Erro ao redefinir senha.');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Banco de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              String de conexão (PostgreSQL/Neon)
            </label>
            <Input
              value={dbUrl}
              onChange={e => setDbUrl(e.target.value)}
              placeholder="postgresql://usuario:senha@host:porta/banco?sslmode=require"
            />
          </div>
          <Button onClick={handleSaveDbUrl} isLoading={loading}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
          {saveSuccess && (
            <div className="p-3 bg-green-50 text-green-600 rounded-md">
              Configuração salva com sucesso!
            </div>
          )}
          {saveError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md">
              {saveError}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redefinir Senha</CardTitle>
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
          <Button onClick={handleResetPassword}>
            <Key className="mr-2 h-4 w-4" />
            Redefinir Senha
          </Button>
          {resetSuccess && (
            <div className="p-3 bg-green-50 text-green-600 rounded-md">
              {resetSuccess}
            </div>
          )}
          {resetError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md">
              {resetError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};