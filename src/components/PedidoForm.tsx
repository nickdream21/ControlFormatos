import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { storageService } from '../services/storage';
import { Pedido, Empresa, TipoFormato } from '../types';

interface PedidoFormProps {
  onPedidoCreated: () => void;
  pedido?: Pedido;
  isEdit?: boolean;
}

export function PedidoForm({ onPedidoCreated, pedido, isEdit = false }: PedidoFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [currentPedido, setCurrentPedido] = useState<Pedido | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [tiposFormato, setTiposFormato] = useState<TipoFormato[]>([]);
  const [formatosDisponibles, setFormatosDisponibles] = useState<TipoFormato[]>([]);
  const [formData, setFormData] = useState<{
    fecha: string;
    formato: string;
    empresa: string;
    cantidad: number | string;
    numeracion_inicial: number | string;
    estado_pedido: 'por recoger' | 'recogido';
    estado_deuda: 'pagado' | 'sin pagar';
    fecha_recojo: string;
    fecha_pago: string;
    monto: number | string;
  }>({
    fecha: new Date().toISOString().split('T')[0],
    formato: '',
    empresa: '',
    cantidad: 50,
    numeracion_inicial: 0,
    estado_pedido: 'por recoger',
    estado_deuda: 'sin pagar',
    fecha_recojo: '',
    fecha_pago: '',
    monto: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [empresasData, tiposFormatoData] = await Promise.all([
          storageService.getEmpresas(),
          storageService.getTiposFormato()
        ]);
        
        const empresasActivas = empresasData.filter(e => e.activa);
        const tiposFormatoActivos = tiposFormatoData.filter(tf => tf.activo);
        
        setEmpresas(empresasActivas);
        setTiposFormato(tiposFormatoActivos);

        if (isEdit && id) {
          const pedidos = await storageService.getPedidos();
          const pedidoToEdit = pedidos.find(p => p.id === id);
          if (pedidoToEdit) {
            setCurrentPedido(pedidoToEdit);
            
            // Primero filtrar formatos para la empresa del pedido editado
            const empresaId = empresasActivas.find(e => e.nombre === pedidoToEdit.empresa)?.id;
            if (empresaId) {
              const formatosEmpresa = tiposFormatoActivos.filter(tf => tf.empresa_id === empresaId && tf.activo);
              setFormatosDisponibles(formatosEmpresa);
            }

            // Después establecer los datos del formulario
            setFormData({
              fecha: pedidoToEdit.fecha,
              formato: pedidoToEdit.formato,
              empresa: pedidoToEdit.empresa,
              cantidad: pedidoToEdit.cantidad,
              numeracion_inicial: pedidoToEdit.numeracion_inicial,
              estado_pedido: (pedidoToEdit.estado === 'pagado' || pedidoToEdit.estado === 'sin pagar') ? 'recogido' : pedidoToEdit.estado as 'por recoger' | 'recogido',
              estado_deuda: pedidoToEdit.pagado ? 'pagado' : 'sin pagar',
              fecha_recojo: pedidoToEdit.fecha_recojo || '',
              fecha_pago: pedidoToEdit.fecha_pago || '',
              monto: pedidoToEdit.monto,
            });
          }
        } else if (pedido) {
          setCurrentPedido(pedido);
          
          // Filtrar formatos para la empresa del pedido
          const empresaId = empresasActivas.find(e => e.nombre === pedido.empresa)?.id;
          if (empresaId) {
            const formatosEmpresa = tiposFormatoActivos.filter(tf => tf.empresa_id === empresaId && tf.activo);
            setFormatosDisponibles(formatosEmpresa);
          }

          setFormData({
            fecha: pedido.fecha,
            formato: pedido.formato,
            empresa: pedido.empresa,
            cantidad: pedido.cantidad,
            numeracion_inicial: pedido.numeracion_inicial,
            estado_pedido: (pedido.estado === 'pagado' || pedido.estado === 'sin pagar') ? 'recogido' : pedido.estado as 'por recoger' | 'recogido',
            estado_deuda: pedido.pagado ? 'pagado' : 'sin pagar',
            fecha_recojo: pedido.fecha_recojo || '',
            fecha_pago: pedido.fecha_pago || '',
            monto: pedido.monto,
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [isEdit, id]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.formato.trim()) {
      newErrors.formato = 'El formato es requerido';
    }

    if (!formData.empresa.trim()) {
      newErrors.empresa = 'La empresa es requerida';
    }

    const cantidad = typeof formData.cantidad === 'string' ? parseInt(formData.cantidad) || 0 : formData.cantidad;
    if (cantidad < 1) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }

    const numeracion = typeof formData.numeracion_inicial === 'string' ? parseInt(formData.numeracion_inicial) || 0 : formData.numeracion_inicial;
    if (numeracion < 0) {
      newErrors.numeracion_inicial = 'La numeración inicial no puede ser negativa';
    }

    // Validaciones específicas para cuando el pedido está recogido
    if (formData.estado_pedido === 'recogido') {
      if (!formData.fecha_recojo) {
        newErrors.fecha_recojo = 'La fecha de recojo es requerida cuando el pedido está recogido';
      }

      const monto = typeof formData.monto === 'string' ? parseFloat(formData.monto) || 0 : formData.monto;
      if (monto <= 0) {
        newErrors.monto = 'El monto debe ser mayor a 0 cuando el pedido está recogido';
      }
    }

    // Validaciones específicas para cuando la deuda está pagada
    if (formData.estado_deuda === 'pagado') {
      if (!formData.fecha_pago) {
        newErrors.fecha_pago = 'La fecha de pago es requerida cuando el pedido está pagado';
      }
    }

    const monto = typeof formData.monto === 'string' ? parseFloat(formData.monto) || 0 : formData.monto;
    if (monto < 0) {
      newErrors.monto = 'El monto no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Convertir el formData al modelo de datos existente
      const pedidoData = {
        fecha: formData.fecha,
        formato: formData.formato,
        empresa: formData.empresa,
        cantidad: typeof formData.cantidad === 'string' ? parseInt(formData.cantidad) || 0 : formData.cantidad,
        numeracion_inicial: typeof formData.numeracion_inicial === 'string' ? parseInt(formData.numeracion_inicial) || 0 : formData.numeracion_inicial,
        estado: formData.estado_deuda === 'pagado' ? 'pagado' as const : 
               formData.estado_deuda === 'sin pagar' ? 'sin pagar' as const :
               formData.estado_pedido,
        fecha_recojo: formData.fecha_recojo,
        fecha_pago: formData.fecha_pago,
        monto: typeof formData.monto === 'string' ? parseFloat(formData.monto) || 0 : formData.monto,
        pagado: formData.estado_deuda === 'pagado',
      };

      if (isEdit && (currentPedido || pedido)) {
        const pedidoToUpdate = currentPedido || pedido!;
        await storageService.updatePedido(pedidoToUpdate.id, pedidoData);
      } else {
        if (pedidoData.numeracion_inicial === 0) {
          pedidoData.numeracion_inicial = await storageService.getNextNumeracion(pedidoData.formato, pedidoData.empresa);
        }
        await storageService.createPedido(pedidoData);
      }
      
      onPedidoCreated();
      navigate('/pedidos');
    } catch (error) {
      console.error('Error saving pedido:', error);
      alert('Error al guardar el pedido. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? (value === '' ? '' : parseInt(value)) : value
    }));

    // Si cambia la empresa, filtrar los formatos disponibles
    if (name === 'empresa') {
      const empresaSeleccionada = empresas.find(e => e.nombre === value);
      if (empresaSeleccionada) {
        const formatosEmpresa = tiposFormato.filter(tf => tf.empresa_id === empresaSeleccionada.id);
        setFormatosDisponibles(formatosEmpresa);
        
        // Solo limpiar el formato si el formato actual no pertenece a la nueva empresa
        const formatoActual = formData.formato;
        const formatoExisteEnNuevaEmpresa = formatosEmpresa.some(f => f.nombre === formatoActual);
        
        setFormData(prev => ({ 
          ...prev, 
          empresa: value,
          formato: formatoExisteEnNuevaEmpresa ? formatoActual : ''
        }));
      } else {
        setFormatosDisponibles([]);
        setFormData(prev => ({ ...prev, formato: '', empresa: value }));
      }
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generateNumeracion = async () => {
    try {
      if (!formData.formato) {
        alert('Por favor selecciona un formato primero');
        return;
      }
      if (!formData.empresa) {
        alert('Por favor selecciona una empresa primero');
        return;
      }
      const nextNumber = await storageService.getNextNumeracion(formData.formato, formData.empresa);
      setFormData(prev => ({ ...prev, numeracion_inicial: nextNumber }));
    } catch (error) {
      console.error('Error generating numeracion:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/pedidos')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="card p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className={`form-input ${errors.fecha ? 'border-red-500' : ''}`}
                  required
                />
                {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
              </div>

              <div>
                <label className="form-label">
                  Formato *
                </label>
                <select
                  name="formato"
                  value={formData.formato}
                  onChange={handleChange}
                  className={`form-input ${errors.formato ? 'border-red-500' : ''}`}
                  required
                  disabled={!formData.empresa}
                >
                  <option value="">
                    {!formData.empresa ? 'Primero seleccione una empresa' : 'Seleccione un formato'}
                  </option>
                  {formatosDisponibles.map((tipoFormato) => (
                    <option key={tipoFormato.id} value={tipoFormato.nombre}>
                      {tipoFormato.nombre}
                    </option>
                  ))}
                </select>
                {errors.formato && <p className="text-red-500 text-sm mt-1">{errors.formato}</p>}
                {!formData.empresa && (
                  <p className="text-sm text-gray-500 mt-1">
                    Seleccione primero una empresa para ver los formatos disponibles
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Empresa *
                </label>
                <select
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className={`form-input ${errors.empresa ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Seleccione una empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.nombre}>
                      {empresa.nombre} {empresa.ruc && `(${empresa.ruc})`}
                    </option>
                  ))}
                </select>
                {errors.empresa && <p className="text-red-500 text-sm mt-1">{errors.empresa}</p>}
              </div>

              <div>
                <label className="form-label">
                  Cantidad *
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  className={`form-input ${errors.cantidad ? 'border-red-500' : ''}`}
                  min="1"
                  step="1"
                  placeholder="Ingrese la cantidad"
                  required
                />
                {errors.cantidad && <p className="text-red-500 text-sm mt-1">{errors.cantidad}</p>}
              </div>

              <div>
                <label className="form-label">
                  Numeración Inicial *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="numeracion_inicial"
                    value={formData.numeracion_inicial}
                    onChange={handleChange}
                    className={`form-input flex-1 ${errors.numeracion_inicial ? 'border-red-500' : ''}`}
                    min="1"
                    required
                  />
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={generateNumeracion}
                      className="btn btn-secondary whitespace-nowrap"
                    >
                      Auto
                    </button>
                  )}
                </div>
                {errors.numeracion_inicial && <p className="text-red-500 text-sm mt-1">{errors.numeracion_inicial}</p>}
              </div>

              <div>
                <label className="form-label">
                  Estado del Pedido
                </label>
                <select
                  name="estado_pedido"
                  value={formData.estado_pedido}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="por recoger">Por Recoger</option>
                  <option value="recogido">Recogido</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  Estado de la Deuda
                </label>
                <select
                  name="estado_deuda"
                  value={formData.estado_deuda}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="sin pagar">Sin Pagar</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  Fecha de Recojo {formData.estado_pedido === 'recogido' && '*'}
                </label>
                <input
                  type="date"
                  name="fecha_recojo"
                  value={formData.fecha_recojo}
                  onChange={handleChange}
                  className={`form-input ${formData.estado_pedido === 'por recoger' ? 'bg-gray-100' : ''}`}
                  disabled={formData.estado_pedido === 'por recoger'}
                  required={formData.estado_pedido === 'recogido'}
                />
                {errors.fecha_recojo && <p className="text-red-500 text-sm mt-1">{errors.fecha_recojo}</p>}
                {formData.estado_pedido === 'por recoger' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Se habilitará cuando el estado del pedido sea "Recogido"
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Monto {formData.estado_pedido === 'recogido' && '*'}
                </label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  className={`form-input ${errors.monto ? 'border-red-500' : ''} ${formData.estado_pedido === 'por recoger' ? 'bg-gray-100' : ''}`}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={formData.estado_pedido === 'por recoger'}
                  required={formData.estado_pedido === 'recogido'}
                />
                {errors.monto && <p className="text-red-500 text-sm mt-1">{errors.monto}</p>}
                {formData.estado_pedido === 'por recoger' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Se habilitará cuando el estado del pedido sea "Recogido"
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Fecha de Pago {formData.estado_deuda === 'pagado' && '*'}
                </label>
                <input
                  type="date"
                  name="fecha_pago"
                  value={formData.fecha_pago}
                  onChange={handleChange}
                  className={`form-input ${errors.fecha_pago ? 'border-red-500' : ''} ${formData.estado_deuda === 'sin pagar' ? 'bg-gray-100' : ''}`}
                  disabled={formData.estado_deuda === 'sin pagar'}
                  required={formData.estado_deuda === 'pagado'}
                />
                {errors.fecha_pago && <p className="text-red-500 text-sm mt-1">{errors.fecha_pago}</p>}
                {formData.estado_deuda === 'sin pagar' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Se habilitará cuando el estado de la deuda sea "Pagado"
                  </p>
                )}
              </div>

            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/pedidos')}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center space-x-2"
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Pedido')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}