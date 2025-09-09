import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Package,
  Building,
  MapPin,
  User,
  Calendar,
  FileText,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { Formato, Pedido } from '../types';
import { storageService } from '../services/storage';

interface FormatoDetailProps {
  formatos: Formato[];
  pedidos: Pedido[];
  onFormatoUpdated: () => void;
}

export function FormatoDetail({ formatos, pedidos, onFormatoUpdated }: FormatoDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const formato = formatos.find(f => f.id === id);
  const pedido = formato ? pedidos.find(p => p.id === formato.pedido_id) : null;

  const [formData, setFormData] = useState(() => ({
    ubicacion_actual: formato?.ubicacion_actual || '',
    fecha_salida: formato?.fecha_salida || '',
    ubicacion_destino: formato?.ubicacion_destino || '',
    destinatario: formato?.destinatario || '',
    observaciones: formato?.observaciones || '',
    estado: (formato?.estado as 'disponible' | 'asignado' | 'entregado') || 'disponible',
  }));

  if (!formato || !pedido) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Formato no encontrado</h3>
          <p className="text-gray-500 mb-4">El formato solicitado no existe o ha sido eliminado</p>
          <Link to="/formatos" className="btn btn-primary">
            Volver a Formatos
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      await storageService.updateFormato(formato.id, formData);
      onFormatoUpdated();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating formato:', error);
      alert('Error al actualizar el formato');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ubicacion_actual: formato.ubicacion_actual,
      fecha_salida: formato.fecha_salida || '',
      ubicacion_destino: formato.ubicacion_destino || '',
      destinatario: formato.destinatario || '',
      observaciones: formato.observaciones || '',
      estado: formato.estado,
    });
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'text-green-700 bg-green-100';
      case 'asignado': return 'text-yellow-700 bg-yellow-100';
      case 'entregado': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/formatos')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Formato #{formato.numeracion}
              </h1>
              <p className="text-gray-600 mt-1">
                {pedido.empresa} - {pedido.formato}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary flex items-center space-x-2"
                  disabled={loading}
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información del Formato</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Estado</label>
                {isEditing ? (
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="asignado">Asignado</option>
                    <option value="entregado">Entregado</option>
                  </select>
                ) : (
                  <div className="mt-1">
                    <span className={`px-3 py-2 text-sm font-medium rounded-lg ${getEstadoColor(formato.estado)}`}>
                      {formato.estado}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Ubicación Actual</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="ubicacion_actual"
                    value={formData.ubicacion_actual}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Ej: Almacén, Oficina A, etc."
                  />
                ) : (
                  <div className="mt-1 flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{formato.ubicacion_actual}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Ubicación Destino</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="ubicacion_destino"
                    value={formData.ubicacion_destino}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Ubicación de destino"
                  />
                ) : (
                  <div className="mt-1 flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {formato.ubicacion_destino || '-'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Destinatario</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="destinatario"
                    value={formData.destinatario}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Nombre del destinatario"
                  />
                ) : (
                  <div className="mt-1 flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {formato.destinatario || '-'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Fecha de Salida</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="fecha_salida"
                    value={formData.fecha_salida}
                    onChange={handleChange}
                    className="form-input"
                  />
                ) : (
                  <div className="mt-1 flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {formato.fecha_salida 
                        ? format(new Date(formato.fecha_salida), 'dd/MM/yyyy')
                        : '-'}
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Observaciones</label>
                {isEditing ? (
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    rows={3}
                    className="form-input"
                    placeholder="Observaciones adicionales"
                  />
                ) : (
                  <div className="mt-1">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {formato.observaciones || '-'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Pedido</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Building className="w-4 h-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Empresa</p>
                  <p className="font-medium text-gray-900">{pedido.empresa}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Formato</p>
                  <p className="font-medium text-gray-900">{pedido.formato}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Package className="w-4 h-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Rango de Numeración</p>
                  <p className="font-medium text-gray-900">
                    {pedido.numeracion_inicial} - {pedido.numeracion_inicial + pedido.cantidad - 1}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Fecha del Pedido</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(pedido.fecha), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                to={`/formatos?pedido=${pedido.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos los formatos de este pedido →
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-gray-500">Creado</p>
                  <p className="text-gray-900">
                    {format(new Date(formato.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-gray-500">Última actualización</p>
                  <p className="text-gray-900">
                    {format(new Date(formato.updated_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}