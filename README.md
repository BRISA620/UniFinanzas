# UniFinanzas - Sistema de Gestión Financiera Personal

Sistema completo de gestión financiera personal con backend en Flask y frontend en React/TypeScript.

## Características Principales

- Registro e inicio de sesión de usuarios con JWT
- Registro rápido de gastos (< 5 segundos)
- Presupuesto semanal con indicador de riesgo (semáforo)
- Categorías personalizables con iconos y colores
- Metas de ahorro con seguimiento de progreso
- Reportes PDF y exportación CSV
- Simulador "¿Y si...?" para planificación
- Notificaciones y alertas configurables
- Auditoría de cambios (audit trail)
- Adjuntos de recibos/comprobantes

## Stack Tecnológico

### Backend
- Python 3.11+ con Flask
- PostgreSQL 15
- Redis (caché)
- Task queue local (tareas asíncronas en proceso)
- JWT para autenticación
- SQLAlchemy ORM
- MinIO (almacenamiento S3-compatible)

### Frontend
- React 18 con TypeScript
- Vite como bundler
- TailwindCSS para estilos
- React Router para navegación
- Axios para peticiones HTTP
- Zustand para estado global
- React Hook Form + Zod para formularios

## Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Python 3.11+ (para desarrollo local)
- PostgreSQL 15+ (si no usas Docker)

## Inicio Rápido con Docker

1. **Clonar el repositorio:**
```bash
cd unifinanzas
```

2. **Configurar variables de entorno:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Iniciar servicios con Docker Compose:**
```bash
docker-compose up -d
```

4. **Inicializar la base de datos:**
```bash
docker-compose exec backend python scripts/init_db.py
docker-compose exec backend python scripts/seed_data.py
```

5. **Acceder a la aplicación:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- MinIO Console: http://localhost:9001

**Usuario de prueba:**
- Email: test@example.com
- Password: Test1234!

## Desarrollo Local (Sin Docker)

### Backend

1. **Crear entorno virtual:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

3. **Configurar base de datos:**
- Crear base de datos PostgreSQL llamada `unifinanzas`
- Configurar `.env` con la URL de conexión

4. **Inicializar base de datos:**
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
python scripts/seed_data.py
```

5. **Ejecutar servidor:**
```bash
flask run
```

### Frontend

1. **Instalar dependencias:**
```bash
cd frontend
npm install
```

2. **Ejecutar servidor de desarrollo:**
```bash
npm run dev
```

## Estructura del Proyecto

```
unifinanzas/
├── backend/                 # API Flask
│   ├── app/
│   │   ├── api/            # Endpoints REST
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── services/       # Lógica de negocio
│   │   └── utils/          # Utilidades
│   ├── migrations/         # Migraciones Alembic
│   ├── tests/              # Tests unitarios
│   └── docker/             # Configuración Docker
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── api/           # Cliente API
│   │   ├── components/    # Componentes React
│   │   ├── context/       # Contextos React
│   │   ├── pages/         # Páginas
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils/         # Utilidades
│   └── public/            # Archivos estáticos
└── docker-compose.yml     # Orquestación Docker
```

## API Endpoints Principales

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/refresh` - Renovar token
- `GET /api/v1/auth/me` - Usuario actual

### Gastos
- `GET /api/v1/expenses` - Listar gastos
- `POST /api/v1/expenses` - Crear gasto
- `POST /api/v1/expenses/quick` - Registro rápido
- `PUT /api/v1/expenses/:id` - Actualizar gasto
- `DELETE /api/v1/expenses/:id` - Eliminar gasto

### Dashboard
- `GET /api/v1/dashboard/summary` - Resumen completo
- `GET /api/v1/dashboard/risk-indicator` - Indicador de riesgo

### Presupuestos
- `GET /api/v1/budgets/current` - Presupuesto activo
- `POST /api/v1/budgets` - Crear presupuesto

### Metas
- `GET /api/v1/goals` - Listar metas
- `POST /api/v1/goals` - Crear meta
- `POST /api/v1/goals/:id/contribute` - Aportar a meta

## Testing

### Backend
```bash
cd backend
pytest
pytest --cov=app tests/  # Con cobertura
```

### Frontend
```bash
cd frontend
npm test
npm run test:coverage
```

## Despliegue en Producción

1. **Configurar variables de entorno de producción**
2. **Construir imágenes Docker:**
```bash
docker-compose -f docker-compose.prod.yml build
```

3. **Configurar HTTPS con Nginx**
4. **Configurar backups de PostgreSQL**
5. **Monitoreo con herramientas como Prometheus/Grafana**

## Funcionalidades Pendientes (Roadmap)

- [ ] Notificaciones push con FCM
- [ ] Envío de emails con SendGrid
- [ ] Exportación a Google Sheets
- [ ] Cierre semanal automático
- [ ] Recomendaciones con IA
- [ ] App móvil (React Native)
- [ ] Multi-idioma (i18n)
- [ ] Temas oscuro/claro

## Seguridad

- Autenticación JWT con refresh tokens
- Contraseñas hasheadas con bcrypt
- Rate limiting en endpoints críticos
- Validación de entrada con Marshmallow/Zod
- CORS configurado correctamente
- Soft delete para auditoría
- Sanitización de inputs

## Contribuir

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## Licencia

MIT License - Ver archivo LICENSE para más detalles.

## Contacto

Para soporte o consultas, crear un issue en el repositorio.
