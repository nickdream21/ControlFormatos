import React from 'react';
import { 
  FileText, 
  Package, 
  DollarSign, 
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { DashboardMetrics, Pedido, Formato } from '../types';
import { format } from 'date-fns';

interface DashboardProps {
  metrics: DashboardMetrics;
  pedidos: Pedido[];
  formatos: Formato[];
}

export function Dashboard({ metrics, pedidos, formatos }: DashboardProps) {
  const recentPedidos = pedidos
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'por recoger': return 'text-yellow-600 bg-yellow-50';
      case 'recogido': return 'text-blue-600 bg-blue-50';
      case 'pagado': return 'text-green-600 bg-green-50';
      case 'sin pagar': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFormatoEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'text-green-600 bg-green-50';
      case 'asignado': return 'text-yellow-600 bg-yellow-50';
      case 'entregado': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general del sistema de control de formatos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.total_pedidos}</p>
            </div>
          </div>
          <div className="mt-4 flex text-sm">
            <span className="text-green-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              {metrics.pedidos_completados} completados
            </span>
            <span className="text-yellow-600 flex items-center ml-4">
              <Clock className="w-4 h-4 mr-1" />
              {metrics.pedidos_pendientes} pendientes
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.monto_total)}</p>
            </div>
          </div>
          <div className="mt-4 flex text-sm">
            <span className="text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {formatCurrency(metrics.monto_pagado)} pagado
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendiente Pago</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.monto_pendiente)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Formatos</p>
              <p className="text-2xl font-bold text-gray-900">{formatos.length}</p>
            </div>
          </div>
          <div className="mt-4 flex text-sm space-x-4">
            <span className="text-green-600">{metrics.formatos_disponibles} disponibles</span>
            <span className="text-yellow-600">{metrics.formatos_asignados} asignados</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pedidos Recientes</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPedidos.length > 0 ? (
              recentPedidos.map((pedido) => (
                <div key={pedido.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pedido.empresa}</p>
                      <p className="text-sm text-gray-500">{pedido.formato} - {pedido.cantidad} unidades</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(pedido.created_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(pedido.estado)}`}>
                        {pedido.estado}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(pedido.monto)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay pedidos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}