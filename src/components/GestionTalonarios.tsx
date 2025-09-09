import React, { useState, useEffect } from 'react';
import { Package, Settings, Save, Calendar, CheckSquare, Square, Edit3, Send, MapPin, Building, Trash2, RefreshCw } from 'lucide-react';
import { storageService } from '../services/storage';
import { Pedido, Formato } from '../types';

interface TalonarioItem {
  id: string;
  formato_tipo: string;
  empresa: string;
  numeracion_desde: number;
  numeracion_hasta: number;
  cantidad: number;
  fecha_ingreso: string;
  ubicacion_almacen: string;
  fecha_salida: string;
  ubicacion_destino: string;
  observaciones: string;
  estado: 'disponible' | 'enviado';
  created_at: string;
  updated_at: string;
}

interface FormatoInfo {
  tipo: string;
  empresa: string;
  cantidad_total: number;
  numeracion_min: number;
  numeracion_max: number;
  fecha_recojo: string;
}

export function GestionTalonarios() {
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>('');
  const [formatosDisponibles, setFormatosDisponibles] = useState<FormatoInfo[]>([]);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoInfo | null>(null);
  const [talonarios, setTalonarios] = useState<TalonarioItem[]>([]);
  const [tamanioTalonario, setTamanioTalonario] = useState<50 | 100>(100);
  const [loading, setLoading] = useState(false);
  const [talonariosSaved, setTalonariosSaved] = useState<TalonarioItem[]>([]);
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'disponible' | 'enviado'>('todos');
  const [talonariosSeleccionados, setTalonariosSeleccionados] = useState<Set<string>>(new Set());
  const [nuevoTamanio, setNuevoTamanio] = useState<number>(50);
  const [mostrarEditorTamanio, setMostrarEditorTamanio] = useState(false);
  const [cantidadSeleccionar, setCantidadSeleccionar] = useState<number>(1);
  const [mostrarFormularioEnvio, setMostrarFormularioEnvio] = useState(false);
  const [datosEnvio, setDatosEnvio] = useState({
    fechaSalida: '',
    ubicacionDestino: '',
    observaciones: ''
  });
  const [mostrarConfiguradorNuevos, setMostrarConfiguradorNuevos] = useState(false);
  const [formatosNuevosPendientes, setFormatosNuevosPendientes] = useState(0);
  const [tamanioNuevosTalonarios, setTamanioNuevosTalonarios] = useState<50 | 100>(100);
  const [mostrarConfirmacionReset, setMostrarConfirmacionReset] = useState(false);
  const [batchesProcesados, setBatchesProcesados] = useState<Set<string>>(new Set());

  // Función para generar una clave única para un batch de formatos
  const generarClaveBatch = (formato: FormatoInfo): string => {
    return `${formato.empresa}_${formato.tipo}_${formato.numeracion_min}_${formato.numeracion_max}_${formato.fecha_recojo}`;
  };

  // Cargar batches procesados desde localStorage
  const cargarBatchesProcesados = () => {
    try {
      const stored = localStorage.getItem('batches_procesados_talonarios');
      if (stored) {
        setBatchesProcesados(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading processed batches:', error);
    }
  };

  // Guardar batches procesados en localStorage
  const guardarBatchesProcesados = (batches: Set<string>) => {
    try {
      const batchesArray = Array.from(batches);
      localStorage.setItem('batches_procesados_talonarios', JSON.stringify(batchesArray));
    } catch (error) {
      console.error('Error saving processed batches:', error);
    }
  };

  // Marcar un batch como procesado
  const marcarBatchProcesado = (formato: FormatoInfo) => {
    const claveBatch = generarClaveBatch(formato);
    const nuevosBatches = new Set(batchesProcesados);
    nuevosBatches.add(claveBatch);
    setBatchesProcesados(nuevosBatches);
    guardarBatchesProcesados(nuevosBatches);
  };

  const cargarEmpresas = async () => {
    try {
      const pedidos = await storageService.getPedidos();
      const formatos = await storageService.getFormatos();
      
      const empresasUnicas = new Set<string>();
      
      formatos.forEach(formato => {
        if (formato.estado === 'disponible') {
          const pedido = pedidos.find(p => p.id === formato.pedido_id);
          // Solo mostrar empresas de pedidos que ya han sido recogidos
          if (pedido && (pedido.estado === 'recogido' || pedido.estado === 'pagado' || pedido.estado === 'sin pagar')) {
            empresasUnicas.add(pedido.empresa);
          }
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
      
      const grupos: Record<string, FormatoInfo> = {};
      
      formatos.forEach(formato => {
        if (formato.estado === 'disponible') {
          const pedido = pedidos.find(p => p.id === formato.pedido_id);
          // Solo incluir formatos de pedidos recogidos
          if (pedido && pedido.empresa === empresa && (pedido.estado === 'recogido' || pedido.estado === 'pagado' || pedido.estado === 'sin pagar')) {
            const key = pedido.formato;
            
            if (!grupos[key]) {
              grupos[key] = {
                tipo: pedido.formato,
                empresa: pedido.empresa,
                cantidad_total: 0,
                numeracion_min: formato.numeracion,
                numeracion_max: formato.numeracion,
                fecha_recojo: pedido.fecha_recojo || ''
              };
            } else {
              // Si ya existe el grupo, comparar fechas para mantener la más reciente
              const fechaActual = pedido.fecha_recojo || '';
              const fechaExistente = grupos[key].fecha_recojo || '';
              
              if (fechaActual > fechaExistente) {
                grupos[key].fecha_recojo = fechaActual;
              }
            }
            
            grupos[key].cantidad_total++;
            grupos[key].numeracion_min = Math.min(grupos[key].numeracion_min, formato.numeracion);
            grupos[key].numeracion_max = Math.max(grupos[key].numeracion_max, formato.numeracion);
            // Recalcular cantidad_total basado en el rango real
            grupos[key].cantidad_total = grupos[key].numeracion_max - grupos[key].numeracion_min + 1;
          }
        }
      });
      
      setFormatosDisponibles(Object.values(grupos));
    } catch (error) {
      console.error('Error loading formatos por empresa:', error);
    }
  };

  const cargarTalonariosExistentes = async () => {
    if (!formatoSeleccionado) return;
    
    try {
      const filename = `talonarios_${formatoSeleccionado.empresa.replace(/[^a-zA-Z0-9]/g, '_')}_${formatoSeleccionado.tipo.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      const talonariosExistentes: TalonarioItem[] = JSON.parse(localStorage.getItem(filename) || '[]');
      setTalonariosSaved(talonariosExistentes);
    } catch (error) {
      console.error('Error loading existing talonarios:', error);
      setTalonariosSaved([]);
    }
  };

  const verificarFormatosNuevos = async () => {
    if (!formatoSeleccionado) return;
    
    // Verificar si este batch ya ha sido procesado
    const claveBatch = generarClaveBatch(formatoSeleccionado);
    if (batchesProcesados.has(claveBatch)) {
      // El batch ya fue procesado, solo actualizar tamaño de talonarios existentes disponibles
      actualizarTamanioTalonariosDisponibles();
      return;
    }
    
    // Calcular la cantidad real de hojas basada en el rango
    const cantidadRealHojas = formatoSeleccionado.numeracion_max - formatoSeleccionado.numeracion_min + 1;
    
    // Calcular cuántos formatos nuevos hay disponibles
    let maxNumeracion = 0;
    if (talonariosSaved.length > 0) {
      maxNumeracion = Math.max(...talonariosSaved.map(t => t.numeracion_hasta));
    } else {
      maxNumeracion = formatoSeleccionado.numeracion_min - 1; // Para empezar desde el inicio
    }
    
    const formatosNuevos = formatoSeleccionado.numeracion_max - maxNumeracion;
    
    if (formatosNuevos > 0) {
      setFormatosNuevosPendientes(formatosNuevos);
      setMostrarConfiguradorNuevos(true);
    } else {
      // No hay formatos nuevos pero es la primera vez que vemos este batch, marcarlo como procesado
      marcarBatchProcesado(formatoSeleccionado);
      // Solo actualizar tamaño de talonarios existentes disponibles
      actualizarTamanioTalonariosDisponibles();
    }
  };

  const actualizarTamanioTalonariosDisponibles = async () => {
    if (!formatoSeleccionado) return;
    
    const fechaHoy = new Date().toISOString().split('T')[0];
    const pedidos = await storageService.getPedidos();
    const formatos = await storageService.getFormatos();
    
    // Solo regenerar talonarios que estén disponibles (no enviados)
    const talonariosDisponibles = talonariosSaved.filter(t => t.estado === 'disponible');
    const talonariosEnviados = talonariosSaved.filter(t => t.estado === 'enviado');
    
    if (talonariosDisponibles.length === 0) {
      setTalonarios([...talonariosEnviados]);
      return;
    }
    
    // Calcular el rango total de numeración de talonarios disponibles
    const numeracionMin = Math.min(...talonariosDisponibles.map(t => t.numeracion_desde));
    const numeracionMax = Math.max(...talonariosDisponibles.map(t => t.numeracion_hasta));
    const totalHojasDisponibles = numeracionMax - numeracionMin + 1;
    
    // Regenerar talonarios disponibles con nuevo tamaño
    const cantidadPorTalonario = tamanioTalonario;
    const totalTalonarios = Math.ceil(totalHojasDisponibles / cantidadPorTalonario);
    const talonariosRegenerados: TalonarioItem[] = [];
    
    for (let i = 0; i < totalTalonarios; i++) {
      const desde = numeracionMin + (i * cantidadPorTalonario);
      const hasta = Math.min(desde + cantidadPorTalonario - 1, numeracionMax);
      const cantidad = hasta - desde + 1;
      
      // Encontrar fecha correcta
      let fechaIngresoCorrecta = fechaHoy;
      const formatoCorrespondiente = formatos.find(formato => 
        formato.numeracion >= desde && formato.numeracion <= hasta &&
        formato.estado === 'disponible'
      );
      
      if (formatoCorrespondiente) {
        const pedidoCorrespondiente = pedidos.find(p => 
          p.id === formatoCorrespondiente.pedido_id &&
          p.empresa === formatoSeleccionado.empresa &&
          p.formato === formatoSeleccionado.tipo
        );
        
        if (pedidoCorrespondiente && pedidoCorrespondiente.fecha_recojo) {
          fechaIngresoCorrecta = pedidoCorrespondiente.fecha_recojo;
        }
      }
      
      const talonario: TalonarioItem = {
        id: `talonario_disponible_${Date.now()}_${i}`,
        formato_tipo: formatoSeleccionado.tipo,
        empresa: formatoSeleccionado.empresa,
        numeracion_desde: desde,
        numeracion_hasta: hasta,
        cantidad,
        fecha_ingreso: fechaIngresoCorrecta,
        ubicacion_almacen: 'Almacén',
        fecha_salida: '',
        ubicacion_destino: '',
        observaciones: '',
        estado: 'disponible',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      talonariosRegenerados.push(talonario);
    }
    
    // Combinar enviados (sin cambios) + disponibles (regenerados)
    setTalonarios([...talonariosEnviados, ...talonariosRegenerados]);
  };

  const procesarNuevosFormatos = async () => {
    if (!formatoSeleccionado || formatosNuevosPendientes === 0) return;
    
    const fechaHoy = new Date().toISOString().split('T')[0];
    const pedidos = await storageService.getPedidos();
    const formatos = await storageService.getFormatos();
    
    // Calcular la numeración de inicio para los nuevos
    let maxNumeracion = 0;
    if (talonariosSaved.length > 0) {
      maxNumeracion = Math.max(...talonariosSaved.map(t => t.numeracion_hasta));
    }
    
    const numeracionInicio = maxNumeracion > 0 ? maxNumeracion + 1 : formatoSeleccionado.numeracion_min;
    const cantidadPorTalonario = tamanioNuevosTalonarios;
    const talonariosNuevos = Math.ceil(formatosNuevosPendientes / cantidadPorTalonario);
    const nuevosT: TalonarioItem[] = [];
    
    for (let i = 0; i < talonariosNuevos; i++) {
      const desde = numeracionInicio + (i * cantidadPorTalonario);
      const hasta = Math.min(desde + cantidadPorTalonario - 1, formatoSeleccionado.numeracion_max);
      const cantidad = hasta - desde + 1;
      
      // Encontrar fecha correcta
      let fechaIngresoCorrecta = fechaHoy;
      const formatoCorrespondiente = formatos.find(formato => 
        formato.numeracion >= desde && formato.numeracion <= hasta &&
        formato.estado === 'disponible'
      );
      
      if (formatoCorrespondiente) {
        const pedidoCorrespondiente = pedidos.find(p => 
          p.id === formatoCorrespondiente.pedido_id &&
          p.empresa === formatoSeleccionado.empresa &&
          p.formato === formatoSeleccionado.tipo
        );
        
        if (pedidoCorrespondiente && pedidoCorrespondiente.fecha_recojo) {
          fechaIngresoCorrecta = pedidoCorrespondiente.fecha_recojo;
        }
      }
      
      const nuevoTalonario: TalonarioItem = {
        id: `talonario_nuevo_${Date.now()}_${i}`,
        formato_tipo: formatoSeleccionado.tipo,
        empresa: formatoSeleccionado.empresa,
        numeracion_desde: desde,
        numeracion_hasta: hasta,
        cantidad,
        fecha_ingreso: fechaIngresoCorrecta,
        ubicacion_almacen: 'Almacén',
        fecha_salida: '',
        ubicacion_destino: '',
        observaciones: '',
        estado: 'disponible',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      nuevosT.push(nuevoTalonario);
    }
    
    // Agregar los nuevos talonarios a los existentes
    setTalonarios([...talonariosSaved, ...nuevosT]);
    setMostrarConfiguradorNuevos(false);
    setFormatosNuevosPendientes(0);
    
    // Marcar este batch como procesado
    if (formatoSeleccionado) {
      marcarBatchProcesado(formatoSeleccionado);
    }
  };

  const resetearTodosLosDatos = () => {
    // Limpiar localStorage de talonarios y batches procesados
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('talonarios_') || key === 'batches_procesados_talonarios') {
        localStorage.removeItem(key);
      }
    });
    
    // Resetear todos los estados
    setEmpresas([]);
    setEmpresaSeleccionada('');
    setFormatosDisponibles([]);
    setFormatoSeleccionado(null);
    setTalonarios([]);
    setTalonariosSaved([]);
    setTalonariosSeleccionados(new Set());
    setFiltroMes('');
    setFiltroEstado('todos');
    setCantidadSeleccionar(1);
    setMostrarFormularioEnvio(false);
    setMostrarEditorTamanio(false);
    setMostrarConfiguradorNuevos(false);
    setFormatosNuevosPendientes(0);
    setMostrarConfirmacionReset(false);
    setBatchesProcesados(new Set());
    
    // Recargar datos desde cero
    cargarEmpresas();
  };

  const actualizarTalonario = (id: string, campo: keyof TalonarioItem, valor: any) => {
    setTalonarios(prev => 
      prev.map(talonario => 
        talonario.id === id 
          ? { 
              ...talonario, 
              [campo]: valor,
              estado: campo === 'fecha_salida' && valor ? 'enviado' : 
                     campo === 'fecha_salida' && !valor ? 'disponible' : talonario.estado,
              updated_at: new Date().toISOString()
            }
          : talonario
      )
    );
  };

  const obtenerMesesDisponibles = () => {
    const meses = new Set<string>();
    talonarios.forEach(talonario => {
      // Usar fecha de salida para el filtro por mes
      const fecha = talonario.fecha_salida;
      if (fecha) {
        const mes = fecha.substring(0, 7); // YYYY-MM
        meses.add(mes);
      }
    });
    return Array.from(meses).sort().reverse(); // Más reciente primero
  };

  const talonariosFiltrados = talonarios.filter(talonario => {
    // Filtrar por mes usando fecha de salida
    const filtroMesOk = !filtroMes || 
      (talonario.fecha_salida && talonario.fecha_salida.startsWith(filtroMes));
    
    const filtroEstadoOk = filtroEstado === 'todos' || talonario.estado === filtroEstado;
    
    return filtroMesOk && filtroEstadoOk;
  });

  const toggleSeleccionTalonario = (id: string) => {
    const nuevaSeleccion = new Set(talonariosSeleccionados);
    if (nuevaSeleccion.has(id)) {
      nuevaSeleccion.delete(id);
    } else {
      nuevaSeleccion.add(id);
    }
    setTalonariosSeleccionados(nuevaSeleccion);
  };

  const seleccionarTodos = () => {
    if (talonariosSeleccionados.size === talonariosFiltrados.length) {
      setTalonariosSeleccionados(new Set());
    } else {
      setTalonariosSeleccionados(new Set(talonariosFiltrados.map(t => t.id)));
    }
  };

  const seleccionarCantidad = () => {
    if (cantidadSeleccionar <= 0) {
      alert('Ingresa una cantidad válida mayor a 0');
      return;
    }

    // Filtrar solo los disponibles para selección automática
    const talonariosDisponibles = talonariosFiltrados.filter(t => t.estado === 'disponible');
    
    if (cantidadSeleccionar > talonariosDisponibles.length) {
      alert(`Solo hay ${talonariosDisponibles.length} talonarios disponibles. No se pueden seleccionar ${cantidadSeleccionar}.`);
      return;
    }

    // Seleccionar los primeros N talonarios disponibles
    const idsASeleccionar = talonariosDisponibles
      .slice(0, cantidadSeleccionar)
      .map(t => t.id);
    
    setTalonariosSeleccionados(new Set(idsASeleccionar));
  };

  const contarTalonariosPorEstado = () => {
    const disponibles = talonariosFiltrados.filter(t => t.estado === 'disponible').length;
    const enviados = talonariosFiltrados.filter(t => t.estado === 'enviado').length;
    return { disponibles, enviados };
  };

  const procesarEnvioMasivo = () => {
    if (talonariosSeleccionados.size === 0) {
      alert('Selecciona al menos un talonario para enviar.');
      return;
    }

    if (!datosEnvio.fechaSalida || !datosEnvio.ubicacionDestino) {
      alert('La fecha de salida y ubicación de destino son obligatorias.');
      return;
    }

    const talonariosAEnviar = Array.from(talonariosSeleccionados)
      .map(id => talonarios.find(t => t.id === id))
      .filter(t => t && t.estado === 'disponible');

    if (talonariosAEnviar.length === 0) {
      alert('No hay talonarios disponibles seleccionados para enviar.');
      return;
    }

    const confirmar = window.confirm(
      `¿Confirmar envío masivo?\n\n` +
      `• Talonarios a enviar: ${talonariosAEnviar.length}\n` +
      `• Fecha de salida: ${datosEnvio.fechaSalida}\n` +
      `• Destino: ${datosEnvio.ubicacionDestino}\n` +
      `• Observaciones: ${datosEnvio.observaciones || 'Ninguna'}\n\n` +
      `Esto cambiará el estado de los talonarios a "Enviado".`
    );

    if (!confirmar) return;

    // Actualizar todos los talonarios seleccionados
    setTalonarios(prev => 
      prev.map(talonario => {
        if (talonariosSeleccionados.has(talonario.id) && talonario.estado === 'disponible') {
          return {
            ...talonario,
            fecha_salida: datosEnvio.fechaSalida,
            ubicacion_destino: datosEnvio.ubicacionDestino,
            observaciones: datosEnvio.observaciones,
            estado: 'enviado' as const,
            updated_at: new Date().toISOString()
          };
        }
        return talonario;
      })
    );

    // Limpiar formulario y selecciones
    setTalonariosSeleccionados(new Set());
    setDatosEnvio({ fechaSalida: '', ubicacionDestino: '', observaciones: '' });
    setMostrarFormularioEnvio(false);

    alert(`✅ Envío masivo completado\n\n${talonariosAEnviar.length} talonarios han sido marcados como enviados.`);
  };

  const cambiarTamanioSeleccionados = () => {
    if (talonariosSeleccionados.size === 0) {
      alert('Selecciona al menos un talonario para cambiar su tamaño.');
      return;
    }

    const talonariosACambiar = talonarios.filter(t => talonariosSeleccionados.has(t.id));
    const totalHojas = talonariosACambiar.reduce((sum, t) => sum + t.cantidad, 0);
    const nuevosNumerosTalonarios = Math.ceil(totalHojas / nuevoTamanio);
    
    const confirmar = window.confirm(
      `¿Confirmar cambio de tamaño?\n\n` +
      `• Talonarios seleccionados: ${talonariosSeleccionados.size}\n` +
      `• Total de hojas: ${totalHojas}\n` +
      `• Nuevo tamaño por talonario: ${nuevoTamanio} hojas\n` +
      `• Nuevos talonarios resultantes: ${nuevosNumerosTalonarios}`
    );
    
    if (!confirmar) return;

    // Encontrar el rango de numeración de los talonarios seleccionados
    const numeracionMin = Math.min(...talonariosACambiar.map(t => t.numeracion_desde));
    const numeracionMax = Math.max(...talonariosACambiar.map(t => t.numeracion_hasta));
    
    // Crear nuevos talonarios con el nuevo tamaño
    const nuevosT: TalonarioItem[] = [];
    const primerTalonario = talonariosACambiar[0];
    
    for (let i = 0; i < nuevosNumerosTalonarios; i++) {
      const desde = numeracionMin + (i * nuevoTamanio);
      const hasta = Math.min(desde + nuevoTamanio - 1, numeracionMax);
      const cantidad = hasta - desde + 1;
      
      const nuevoTalonario: TalonarioItem = {
        id: `talonario_${Date.now()}_${i}_resized`,
        formato_tipo: primerTalonario.formato_tipo,
        empresa: primerTalonario.empresa,
        numeracion_desde: desde,
        numeracion_hasta: hasta,
        cantidad,
        fecha_ingreso: primerTalonario.fecha_ingreso,
        ubicacion_almacen: primerTalonario.ubicacion_almacen,
        fecha_salida: primerTalonario.fecha_salida,
        ubicacion_destino: primerTalonario.ubicacion_destino,
        observaciones: `Redimensionado: ${nuevoTamanio} hojas/talonario`,
        estado: primerTalonario.estado,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      nuevosT.push(nuevoTalonario);
    }
    
    // Reemplazar talonarios seleccionados con los nuevos
    const talonariosActualizados = talonarios.filter(t => !talonariosSeleccionados.has(t.id));
    talonariosActualizados.push(...nuevosT);
    talonariosActualizados.sort((a, b) => a.numeracion_desde - b.numeracion_desde);
    
    setTalonarios(talonariosActualizados);
    setTalonariosSeleccionados(new Set());
    setMostrarEditorTamanio(false);
    
    alert(`✅ Talonarios redimensionados correctamente\n\nSe crearon ${nuevosNumerosTalonarios} talonarios de ${nuevoTamanio} hojas cada uno.`);
  };

  const guardarTalonarios = async () => {
    if (!formatoSeleccionado) return;
    
    setLoading(true);
    try {
      const filename = `talonarios_${formatoSeleccionado.empresa.replace(/[^a-zA-Z0-9]/g, '_')}_${formatoSeleccionado.tipo.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      localStorage.setItem(filename, JSON.stringify(talonarios));
      
      const talonariosNuevos = talonarios.length - talonariosSaved.length;
      
      if (talonariosNuevos > 0) {
        alert(`Se guardaron ${talonarios.length} talonarios correctamente.\n\n✨ ${talonariosNuevos} talonarios nuevos fueron agregados automáticamente al detectar nuevos formatos.`);
      } else {
        alert(`Se guardaron ${talonarios.length} talonarios correctamente.`);
      }
      
      setTalonariosSaved([...talonarios]);
      
    } catch (error) {
      console.error('Error saving talonarios:', error);
      alert('Error al guardar los talonarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEmpresas();
    cargarBatchesProcesados();
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
      cargarTalonariosExistentes();
    } else {
      setTalonarios([]);
      setTalonariosSaved([]);
    }
  }, [formatoSeleccionado]);

  useEffect(() => {
    if (formatoSeleccionado && talonariosSaved.length >= 0) {
      verificarFormatosNuevos();
    }
  }, [formatoSeleccionado, talonariosSaved]);

  useEffect(() => {
    if (formatoSeleccionado && talonariosSaved.length > 0) {
      actualizarTamanioTalonariosDisponibles();
    }
  }, [tamanioTalonario]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="p-6">
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 shadow-sm">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestión de Talonarios</h1>
                  <p className="text-gray-600">Sistema de control y división de formatos en talonarios con integración automática</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selectores de Empresa y Formato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-2 shadow-sm">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Selección de Empresa y Formato
            </h2>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Building className="w-4 h-4 mr-2 text-blue-500" />
                Empresa *
              </label>
              <select
                value={empresaSeleccionada}
                onChange={(e) => {
                  setEmpresaSeleccionada(e.target.value);
                  setFormatoSeleccionado(null);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">-- Seleccionar empresa --</option>
                {empresas.map((empresa) => (
                  <option key={empresa} value={empresa}>
                    {empresa}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Package className="w-4 h-4 mr-2 text-green-500" />
                Formato *
              </label>
              <select
                value={formatoSeleccionado?.tipo || ''}
                onChange={(e) => {
                  const formato = formatosDisponibles.find(f => f.tipo === e.target.value);
                  setFormatoSeleccionado(formato || null);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!empresaSeleccionada}
              >
                <option value="">-- Seleccionar formato --</option>
                {formatosDisponibles.map((formato) => (
                  <option key={formato.tipo} value={formato.tipo}>
                    {formato.tipo} ({formato.numeracion_max - formato.numeracion_min + 1} hojas: #{formato.numeracion_min}-#{formato.numeracion_max})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {empresaSeleccionada && formatosDisponibles.length === 0 && (
            <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No hay formatos disponibles para esta empresa</p>
              <p className="text-gray-500 text-sm mt-1">Asegúrate de que los pedidos estén marcados como "recogido"</p>
            </div>
          )}
        </div>

        {/* Configuración del Talonario */}
        {formatoSeleccionado && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            {!formatoSeleccionado.fecha_recojo && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-yellow-800 text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-800 font-medium mb-1">Advertencia: Sin fecha de recojo</p>
                    <p className="text-sm text-yellow-700">
                      Este pedido no tiene fecha de recojo registrada. Los talonarios se crearán con fecha actual, pero se recomienda actualizar la fecha de recojo del pedido primero.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Header del formato */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-3 shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {formatoSeleccionado.tipo}
                  </h3>
                  <p className="text-gray-600 text-sm">{formatoSeleccionado.empresa}</p>
                </div>
              </div>
              {talonariosSaved.length > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-full shadow-lg">
                    <span className="font-bold text-lg">
                      ✓ {talonariosSaved.filter(t => t.estado === 'disponible').length} DISPONIBLES
                    </span>
                  </div>
                  {talonarios.length > talonariosSaved.length && (
                    <div className="bg-blue-100 border-2 border-blue-300 px-4 py-2 rounded-full">
                      <span className="text-blue-700 font-semibold text-sm">
                        +{talonarios.length - talonariosSaved.length} nuevos
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {(formatoSeleccionado.numeracion_max - formatoSeleccionado.numeracion_min + 1).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Total de hojas</p>
                </div>
              </div>
              
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <span className="text-purple-600 font-bold text-sm">#</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatoSeleccionado.numeracion_min} - {formatoSeleccionado.numeracion_max}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Rango de numeración</p>
                </div>
              </div>
              
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <span className={`text-2xl font-bold ${
                      formatoSeleccionado.fecha_recojo ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {formatoSeleccionado.fecha_recojo ? 
                        formatoSeleccionado.fecha_recojo.split('-').reverse().join('/') : 
                        'Sin fecha'
                      }
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Fecha de ingreso</p>
                </div>
              </div>
            </div>

            {/* Talonarios Count Display */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-center">
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 text-center">
                  <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent text-4xl font-bold mb-1">
                    {talonarios.length}
                  </div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider">
                    Talonarios generados
                  </div>
                </div>
              </div>
            </div>
          
          {talonarios.length > talonariosSaved.length && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Integración automática:</span> Se detectaron {talonarios.length - talonariosSaved.length} talonarios nuevos desde la numeración {talonariosSaved.length > 0 ? Math.max(...talonariosSaved.map(t => t.numeracion_hasta)) + 1 : formatoSeleccionado.numeracion_min}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* Modal Configurador de Nuevos Talonarios */}
        {mostrarConfiguradorNuevos && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Nuevos Formatos Detectados!
                </h3>
                <p className="text-gray-600">
                  Se encontraron <span className="font-bold text-blue-600">{formatosNuevosPendientes}</span> nuevos números de formatos.
                  Configura cómo quieres dividirlos en talonarios.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tamaño para los nuevos talonarios:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTamanioNuevosTalonarios(50)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        tamanioNuevosTalonarios === 50
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg font-bold">50</div>
                      <div className="text-xs text-gray-600">hojas/talonario</div>
                      <div className="text-xs text-gray-500 mt-1">
                        ≈ {Math.ceil(formatosNuevosPendientes / 50)} talonarios
                      </div>
                    </button>
                    <button
                      onClick={() => setTamanioNuevosTalonarios(100)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        tamanioNuevosTalonarios === 100
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg font-bold">100</div>
                      <div className="text-xs text-gray-600">hojas/talonario</div>
                      <div className="text-xs text-gray-500 mt-1">
                        ≈ {Math.ceil(formatosNuevosPendientes / 100)} talonarios
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setMostrarConfiguradorNuevos(false);
                    // Marcar como procesado incluso si se cancela, para evitar que aparezca de nuevo
                    if (formatoSeleccionado) {
                      marcarBatchProcesado(formatoSeleccionado);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarNuevosFormatos}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 font-medium transition-all shadow-sm"
                >
                  Crear Talonarios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmación Reset */}
        {mostrarConfirmacionReset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <Trash2 className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¿Limpiar todos los datos?
                </h3>
                <p className="text-gray-600">
                  Esta acción eliminará permanentemente:
                </p>
                <ul className="text-left text-sm text-gray-600 mt-3 space-y-1">
                  <li>• Todos los talonarios guardados</li>
                  <li>• Configuraciones de empresas y formatos</li>
                  <li>• Historial de envíos</li>
                  <li>• Todas las fechas y ubicaciones</li>
                </ul>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Esta acción NO se puede deshacer
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setMostrarConfirmacionReset(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={resetearTodosLosDatos}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, Limpiar Todo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y Controles */}
        {talonarios.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-2 shadow-sm">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Filtros y Controles
                </h2>
              </div>
              <div className="flex items-center space-x-3">
                {talonariosSeleccionados.size > 0 && (
                  <>
                    <button
                      onClick={() => setMostrarFormularioEnvio(!mostrarFormularioEnvio)}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 shadow-sm transition-all duration-200 font-medium"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar ({talonariosSeleccionados.size})</span>
                    </button>
                  </>
                )}
                <button
                  onClick={guardarTalonarios}
                  disabled={loading}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all duration-200 font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Guardando...' : 'Guardar Talonarios'}</span>
                </button>
              </div>
          </div>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                  Filtrar por mes de salida
                </label>
                <select
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">Todos los meses</option>
                  {obtenerMesesDisponibles().map(mes => {
                    const [year, month] = mes.split('-');
                    const fecha = new Date(parseInt(year), parseInt(month) - 1, 1);
                    const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                    return (
                      <option key={mes} value={mes}>
                        {nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}
                      </option>
                    );
                  })}
                </select>
              </div>
            
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <CheckSquare className="w-4 h-4 mr-2 text-green-500" />
                  Filtrar por estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'disponible' | 'enviado')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="disponible">Solo Disponibles</option>
                  <option value="enviado">Solo Enviados</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Seleccionar cantidad
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={cantidadSeleccionar}
                    onChange={(e) => setCantidadSeleccionar(parseInt(e.target.value) || 1)}
                    min="1"
                    max={contarTalonariosPorEstado().disponibles}
                    className="w-20 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-center hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                    placeholder="1"
                  />
                  <button
                    onClick={seleccionarCantidad}
                    disabled={contarTalonariosPorEstado().disponibles === 0}
                    className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm transition-all duration-200"
                  >
                    Seleccionar
                  </button>
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {contarTalonariosPorEstado().disponibles} disponibles
                </div>
              </div>
            
          </div>
          
          {mostrarFormularioEnvio && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Envío masivo de talonarios
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Completar datos para {talonariosSeleccionados.size} talonarios seleccionados
                  </p>
                </div>
                <button
                  onClick={() => setMostrarFormularioEnvio(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de salida *
                  </label>
                  <input
                    type="date"
                    value={datosEnvio.fechaSalida}
                    onChange={(e) => setDatosEnvio(prev => ({ ...prev, fechaSalida: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación destino *
                  </label>
                  <input
                    type="text"
                    value={datosEnvio.ubicacionDestino}
                    onChange={(e) => setDatosEnvio(prev => ({ ...prev, ubicacionDestino: e.target.value }))}
                    placeholder="Ej: Oficina Central, Sucursal Lima..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    value={datosEnvio.observaciones}
                    onChange={(e) => setDatosEnvio(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Comentarios adicionales..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setMostrarFormularioEnvio(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarEnvioMasivo}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirmar Envío</span>
                </button>
              </div>
            </div>
          )}
          
        </div>
      )}

      {/* Tabla de Talonarios Editable */}
      {talonariosFiltrados.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Tabla de Talonarios - {formatoSeleccionado?.tipo}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>
                  {filtroEstado !== 'todos' && `${filtroEstado.charAt(0).toUpperCase() + filtroEstado.slice(1)} • `}
                  {filtroMes && (() => {
                    const [year, month] = filtroMes.split('-');
                    const fecha = new Date(parseInt(year), parseInt(month) - 1, 1);
                    return `${fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} • `;
                  })()}
                  {talonariosFiltrados.length} talonarios
                </span>
                <span className="text-green-600 font-medium">
                  ✓ {contarTalonariosPorEstado().disponibles} disponibles
                </span>
                <span className="text-blue-600 font-medium">
                  → {contarTalonariosPorEstado().enviados} enviados
                </span>
                {talonariosSeleccionados.size > 0 && (
                  <span className="text-purple-600 font-medium">
                    ✓ {talonariosSeleccionados.size} seleccionados
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTalonariosSeleccionados(new Set())}
                disabled={talonariosSeleccionados.size === 0}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Limpiar selección
              </button>
              <button
                onClick={seleccionarTodos}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {talonariosSeleccionados.size === talonariosFiltrados.length ? 
                  <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />
                }
                <span>
                  {talonariosSeleccionados.size === talonariosFiltrados.length ? 'Deseleccionar' : 'Seleccionar'} Todos
                </span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={talonariosSeleccionados.size === talonariosFiltrados.length && talonariosFiltrados.length > 0}
                      onChange={seleccionarTodos}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numeración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso/Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Salida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {talonariosFiltrados.map((talonario, index) => (
                  <tr 
                    key={talonario.id} 
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      ${talonariosSeleccionados.has(talonario.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                      ${talonario.estado === 'enviado' ? 'opacity-75' : ''}
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={talonariosSeleccionados.has(talonario.id)}
                        onChange={() => toggleSeleccionTalonario(talonario.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {talonario.numeracion_desde} - {talonario.numeracion_hasta}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({talonario.cantidad} hojas)
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="date"
                        value={talonario.fecha_ingreso}
                        onChange={(e) => actualizarTalonario(talonario.id, 'fecha_ingreso', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={talonario.ubicacion_almacen}
                        onChange={(e) => actualizarTalonario(talonario.id, 'ubicacion_almacen', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Ubicación"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="date"
                        value={talonario.fecha_salida}
                        onChange={(e) => actualizarTalonario(talonario.id, 'fecha_salida', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={talonario.ubicacion_destino}
                        onChange={(e) => actualizarTalonario(talonario.id, 'ubicacion_destino', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Destino"
                      />
                    </td>
                    
                    <td className="px-6 py-4">
                      <textarea
                        value={talonario.observaciones}
                        onChange={(e) => actualizarTalonario(talonario.id, 'observaciones', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                        placeholder="Observaciones..."
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          talonario.estado === 'disponible' 
                            ? 'text-green-800 bg-green-100'
                            : 'text-blue-800 bg-blue-100'
                        }`}>
                          {talonario.estado === 'disponible' ? 'Disponible' : 'Enviado'}
                        </span>
                        {talonariosSeleccionados.has(talonario.id) && (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}