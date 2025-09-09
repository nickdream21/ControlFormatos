import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Package,
  MapPin,
  User,
  Calendar,
  Building,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { Formato, Pedido } from '../types';

interface FormatosListProps {
  formatos: Formato[];
  pedidos: Pedido[];
  onFormatoUpdated: () => void;
}

export function FormatosList({ formatos, pedidos, onFormatoUpdated }: FormatosListProps) {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPedido, setFilterPedido] = useState(searchParams.get('pedido') || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const pedidoParam = searchParams.get('pedido');
    if (pedidoParam) {
      setFilterPedido(pedidoParam);
      setShowFilters(true);
    }
  }, [searchParams]);

  const filteredFormatos = formatos.filter(formato => {
    const pedido = pedidos.find(p => p.id === formato.pedido_id);
    
    const matchesSearch = searchTerm === '' || 
      formato.numeracion.toString().includes(searchTerm) ||
      formato.ubicacion_actual.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formato.destinatario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido?.empresa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === '' || formato.estado === filterEstado;
    const matchesPedido = filterPedido === '' || formato.pedido_id === filterPedido;

    return matchesSearch && matchesEstado && matchesPedido;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'text-green-700 bg-green-100';
      case 'asignado': return 'text-yellow-700 bg-yellow-100';
      case 'entregado': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const selectedPedido = filterPedido ? pedidos.find(p => p.id === filterPedido) : null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Formatos</h1>
          <p className="text-gray-600 mt-1">
            {selectedPedido 
              ? `Formatos del pedido: ${selectedPedido.empresa} - ${selectedPedido.formato}`
              : 'Gestión individual de formatos'}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por numeración, ubicación, destinatario..."
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
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <option value="disponible">Disponible</option>
                  <option value="asignado">Asignado</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pedido
                </label>
                <select
                  value={filterPedido}
                  onChange={(e) => setFilterPedido(e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los pedidos</option>
                  {pedidos.map((pedido) => (
                    <option key={pedido.id} value={pedido.id}>
                      {pedido.empresa} - {pedido.formato}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterEstado('');
                    setFilterPedido('');
                  }}
                  className="btn btn-secondary"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {filteredFormatos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numeración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinatario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFormatos.map((formato) => {
                  const pedido = pedidos.find(p => p.id === formato.pedido_id);
                  return (
                    <tr key={formato.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            #{formato.numeracion}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {pedido?.empresa}
                            </div>
                            <div className="text-xs text-gray-500">
                              {pedido?.formato}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(formato.estado)}`}>
                          {formato.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formato.ubicacion_actual}
                          </span>
                        </div>
                        {formato.ubicacion_destino && (
                          <div className="text-xs text-gray-500">
                            Destino: {formato.ubicacion_destino}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formato.destinatario ? (
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {formato.destinatario}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {format(new Date(formato.fecha_ingreso), 'dd/MM/yyyy')}
                        </div>
                        {formato.fecha_salida && (
                          <div className="text-xs text-gray-500">
                            Salida: {format(new Date(formato.fecha_salida), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/formatos/${formato.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay formatos</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterEstado || filterPedido
                ? 'No se encontraron formatos con los filtros aplicados'
                : 'Los formatos se crean automáticamente al crear un pedido'}
            </p>
            <Link
              to="/pedidos/nuevo"
              className="btn btn-primary"
            >
              Crear Nuevo Pedido
            </Link>
          </div>
        )}
      </div>

      {selectedPedido && (
        <div className="mt-6 card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              Mostrando {filteredFormatos.length} formatos del pedido de {selectedPedido.empresa}
            </span>
            <Link
              to="/formatos"
              className="text-blue-600 hover:text-blue-800 text-sm underline ml-4"
            >
              Ver todos los formatos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}