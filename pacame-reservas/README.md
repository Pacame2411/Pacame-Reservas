# Pacame Reservas

## Descripción del Proyecto
Pacame Reservas es un sistema avanzado de gestión de reservas multi-inquilino diseñado para permitir a múltiples restaurantes gestionar sus reservas y operaciones de manera eficiente. Los clientes pueden realizar reservas en línea de forma sencilla, mejorando la experiencia tanto para los administradores como para los usuarios finales.

## Tecnologías Utilizadas
- **Frontend:**
  - React (con hooks)
  - TypeScript
  - Vite (bundler)
  - Tailwind CSS (estilos)
  - date-fns (utilidades de fecha)
  - lucide-react (iconografía)

- **Backend & Base de Datos:**
  - Supabase (PostgreSQL para la base de datos)
  - Supabase Auth (autenticación de usuarios administradores)
  - Supabase Realtime (actualizaciones en vivo)

## Estructura del Proyecto
```
pacame-reservas
├── public
│   └── index.html
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── utils
│   │   └── supabase.ts
│   ├── services
│   │   ├── authService.ts
│   │   ├── reservationService.ts
│   │   ├── tableService.ts
│   │   ├── tableAssignmentService.ts
│   │   ├── configurationService.ts
│   │   ├── dashboardService.ts
│   │   ├── emailService.ts
│   │   ├── emailMarketingService.ts
│   │   └── businessAnalyticsService.ts
│   ├── components
│   │   ├── CustomerView.tsx
│   │   ├── ReservationForm.tsx
│   │   ├── LoginForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── ReservationDashboard.tsx
│   │   ├── ManualReservationForm.tsx
│   │   ├── ConfigurationPanel.tsx
│   │   ├── ReservationVisualization.tsx
│   │   ├── EmailNotificationPanel.tsx
│   │   ├── EmailMarketingDashboard.tsx
│   │   └── BusinessDashboard.tsx
│   ├── types
│   │   └── index.ts
│   ├── hooks
│   │   └── useAuth.ts
│   ├── routes
│   │   └── index.tsx
│   └── styles
│       └── tailwind.css
├── .env
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Configuración del Entorno
1. Clona el repositorio.
2. Instala las dependencias con `npm install`.
3. Configura las variables de entorno en el archivo `.env`:
   - `REACT_APP_SUPABASE_URL`: URL de tu proyecto Supabase.
   - `REACT_APP_SUPABASE_ANON_KEY`: Clave anónima de Supabase.

## Ejecución del Proyecto
Para iniciar el proyecto en modo desarrollo, ejecuta:
```
npm run dev
```

## Contribuciones
Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia
Este proyecto está bajo la Licencia MIT.