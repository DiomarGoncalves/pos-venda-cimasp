import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getCurrentUser, signIn, signOut, signUp } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<any>;
  register: (username: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setError('Failed to load user session');
        console.error('Error loading user:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    const result = await signIn(username, password);
    if (result) {
      setUser(result);
    } else {
      setError('Usuário ou senha inválidos');
    }
    setLoading(false);
    return result; // importante para o LoginForm saber se foi sucesso ou não
  };

  const register = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    const result = await signUp(username, password);
    if (result) {
      setUser(result);
    } else {
      setError('Erro ao registrar usuário');
    }
    setLoading(false);
    return result; // importante para o RegisterForm saber se foi sucesso ou não
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);