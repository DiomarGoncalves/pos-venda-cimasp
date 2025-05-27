import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AnimatePresence } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const [isRegisterForm, setIsRegisterForm] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">
          Sistema de Controle de Pós-venda Técnico
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie atendimentos técnicos com facilidade e eficiência
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isRegisterForm ? (
          <RegisterForm key="register" onToggleForm={() => setIsRegisterForm(false)} />
        ) : (
          <LoginForm key="login" onToggleForm={() => setIsRegisterForm(true)} />
        )}
      </AnimatePresence>
    </div>
  );
};