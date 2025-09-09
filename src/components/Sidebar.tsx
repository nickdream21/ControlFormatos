import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  BarChart3,
  BookOpen,
  Building2,
  FileBarChart
} from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { 
      to: '/', 
      icon: Home, 
      label: 'Dashboard' 
    },
    { 
      to: '/pedidos', 
      icon: FileText, 
      label: 'Pedidos' 
    },
    { 
      to: '/reportes', 
      icon: FileBarChart, 
      label: 'Reportes' 
    },
    { 
      to: '/gestion-talonarios', 
      icon: BookOpen, 
      label: 'Gestión de Talonarios' 
    },
    { 
      to: '/empresas-formatos', 
      icon: Building2, 
      label: 'Empresas y Formatos' 
    },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-white" />
            <div className="text-white">
              <h1 className="text-lg font-bold">SGV Control</h1>
              <p className="text-xs text-primary-100">Sistema de Formatos</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Control de Formatos SGV v1.0
          </div>
        </div>
      </div>
    </div>
  );
}