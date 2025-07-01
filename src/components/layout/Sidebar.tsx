import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Settings, 
  ClipboardList, 
  Home, 
  FileText, 
  PaperclipIcon, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, onToggle }) => {
  const { logout, user } = useAuth();

  const navigationItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/' },
    { icon: <ClipboardList size={20} />, label: 'Atendimentos', path: '/service-records' },
    { icon: <FileText size={20} />, label: 'Relatórios', path: '/reports' },
    { icon: <PaperclipIcon size={20} />, label: 'Anexos', path: '/attachments' },
    { icon: <Settings size={20} />, label: 'Configurações', path: '/settings' },
  ];

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  const overlayVariants = {
    open: { opacity: 0.5, display: 'block' },
    closed: { opacity: 0, display: 'none', transition: { delay: 0.2 } }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold text-blue-800">Controle Técnico</h1>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden">
            <X size={20} />
          </Button>
        )}
      </div>
      
      <div className="px-2 py-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? onToggle : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t">
        {user && (
          <div className="mb-4 px-3 py-2">
            <p className="text-sm font-medium text-gray-900">Desenvolvido por:</p>
            <p className="text-xs text-gray-500">Diomar Gonçalves / alphadevss</p>
          </div>
        )}
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => logout()}
        >
          <LogOut size={18} className="mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  // For desktop: static sidebar
  if (!isMobile) {
    return (
      <aside className="hidden lg:block w-64 h-screen bg-white border-r">
        {renderSidebarContent()}
      </aside>
    );
  }

  // For mobile: slide-in sidebar with overlay
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-20 bg-white rounded-full shadow-md"
      >
        <Menu size={20} />
      </Button>
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 bg-black z-30 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
      
      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed top-0 left-0 w-64 h-screen bg-white z-40 lg:hidden"
          >
            {renderSidebarContent()}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};