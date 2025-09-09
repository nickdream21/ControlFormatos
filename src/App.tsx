import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { PedidosList } from './components/PedidosList';
import { PedidoForm } from './components/PedidoForm';
import { ReportesList } from './components/ReportesList';
import { GestionTalonarios } from './components/GestionTalonarios';
import { GestionEmpresasFormatos } from './components/GestionEmpresasFormatos';
import { Sidebar } from './components/Sidebar';
import { Pedido, Formato, DashboardMetrics } from './types';
import { storageService } from './services/storage';

function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [formatos, setFormatos] = useState<Formato[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_pedidos: 0,
    pedidos_pendientes: 0,
    pedidos_completados: 0,
    monto_total: 0,
    monto_pagado: 0,
    monto_pendiente: 0,
    formatos_disponibles: 0,
    formatos_asignados: 0,
    formatos_entregados: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosData, formatosData] = await Promise.all([
        storageService.getPedidos(),
        storageService.getFormatos(),
      ]);
      
      setPedidos(pedidosData);
      setFormatos(formatosData);
      calculateMetrics(pedidosData, formatosData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (pedidosData: Pedido[], formatosData: Formato[]) => {
    const metrics: DashboardMetrics = {
      total_pedidos: pedidosData.length,
      pedidos_pendientes: pedidosData.filter(p => p.estado === 'por recoger' || p.estado === 'sin pagar').length,
      pedidos_completados: pedidosData.filter(p => p.estado === 'pagado').length,
      monto_total: pedidosData.reduce((sum, p) => sum + p.monto, 0),
      monto_pagado: pedidosData.filter(p => p.pagado).reduce((sum, p) => sum + p.monto, 0),
      monto_pendiente: pedidosData.filter(p => !p.pagado).reduce((sum, p) => sum + p.monto, 0),
      formatos_disponibles: formatosData.filter(f => f.estado === 'disponible').length,
      formatos_asignados: formatosData.filter(f => f.estado === 'asignado').length,
      formatos_entregados: formatosData.filter(f => f.estado === 'entregado').length,
    };
    
    setMetrics(metrics);
  };

  const handlePedidoCreated = () => {
    loadData();
  };

  const handlePedidoUpdated = () => {
    loadData();
  };

  const handleFormatoUpdated = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  metrics={metrics} 
                  pedidos={pedidos} 
                  formatos={formatos} 
                />
              } 
            />
            <Route 
              path="/pedidos" 
              element={
                <PedidosList 
                  pedidos={pedidos} 
                  onPedidoUpdated={handlePedidoUpdated}
                />
              } 
            />
            <Route 
              path="/pedidos/nuevo" 
              element={
                <PedidoForm 
                  onPedidoCreated={handlePedidoCreated} 
                />
              } 
            />
            <Route 
              path="/pedidos/editar/:id" 
              element={
                <PedidoForm 
                  onPedidoCreated={handlePedidoUpdated}
                  isEdit={true}
                />
              } 
            />
            <Route 
              path="/reportes" 
              element={
                <ReportesList 
                  pedidos={pedidos} 
                />
              } 
            />
            <Route 
              path="/gestion-talonarios" 
              element={<GestionTalonarios />} 
            />
            <Route 
              path="/empresas-formatos" 
              element={<GestionEmpresasFormatos />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;