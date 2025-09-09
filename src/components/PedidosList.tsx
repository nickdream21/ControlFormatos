import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Building,
  Package
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Pedido } from '../types';
import { storageService } from '../services/storage';

interface PedidosListProps {
  pedidos: Pedido[];
  onPedidoUpdated: () => void;
}

export function PedidosList({ pedidos, onPedidoUpdated }: PedidosListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = searchTerm === '' || 
      pedido.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.formato.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === '' || pedido.estado === filterEstado;
    const matchesEmpresa = filterEmpresa === '' || 
      pedido.empresa.toLowerCase().includes(filterEmpresa.toLowerCase());

    return matchesSearch && matchesEstado && matchesEmpresa;
  });

  const empresas = Array.from(new Set(pedidos.map(p => p.empresa))).sort();

  const handleDelete = async (pedido: Pedido) => {
    if (window.confirm(`¿Está seguro que desea eliminar el pedido de ${pedido.empresa}?`)) {
      try {
        await storageService.deletePedido(pedido.id);
        onPedidoUpdated();
      } catch (error) {
        console.error('Error deleting pedido:', error);
        alert('Error al eliminar el pedido');
      }
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'por recoger': return 'text-yellow-700 bg-yellow-100';
      case 'recogido': return 'text-blue-700 bg-blue-100';
      case 'pagado': return 'text-green-700 bg-green-100';
      case 'sin pagar': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">Gestión de pedidos de imprenta</p>
        </div>
        <Link
          to="/pedidos/nuevo"
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Pedido</span>
        </Link>
      </div>

      <div className="card mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por empresa o formato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn flex items-center space-x-2 ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los estados</option>
                  <option value="por recoger">Por Recoger</option>
                  <option value="recogido">Recogido</option>
                  <option value="pagado">Pagado</option>
                  <option value="sin pagar">Sin Pagar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <select
                  value={filterEmpresa}
                  onChange={(e) => setFilterEmpresa(e.target.value)}
                  className="form-input"
                >
                  <option value="">Todas las empresas</option>
                  {empresas.map((empresa) => (
                    <option key={empresa} value={empresa}>
                      {empresa}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {filteredPedidos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numeración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {pedido.empresa}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{pedido.formato}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pedido.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pedido.numeracion_inicial} - {pedido.numeracion_inicial + pedido.cantidad - 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(pedido.estado)}`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(pedido.monto)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pedido.pagado ? 'Pagado' : 'Pendiente'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {pedido.fecha ? pedido.fecha.split('-').reverse().join('/') : 'Sin fecha'}
                      </div>
                      {pedido.fecha_recojo && (
                        <div className="text-xs text-gray-500">
                          Recojo: {pedido.fecha_recojo ? pedido.fecha_recojo.split('-').reverse().join('/') : 'Sin fecha'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/formatos?pedido=${pedido.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                          title="Ver formatos"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => navigate(`/pedidos/editar/${pedido.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pedido)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterEstado || filterEmpresa
                ? 'No se encontraron pedidos con los filtros aplicados'
                : 'Comience creando su primer pedido'}
            </p>
            <Link
              to="/pedidos/nuevo"
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Pedido</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}