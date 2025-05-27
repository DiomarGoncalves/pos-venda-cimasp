import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: '',
    }
  });

  useEffect(() => {
    if (user) {
      navigate('/'); // Redireciona para a página inicial após login
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setLocalError(null);
    const result = await login(data.username, data.password);
    if (!result && !authError) {
      setLocalError('Usuário ou senha inválidos');
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
              placeholder="Seu usuário"
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
              placeholder="********"
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
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {authError || localError}
              </div>
            )}
            
            <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
              Entrar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-center text-gray-600">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="text-blue-700 hover:underline focus:outline-none"
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