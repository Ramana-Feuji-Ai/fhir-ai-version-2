# IntelliJ / local run notes

## Prerequisites

- Java 21 (IntelliJ SDK)
- Node 20+ and Angular CLI 21 (for `apps/web`)
- Docker Desktop (for Postgres) **or** a local PostgreSQL 16 with DB/user from `docker-compose.yml`

## API (`apps/api`)

1. Start PostgreSQL (Docker: `docker compose up -d`, or local Postgres on `:5432`)
2. Open `apps/api/pom.xml` as a Maven project in IntelliJ
3. Align `application.yml` username/password with your Postgres user
4. Run `com.fhi.fhirlearning.FhirLearningApplication`
5. On startup, `CreateDatabaseEnvironmentPostProcessor` creates DB `fhir_learning` if missing
   (connects to maintenance DB `postgres`, then `CREATE DATABASE`)
6. Flyway `V1` + `ContentSeedRunner` load schema and SPA content

Health check (requires Bearer token after login): `GET http://localhost:8080/api/v1/curriculum/summary`

### Auth (JWT)

| Item | Value |
|------|--------|
| Register | `POST /api/v1/auth/register` `{ email, password, displayName }` |
| Login | `POST /api/v1/auth/login` `{ email, password }` |
| Me | `GET /api/v1/auth/me` (Bearer) |
| Demo user | `mr@fhi.local` / `ChangeMe123!` |

Angular stores the JWT and sends `Authorization: Bearer …` on API calls. Unauthenticated users are redirected to `/login`.

**Note:** The DB user needs `CREATEDB` (default `postgres` superuser has it).

## Web (`apps/web`)

If you already have an Angular 21 workspace, either:

- Use this `apps/web` project as-is (`npm install && npm start`), or
- Copy `src/app/**`, `src/assets/styles/fhi-fhir-learning.css`, and `proxy.conf.json` into your existing project and wire routes/styles.

Dev proxy forwards `/api` → `http://localhost:8080`.
