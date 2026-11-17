# API de tareas

API REST de gestión de tareas construida con **NestJS 11**, **TypeORM** y **SQLite**.
Permite crear, listar, consultar, editar y borrar tareas, con filtros por estado y
responsable, paginación, validación de entrada y esquema versionado en migraciones.

## Stack

| Pieza | Elección |
| --- | --- |
| Framework | NestJS 11 (Express) |
| Persistencia | TypeORM + SQLite (driver `better-sqlite3`) |
| Validación | `class-validator` / `class-transformer` vía `ValidationPipe` global |
| Documentación | Swagger en `/api/docs` |
| Tests | Jest (unitarios) + Supertest (e2e sobre SQLite en memoria) |

## Puesta en marcha

```bash
pnpm install
cp .env.example .env     # opcional: los valores por defecto ya funcionan
pnpm migration:run       # crea data/tasks.sqlite y aplica el esquema
pnpm start:dev           # API en http://localhost:3000/api
```

Documentación interactiva: <http://localhost:3000/api/docs>

### Variables de entorno

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `PORT` | `3000` | Puerto HTTP |
| `DB_PATH` | `./data/tasks.sqlite` | Fichero SQLite (lo usan la app y el CLI de migraciones) |
| `DB_LOGGING` | `false` | `true` para volcar las consultas SQL |

## Modelo de tarea

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | Generado por la API |
| `title` | string | Obligatorio, máx. 120 caracteres |
| `description` | string \| null | Opcional, máx. 1000 caracteres |
| `status` | enum | `pending` (pendiente), `in_progress` (en curso), `done` (hecha). Por defecto `pending` |
| `assignee` | string | Responsable (nombre o email), obligatorio, máx. 120 caracteres |
| `dueDate` | fecha ISO 8601 | Fecha límite, obligatoria |
| `createdAt` / `updatedAt` | fecha ISO 8601 | Gestionadas por la API |

## Endpoints

Todos bajo el prefijo `/api`.

| Método | Ruta | Éxito | Errores |
| --- | --- | --- | --- |
| `POST` | `/api/tasks` | `201` | `400` validación |
| `GET` | `/api/tasks` | `200` | `400` filtro o paginación inválidos |
| `GET` | `/api/tasks/:id` | `200` | `400` id no uuid, `404` no existe |
| `PATCH` | `/api/tasks/:id` | `200` | `400` validación, `404` no existe |
| `DELETE` | `/api/tasks/:id` | `204` | `400` id no uuid, `404` no existe |

### Listado: filtros y paginación

`GET /api/tasks` acepta:

| Parámetro | Por defecto | Descripción |
| --- | --- | --- |
| `status` | — | Filtra por estado (`pending`, `in_progress`, `done`) |
| `assignee` | — | Filtra por responsable (coincidencia exacta) |
| `page` | `1` | Página, mínimo 1 |
| `limit` | `10` | Tamaño de página, entre 1 y 100 |

Los resultados se ordenan por fecha límite ascendente y llegan envueltos con sus
metadatos de paginación:

```json
{
  "data": [
    {
      "id": "3d17b3ad-bf8a-4283-b3a4-e99f83aa3593",
      "title": "Preparar informe trimestral",
      "description": "Incluir cierre de Q4",
      "status": "pending",
      "assignee": "ana@acme.com",
      "dueDate": "2026-12-01T00:00:00.000Z",
      "createdAt": "2026-11-17T01:20:37.000Z",
      "updatedAt": "2026-11-17T01:20:37.000Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

Cualquier parámetro no reconocido devuelve `400`: el `ValidationPipe` se configura
con `whitelist` y `forbidNonWhitelisted`, así que un filtro mal escrito falla en vez
de ignorarse en silencio.

### Ejemplos

```bash
# Crear
curl -X POST localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Preparar informe","description":"Cierre Q4","assignee":"ana@acme.com","dueDate":"2026-12-01T00:00:00.000Z"}'

# Listar con filtros y paginación
curl 'localhost:3000/api/tasks?status=pending&assignee=ana@acme.com&page=1&limit=5'

# Ver, editar y borrar
curl localhost:3000/api/tasks/<id>
curl -X PATCH localhost:3000/api/tasks/<id> \
  -H 'Content-Type: application/json' -d '{"status":"in_progress"}'
curl -X DELETE localhost:3000/api/tasks/<id>
```

Respuesta de error, con el formato estándar de Nest:

```json
{
  "message": ["status debe ser uno de: pending, in_progress, done"],
  "error": "Bad Request",
  "statusCode": 400
}
```

## Migraciones

El esquema nunca se sincroniza automáticamente (`synchronize: false`): se versiona en
`src/database/migrations`. La app y el CLI comparten las opciones definidas en
[`src/config/database.config.ts`](src/config/database.config.ts).

```bash
pnpm migration:run                              # aplicar pendientes
pnpm migration:show                             # ver estado
pnpm migration:revert                           # deshacer la última
pnpm migration:generate src/database/migrations/NombreDelCambio  # generar desde las entidades
```

## Tests

```bash
pnpm test        # unitarios del servicio (repositorio mockeado)
pnpm test:e2e    # e2e con Supertest contra SQLite en memoria
pnpm test:cov    # cobertura
```

Los e2e arrancan la aplicación real sobre una base en memoria aplicando las
migraciones (`migrationsRun: true`), de modo que también validan el esquema
versionado, y cubren el ciclo completo del CRUD, los filtros, la paginación y los
códigos de error.

## Docker

```bash
docker compose up --build    # API en http://localhost:3000/api
```

El fichero SQLite se persiste en el volumen `./data`. Las migraciones se aplican al
arrancar el contenedor.

## Estructura

```
src/
├── common/dto/          DTO de paginación y envoltorio de resultados
├── config/              opciones de TypeORM compartidas por app y CLI
├── database/            DataSource del CLI y migraciones
├── tasks/               módulo de tareas (controlador, servicio, DTOs, entidad)
├── app.module.ts
├── app.setup.ts         prefijo y validación comunes a app y tests e2e
├── main.ts
└── swagger.setup.ts
test/
└── tasks.e2e-spec.ts
```

## Decisiones de diseño

- **`assignee` como texto** en lugar de una entidad `User`: el enunciado solo pide
  filtrar por responsable, así que una tabla de usuarios añadiría superficie sin
  aportar nada al caso de uso.
- **Identificadores y estados en inglés** (`in_progress`, `assignee`, `dueDate`)
  siguiendo la convención habitual del código, con el mapeo a los nombres del
  enunciado documentado arriba.
- **Sin filtro de excepciones propio**: los filtros por defecto de Nest ya producen
  el `statusCode` y el cuerpo correctos para `400`/`404`.
- **`findAndCount` con índices** en `status` y `assignee`, los dos campos por los que
  se filtra.
- **Fechas límite en el pasado permitidas**: exigir fecha futura impediría editar una
  tarea ya vencida.
