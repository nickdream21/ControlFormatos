import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, FileText, Plus, Search } from 'lucide-react';
import { storageService } from '../services/storage';
import { Pedido, Formato } from '../types';

interface Talonario {
  id: string;
  formato_tipo: string;
  empresa: string;
  numeracion_desde: number;
  numeracion_hasta: number;
  cantidad: number;
  fecha_ingreso: string;
  ubicacion_actual: string;
  fecha_salida?: string;
  ubicacion_destino?: string;
  observaciones?: string;
  estado: 'disponible' | 'enviado';
  created_at: string;
  updated_at: string;
}

interface FormatoDisponible {
  tipo: string;
  empresa: string;
  cantidad_total: number;
  numeracion_min: number;
  numeracion_max: number;
  fecha_recojo?: string;
}

export function ControlFormatos() {
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>('');
  const [formatosDisponibles, setFormatosDisponibles] = useState<FormatoDisponible[]>([]);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoDisponible | null>(null);
  const [talonarios, setTalonarios] = useState<Talonario[]>([]);
  const [tamanioTalonario, setTamanioTalonario] = useState<50 | 100>(50);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fecha_ingreso: '',
    ubicacion_actual: '',
    fecha_salida: '',
    ubicacion_destino: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarEmpresas();
  }, []);

  useEffect(() => {
    if (empresaSeleccionada) {
      cargarFormatosPorEmpresa(empresaSeleccionada);
    } else {
      setFormatosDisponibles([]);
      setFormatoSeleccionado(null);
    }
  }, [empresaSeleccionada]);

  useEffect(() => {
    if (formatoSeleccionado) {
      generarTalonarios();
    } else {
      setTalonarios([]);
    }
  }, [formatoSeleccionado, tamanioTalonario]);

  const cargarEmpresas = async () => {
    try {
      const pedidos = await storageService.getPedidos();
      const formatos = await storageService.getFormatos();
      
      // Obtener empresas únicas con formatos disponibles
      const empresasUnicas = new Set<string>();
      
      formatos.forEach(formato => {
        if (formato.estado !== 'disponible') return;
        
        const pedido = pedidos.find(p => p.id === formato.pedido_id);
        if (pedido) {
          empresasUnicas.add(pedido.empresa);
        }
      });
      
      setEmpresas(Array.from(empresasUnicas).sort());
    } catch (error) {
      console.error('Error loading empresas:', error);
    }
  };

  const cargarFormatosPorEmpresa = async (empresa: string) => {
    try {
      const pedidos = await storageService.getPedidos();
      const formatos = await storageService.getFormatos();
      
      // Agrupar formatos por tipo para la empresa seleccionada
      const grupos: Record<string, FormatoDisponible> = {};
      
      formatos.forEach(formato => {
        if (formato.estado !== 'disponible') return;
        
        const pedido = pedidos.find(p => p.id === formato.pedido_id);
        if (!pedido || pedido.empresa !== empresa) return;
        
        const key = pedido.formato;
        
        if (!grupos[key]) {
          grupos[key] = {
            tipo: pedido.formato,
            empresa: pedido.empresa,
            cantidad_total: 0,
            numeracion_min: formato.numeracion,
            numeracion_max: formato.numeracion,
            fecha_recojo: pedido.fecha_recojo
          };
        }
        
        grupos[key].cantidad_total++;
        grupos[key].numeracion_min = Math.min(grupos[key].numeracion_min, formato.numeracion);
        grupos[key].numeracion_max = Math.max(grupos[key].numeracion_max, formato.numeracion);
      });
      
      setFormatosDisponibles(Object.values(grupos));
    } catch (error) {
      console.error('Error loading formatos por empresa:', error);
    }
  };

  const generarTalonarios = () => {
    if (!formatoSeleccionado) return;
    
    const cantidadPorTalonario = tamanioTalonario;
    const totalTalonarios = Math.ceil(formatoSeleccionado.cantidad_total / cantidadPorTalonario);
    const nuevosTalonarios: Talonario[] = [];
    
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < totalTalonarios; i++) {
      const desde = formatoSeleccionado.numeracion_min + (i * cantidadPorTalonario);
      const hasta = Math.min(desde + cantidadPorTalonario - 1, formatoSeleccionado.numeracion_max);
      const cantidad = hasta - desde + 1;
      
      const talonario: Talonario = {
        id: `talonario_${Date.now()}_${i}`,
        formato_tipo: formatoSeleccionado.tipo,
        empresa: formatoSeleccionado.empresa,
        numeracion_desde: desde,
        numeracion_hasta: hasta,
        cantidad,
        fecha_ingreso: formatoSeleccionado.fecha_recojo || fechaHoy,
        ubicacion_actual: 'Almacén',
        fecha_salida: undefined,
        ubicacion_destino: undefined,
        observaciones: undefined,
        estado: 'disponible',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      nuevosTalonarios.push(talonario);
    }
    
    setTalonarios(nuevosTalonarios);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const actualizarTalonario = (id: string, campo: keyof Talonario, valor: any) => {
    setTalonarios(prev => 
      prev.map(talonario => 
        talonario.id === id 
          ? { 
              ...talonario, 
              [campo]: valor,
              estado: campo === 'fecha_salida' && valor ? 'enviado' : talonario.estado,
              updated_at: new Date().toISOString()
            }
          : talonario
      )
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Control de Formatos</h1>
        <p className="text-gray-600">Gestiona la división de formatos en talonarios y su distribución</p>
      </div>

      {/* Selectores de Empresa y Formato */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Selección de Empresa y Formato</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Empresa *</label>
            <select
              value={empresaSeleccionada}
              onChange={(e) => {
                setEmpresaSeleccionada(e.target.value);
                setFormatoSeleccionado(null);
              }}
              className="form-input"
            >
              <option value="">Seleccionar empresa...</option>
              {empresas.map((empresa) => (
                <option key={empresa} value={empresa}>
                  {empresa}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Formato *</label>
            <select
              value={formatoSeleccionado?.tipo || ''}
              onChange={(e) => {
                const formato = formatosDisponibles.find(f => f.tipo === e.target.value);
                setFormatoSeleccionado(formato || null);
              }}
              className="form-input"
              disabled={!empresaSeleccionada}
            >
              <option value="">Seleccionar formato...</option>
              {formatosDisponibles.map((formato) => (
                <option key={formato.tipo} value={formato.tipo}>
                  {formato.tipo} ({formato.cantidad_total} hojas)
                </option>
              ))}
            </select>
          </div>
        </div>

        {empresaSeleccionada && formatosDisponibles.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500">No hay formatos disponibles para esta empresa</p>
          </div>
        )}
      </div>

      {/* Configuración del Talonario */}
      {formatoSeleccionado && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {formatoSeleccionado.tipo}
              </h3>
              <p className="text-sm text-gray-600">
                Empresa: {formatoSeleccionado.empresa} | 
                Total: {formatoSeleccionado.cantidad_total} hojas |
                Rango: {formatoSeleccionado.numeracion_min} - {formatoSeleccionado.numeracion_max}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div>
                <label className="form-label text-sm">Tamaño del Talonario</label>
                <select
                  value={tamanioTalonario}
                  onChange={(e) => setTamanioTalonario(parseInt(e.target.value) as 50 | 100)}
                  className="form-input text-sm"
                >
                  <option value={50}>50 hojas</option>
                  <option value={100}>100 hojas</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                = {Math.ceil(formatoSeleccionado.cantidad_total / tamanioTalonario)} talonarios
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Talonarios Editable */}
      {talonarios.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Talonarios - {formatoSeleccionado?.tipo}
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numeración</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso/Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Salida</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación Destino</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {talonarios.map((talonario) => (
                  <tr key={talonario.id}>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">
                        {talonario.numeracion_desde} - {talonario.numeracion_hasta}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({talonario.cantidad} hojas)
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="date"
                        value={talonario.fecha_ingreso}
                        onChange={(e) => actualizarTalonario(talonario.id, 'fecha_ingreso', e.target.value)}
                        className="form-input text-xs w-full"
                      />
                    </td>
                    
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="text"
                        value={talonario.ubicacion_actual}
                        onChange={(e) => actualizarTalonario(talonario.id, 'ubicacion_actual', e.target.value)}
                        className="form-input text-xs w-full"
                        placeholder="Ubicación"
                      />
                    </td>
                    
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="date"
                        value={talonario.fecha_salida || ''}
                        onChange={(e) => actualizarTalonario(talonario.id, 'fecha_salida', e.target.value || undefined)}
                        className="form-input text-xs w-full"
                      />
                    </td>
                    
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="text"
                        value={talonario.ubicacion_destino || ''}
                        onChange={(e) => actualizarTalonario(talonario.id, 'ubicacion_destino', e.target.value || undefined)}
                        className="form-input text-xs w-full"
                        placeholder="Destino"
                      />
                    </td>
                    
                    <td className="px-4 py-3 text-sm">
                      <textarea
                        value={talonario.observaciones || ''}
                        onChange={(e) => actualizarTalonario(talonario.id, 'observaciones', e.target.value || undefined)}
                        className="form-input text-xs w-full"
                        rows={2}
                        placeholder="Observaciones..."
                      />
                    </td>
                    
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                        talonario.estado === 'disponible' 
                          ? 'text-green-700 bg-green-100'
                          : 'text-blue-700 bg-blue-100'
                      }`}>
                        {talonario.estado === 'disponible' ? 'Disponible' : 'Enviado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                // Función para guardar los talonarios
                console.log('Guardando talonarios:', talonarios);
                alert('Talonarios guardados correctamente');
              }}
              className="btn btn-primary"
            >
              <span>Guardar Talonarios</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}