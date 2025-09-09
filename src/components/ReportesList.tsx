import React, { useState, useMemo } from 'react';
import { 
  FileBarChart,
  Calendar,
  Building,
  Package,
  DollarSign,
  Download,
  Filter
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Pedido } from '../types';

interface ReportesListProps {
  pedidos: Pedido[];
}

export function ReportesList({ pedidos }: ReportesListProps) {
  const [filtroAño, setFiltroAño] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Obtener años disponibles de los pedidos
  const añosDisponibles = useMemo(() => {
    const años = new Set<number>();
    pedidos.forEach(pedido => {
      if (pedido.fecha) {
        const año = new Date(pedido.fecha).getFullYear();
        años.add(año);
      }
    });
    return Array.from(años).sort((a, b) => b - a);
  }, [pedidos]);

  // Filtrar pedidos según año y mes seleccionados
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(pedido => {
      if (!pedido.fecha) return false;
      
      const fechaPedido = new Date(pedido.fecha);
      const año = fechaPedido.getFullYear();
      const mes = fechaPedido.getMonth() + 1; // getMonth() devuelve 0-11

      if (filtroAño && año !== parseInt(filtroAño)) return false;
      if (filtroMes && mes !== parseInt(filtroMes)) return false;

      return true;
    });
  }, [pedidos, filtroAño, filtroMes]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No registrado';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString.split('-').reverse().join('/');
    }
  };

  const getEstadoRecojoColor = (estado: string) => {
    switch (estado) {
      case 'recogido':
      case 'pagado':
        return 'text-green-700 bg-green-100';
      case 'por recoger':
      case 'sin pagar':
        return 'text-yellow-700 bg-yellow-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getEstadoPagoColor = (pagado: boolean) => {
    return pagado 
      ? 'text-green-700 bg-green-100'
      : 'text-red-700 bg-red-100';
  };

  const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const exportarExcel = () => {
    // Crear CSV con los datos
    const headers = [
      'Fecha Pedido',
      'Formato',
      'Empresa',
      'Cantidad',
      'Inicio Numeración',
      'Estado Recojo',
      'Fecha Recojo',
      'Monto',
      'Estado Pago',
      'Fecha Pago'
    ];

    const csvContent = [
      headers.join(','),
      ...pedidosFiltrados.map(pedido => [
        pedido.fecha,
        `"${pedido.formato}"`,
        `"${pedido.empresa}"`,
        pedido.cantidad,
        pedido.numeracion_inicial,
        pedido.estado === 'recogido' || pedido.estado === 'pagado' ? 'Recogido' : 'No Recogido',
        pedido.fecha_recojo || 'No registrado',
        pedido.monto,
        pedido.pagado ? 'Pagado' : 'No Pagado',
        pedido.fecha_pago || 'No registrado'
      ].join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_pedidos_${filtroAño || 'todos'}_${filtroMes || 'todos'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMonto = pedidosFiltrados.reduce((sum, pedido) => sum + pedido.monto, 0);
  const montoPagado = pedidosFiltrados.filter(p => p.pagado).reduce((sum, p) => sum + p.monto, 0);
  const montoPendiente = totalMonto - montoPagado;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">Reporte detallado de pedidos y pagos</p>
        </div>
        <button
          onClick={exportarExcel}
          className="btn btn-primary flex items-center space-x-2"
          disabled={pedidosFiltrados.length === 0}
        >
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Resumen de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center">
            <FileBarChart className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
              <p className="text-xl font-bold text-gray-900">{pedidosFiltrados.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalMonto)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pagado</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(montoPagado)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pendiente</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(montoPendiente)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn flex items-center space-x-2 ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año
                </label>
                <select
                  value={filtroAño}
                  onChange={(e) => setFiltroAño(e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los años</option>
                  {añosDisponibles.map(año => (
                    <option key={año} value={año}>{año}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mes
                </label>
                <select
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos los meses</option>
                  {meses.map(mes => (
                    <option key={mes.value} value={mes.value}>{mes.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFiltroAño('');
                    setFiltroMes('');
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

      {/* Tabla de reportes */}
      <div className="card">
        {pedidosFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inicio Numeración
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Recojo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Recojo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Pago
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {formatDate(pedido.fecha)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{pedido.formato}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{pedido.empresa}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pedido.cantidad}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pedido.numeracion_inicial}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoRecojoColor(pedido.estado)}`}>
                        {pedido.estado === 'recogido' || pedido.estado === 'pagado' ? 'Recogido' : 'No Recogido'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(pedido.fecha_recojo)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(pedido.monto)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoPagoColor(pedido.pagado)}`}>
                        {pedido.pagado ? 'Pagado' : 'No Pagado'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(pedido.fecha_pago)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos para mostrar</h3>
            <p className="text-gray-500">
              {filtroAño || filtroMes 
                ? 'No se encontraron pedidos con los filtros aplicados'
                : 'No hay pedidos registrados para generar reportes'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}