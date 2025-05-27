import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { motion } from 'framer-motion';

interface RegisterFormProps {
  onToggleForm: () => void;
}

interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const { register, error: authError, loading } = useAuth();
  
  const { register: registerForm, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormValues>({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    }
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormValues) => {
    await register(data.username, data.password);
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
          <CardTitle className="text-center text-2xl">Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Usuário"
              placeholder="Seu usuário"
              error={errors.username?.message}
              {...registerForm('username', { 
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
              {...registerForm('password', { 
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres'
                }
              })}
            />
            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="********"
              error={errors.confirmPassword?.message}
              {...registerForm('confirmPassword', { 
                required: 'Confirmação de senha é obrigatória',
                validate: value => value === password || 'As senhas não conferem'
              })}
            />
            
            {authError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {authError}
              </div>
            )}
            
            <Button type="submit" className="w-full" isLoading={loading}>
              Criar Conta
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-gray-600 w-full">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="text-blue-700 hover:underline focus:outline-none"
            >
              Faça login
            </button>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};