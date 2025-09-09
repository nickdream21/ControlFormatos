# Control de Formatos SGV

Sistema de control documentario para manejo de pedidos de imprenta y seguimiento individual de formatos.

## Características

- **Dashboard con métricas**: Resumen visual del estado del sistema
- **Gestión de pedidos**: CRUD completo para pedidos de imprenta
- **Control de formatos**: Seguimiento individual de cada formato
- **Búsquedas y filtros**: Por empresa, estado, fechas
- **Numeración correlativa**: Bloques automáticos de 50/100 unidades
- **Persistencia local**: Datos almacenados en archivos JSON

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Desktop**: Electron
- **Iconografía**: Lucide React
- **Dates**: date-fns
- **Routing**: React Router DOM

## Entidades

### Pedidos
- Fecha, formato, empresa
- Cantidad, numeración inicial
- Estado: "por recoger", "recogido", "pagado", "sin pagar"
- Monto y estado de pago
- Fecha de recojo

### Formatos
- Numeración correlativa
- Fecha de ingreso
- Ubicación actual y destino
- Destinatario
- Observaciones
- Estado: "disponible", "asignado", "entregado"

## Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run electron-dev

# Construcción
npm run build
npm run dist
```

## Scripts Disponibles

- `npm start`: Inicia el servidor de desarrollo de React
- `npm run electron-dev`: Ejecuta la aplicación en modo desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run dist`: Genera el ejecutable para distribución

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Sidebar.tsx      # Navegación lateral
│   ├── PedidoForm.tsx   # Formulario de pedidos
│   ├── PedidosList.tsx  # Lista de pedidos
│   ├── FormatosList.tsx # Lista de formatos
│   └── FormatoDetail.tsx # Detalle de formato
├── services/            # Servicios de datos
│   └── storage.ts       # Servicio de almacenamiento JSON
├── types/               # Tipos TypeScript
│   └── index.ts         # Definiciones de tipos
├── App.tsx              # Componente principal
└── index.tsx            # Punto de entrada
```

## Funcionalidades Implementadas

### ✅ Dashboard
- Métricas de resumen
- Pedidos recientes
- Formatos pendientes
- Indicadores visuales

### ✅ Pedidos
- Crear nuevos pedidos
- Lista con filtros y búsqueda
- Estados y seguimiento
- Numeración automática

### ✅ Formatos
- Control individual
- Detalle completo
- Edición de estados
- Vinculación con pedidos

### ✅ Sistema
- Navegación completa
- Persistencia de datos
- Interfaz responsiva
- Estados en tiempo real

## Uso

1. **Crear Pedido**: Acceder a "Nuevo Pedido" y completar los datos
2. **Gestionar Formatos**: Los formatos se crean automáticamente al crear un pedido
3. **Seguimiento**: Utilizar "Control Formatos" para el seguimiento individual
4. **Dashboard**: Supervisar métricas generales desde la página principal

## Datos de Prueba

El sistema inicia sin datos. Para probar:
1. Crear algunos pedidos de prueba
2. Editar formatos individuales para cambiar estados
3. Utilizar filtros y búsquedas
4. Observar métricas en el dashboard