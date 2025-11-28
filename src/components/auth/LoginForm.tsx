import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onToggleForm: () => void;
}

interface LoginFormValues {
  username: string;
  password: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm }) => {
  const { login, error: authError, loading, user } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: '',
    }
  });

  const username = watch('username');
  const password = watch('password');

  useEffect(() => {
    if (user) {
      console.log('✅ Usuário autenticado, redirecionando para dashboard');
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    console.log('🔐 Tentando fazer login com:', { username: data.username });
    setLocalError(null);
    
    const result = await login(data.username, data.password);
    
    if (!result) {
      const errorMsg = authError || 'Usuário ou senha inválidos';
      console.error('❌ Erro no login:', errorMsg);
      setLocalError(errorMsg);
    } else {
      console.log('✅ Login bem-sucedido!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Usuário"
              placeholder="Digite seu usuário"
              autoComplete="username"
              error={errors.username?.message}
              {...register('username', { 
                required: 'Usuário é obrigatório',
                minLength: {
                  value: 2,
                  message: 'Usuário deve ter pelo menos 2 caracteres'
                }
              })}
            />
            
            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', { 
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres'
                }
              })}
            />
            
            {(authError || localError) && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Erro de autenticação</p>
                  <p className="text-xs mt-1">{authError || localError}</p>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              isLoading={loading} 
              disabled={loading || !username || !password}
            >
              {loading ? 'Autenticando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-center text-gray-600">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="text-blue-700 hover:underline focus:outline-none font-medium"
              disabled={loading}
            >
              Registre-se
            </button>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};