import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building, FileText, Save, X, Upload, Eye } from 'lucide-react';
import { Empresa, TipoFormato } from '../types';
import { storageService } from '../services/storage';

export function GestionEmpresasFormatos() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [tiposFormato, setTiposFormato] = useState<TipoFormato[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'empresas' | 'formatos'>('empresas');
  const [showEmpresaForm, setShowEmpresaForm] = useState(false);
  const [showFormatoForm, setShowFormatoForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [editingFormato, setEditingFormato] = useState<TipoFormato | null>(null);

  const [empresaForm, setEmpresaForm] = useState({
    nombre: '',
    ruc: '',
    activa: true
  });

  const [formatoForm, setFormatoForm] = useState({
    nombre: '',
    descripcion: '',
    empresa_id: '',
    imagen: '',
    activo: true
  });

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empresasData, formatosData] = await Promise.all([
        storageService.getEmpresas(),
        storageService.getTiposFormato()
      ]);
      setEmpresas(empresasData);
      setTiposFormato(formatosData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetEmpresaForm = () => {
    setEmpresaForm({
      nombre: '',
      ruc: '',
      activa: true
    });
    setEditingEmpresa(null);
  };

  const resetFormatoForm = () => {
    setFormatoForm({
      nombre: '',
      descripcion: '',
      empresa_id: '',
      imagen: '',
      activo: true
    });
    setEditingFormato(null);
  };

  const handleEmpresaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmpresa) {
        await storageService.updateEmpresa(editingEmpresa.id, empresaForm);
      } else {
        await storageService.createEmpresa(empresaForm);
      }
      await loadData();
      setShowEmpresaForm(false);
      resetEmpresaForm();
    } catch (error) {
      console.error('Error saving empresa:', error);
    }
  };

  const handleFormatoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFormato) {
        await storageService.updateTipoFormato(editingFormato.id, formatoForm);
      } else {
        await storageService.createTipoFormato(formatoForm);
      }
      await loadData();
      setShowFormatoForm(false);
      resetFormatoForm();
    } catch (error) {
      console.error('Error saving tipo formato:', error);
    }
  };

  const handleEditEmpresa = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setEmpresaForm({
      nombre: empresa.nombre,
      ruc: empresa.ruc || '',
      activa: empresa.activa
    });
    setShowEmpresaForm(true);
  };

  const handleEditFormato = (formato: TipoFormato) => {
    setEditingFormato(formato);
    setFormatoForm({
      nombre: formato.nombre,
      descripcion: formato.descripcion || '',
      empresa_id: formato.empresa_id,
      imagen: formato.imagen || '',
      activo: formato.activo
    });
    setShowFormatoForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormatoForm({...formatoForm, imagen: result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewImage = (imagen: string) => {
    setSelectedImage(imagen);
    setShowImageModal(true);
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta empresa?')) {
      try {
        await storageService.deleteEmpresa(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting empresa:', error);
      }
    }
  };

  const handleDeleteFormato = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este tipo de formato?')) {
      try {
        await storageService.deleteTipoFormato(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting tipo formato:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas y Formatos</h1>
        <p className="text-gray-600">Administre las empresas y tipos de formato del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('empresas')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'empresas'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building className="w-4 h-4 inline-block mr-2" />
          Empresas
        </button>
        <button
          onClick={() => setActiveTab('formatos')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'formatos'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          Tipos de Formato
        </button>
      </div>

      {activeTab === 'empresas' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Empresas</h2>
            <button
              onClick={() => {
                resetEmpresaForm();
                setShowEmpresaForm(true);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Empresa</span>
            </button>
          </div>

          {/* Empresa Form */}
          {showEmpresaForm && (
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
                </h3>
                <button
                  onClick={() => {
                    setShowEmpresaForm(false);
                    resetEmpresaForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEmpresaSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={empresaForm.nombre}
                    onChange={(e) => setEmpresaForm({...empresaForm, nombre: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC
                  </label>
                  <input
                    type="text"
                    value={empresaForm.ruc}
                    onChange={(e) => setEmpresaForm({...empresaForm, ruc: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={empresaForm.activa}
                      onChange={(e) => setEmpresaForm({...empresaForm, activa: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Empresa Activa</span>
                  </label>
                </div>

                <div className="col-span-2 flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmpresaForm(false);
                      resetEmpresaForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingEmpresa ? 'Actualizar' : 'Guardar'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Empresas List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RUC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {empresas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{empresa.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empresa.ruc || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          empresa.activa
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empresa.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditEmpresa(empresa)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmpresa(empresa.id)}
                            className="text-red-600 hover:text-red-900 p-1"
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
          </div>
        </div>
      )}

      {activeTab === 'formatos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Tipos de Formato</h2>
            <button
              onClick={() => {
                resetFormatoForm();
                setShowFormatoForm(true);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Tipo de Formato</span>
            </button>
          </div>

          {/* Formato Form */}
          {showFormatoForm && (
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingFormato ? 'Editar Tipo de Formato' : 'Nuevo Tipo de Formato'}
                </h3>
                <button
                  onClick={() => {
                    setShowFormatoForm(false);
                    resetFormatoForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleFormatoSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formatoForm.nombre}
                    onChange={(e) => setFormatoForm({...formatoForm, nombre: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa *
                  </label>
                  <select
                    required
                    value={formatoForm.empresa_id}
                    onChange={(e) => setFormatoForm({...formatoForm, empresa_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccione una empresa</option>
                    {empresas.filter(e => e.activa).map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={formatoForm.descripcion}
                    onChange={(e) => setFormatoForm({...formatoForm, descripcion: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen Referencial
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    {formatoForm.imagen && (
                      <div className="flex space-x-2">
                        <img 
                          src={formatoForm.imagen} 
                          alt="Vista previa"
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => handleViewImage(formatoForm.imagen)}
                          className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-md"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formatoForm.activo}
                      onChange={(e) => setFormatoForm({...formatoForm, activo: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Formato Activo</span>
                  </label>
                </div>

                <div className="col-span-2 flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFormatoForm(false);
                      resetFormatoForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingFormato ? 'Actualizar' : 'Guardar'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Formatos List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Formato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imagen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tiposFormato.map((formato) => {
                    const empresa = empresas.find(e => e.id === formato.empresa_id);
                    return (
                      <tr key={formato.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{formato.nombre}</div>
                            {formato.descripcion && (
                              <div className="text-sm text-gray-500">{formato.descripcion}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {empresa?.nombre || 'Empresa no encontrada'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formato.imagen ? (
                            <div className="flex items-center space-x-2">
                              <img 
                                src={formato.imagen} 
                                alt={`Imagen de ${formato.nombre}`}
                                className="w-12 h-12 object-cover rounded-md border"
                              />
                              <button
                                onClick={() => handleViewImage(formato.imagen!)}
                                className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin imagen</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            formato.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {formato.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditFormato(formato)}
                              className="text-primary-600 hover:text-primary-900 p-1"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFormato(formato.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-3xl max-h-3xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Vista de Imagen</h3>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex justify-center">
              <img 
                src={selectedImage} 
                alt="Imagen del formato"
                className="max-w-full max-h-96 object-contain rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}